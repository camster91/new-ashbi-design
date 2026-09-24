#!/usr/bin/env python3
"""Receive one CI-built static archive for the Ashbi VPS preview.

The SSH key that invokes this file is restricted to this command. It runs as
ashbi-preview-deploy, which owns only the preview's auto-release directory.
"""

import fcntl
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import sys
import tarfile
import tempfile
import urllib.request


BASE = Path("/srv/ashbi-astro-preview/auto")
RELEASES = BASE / "releases"
CURRENT = BASE / "current"
MAX_ARCHIVE = 120 * 1024 * 1024
MAX_EXTRACTED = 350 * 1024 * 1024
MAX_FILES = 5000


def fail(message: str) -> None:
    raise RuntimeError(message)


def switch_to(target: Path) -> None:
    temporary_link = BASE / f".current-{os.getpid()}"
    temporary_link.symlink_to(target)
    os.replace(temporary_link, CURRENT)


def get(url: str) -> bytes:
    with urllib.request.urlopen(url, timeout=12) as response:
        if response.status != 200:
            fail(f"Health check returned {response.status}: {url}")
        return response.read(1024 * 1024)


def verify_live(commit: str) -> None:
    for origin in ("http://127.0.0.1:3112", "https://preview.ashbi.ca"):
        marker = json.loads(get(f"{origin}/_release.json"))
        if marker.get("commit") != commit:
            fail(f"Release marker mismatch at {origin}")
        for route in ("/", "/services/", "/contact/", "/work/", "/admin/"):
            get(f"{origin}{route}")


def extract_safe(archive: Path, destination: Path) -> None:
    count = 0
    total = 0
    with tarfile.open(archive, "r:gz") as package:
        for member in package:
            count += 1
            total += member.size
            if count > MAX_FILES or total > MAX_EXTRACTED:
                fail("Archive exceeds preview limits")
            name = PurePosixPath(member.name)
            if name == PurePosixPath(".") and member.isdir():
                continue
            if name.is_absolute() or ".." in name.parts or not name.parts:
                fail("Archive contains an unsafe path")
            if not (member.isdir() or member.isfile()):
                fail("Archive contains a non-file entry")
            target = destination.joinpath(*name.parts)
            if member.isdir():
                target.mkdir(parents=True, exist_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                source = package.extractfile(member)
                if source is None:
                    fail("Archive file could not be read")
                with source, target.open("xb") as output:
                    shutil.copyfileobj(source, output)
                target.chmod(0o644)


def deploy() -> None:
    header = sys.stdin.buffer.readline(200).decode("ascii").strip().split()
    if len(header) != 2:
        fail("Expected commit and archive checksum")
    commit, expected_hash = header
    if not re.fullmatch(r"[0-9a-f]{40}", commit) or not re.fullmatch(r"[0-9a-f]{64}", expected_hash):
        fail("Invalid commit or checksum")

    RELEASES.mkdir(parents=True, exist_ok=True)
    with (BASE / "deploy.lock").open("a+b") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        with tempfile.TemporaryDirectory(prefix="incoming-", dir=BASE) as incoming:
            archive = Path(incoming) / "site.tar.gz"
            digest = hashlib.sha256()
            size = 0
            with archive.open("wb") as output:
                while chunk := sys.stdin.buffer.read(1024 * 1024):
                    size += len(chunk)
                    if size > MAX_ARCHIVE:
                        fail("Archive exceeds preview limit")
                    digest.update(chunk)
                    output.write(chunk)
            if digest.hexdigest() != expected_hash:
                fail("Archive checksum mismatch")

            release = RELEASES / f"{commit}-{expected_hash[:12]}"
            if not release.exists():
                stage = Path(incoming) / "site"
                stage.mkdir()
                extract_safe(archive, stage)
                marker = json.loads((stage / "_release.json").read_text())
                if marker.get("commit") != commit:
                    fail("Archive release marker mismatch")
                for required in ("index.html", "services/index.html", "contact/index.html", "work/index.html", "404.html"):
                    if not (stage / required).is_file():
                        fail(f"Missing required page: {required}")
                stage.rename(release)

        previous = CURRENT.resolve(strict=True)
        if not previous.is_relative_to(RELEASES.resolve()) and previous != (BASE / "bootstrap").resolve():
            fail("Current release points outside preview releases")
        switch_to(release)
        try:
            verify_live(commit)
        except Exception:
            switch_to(previous)
            raise
        print(f"Preview deployed {commit} ({expected_hash})")


if __name__ == "__main__":
    try:
        deploy()
    except Exception as error:
        print(f"Preview deployment failed: {error}", file=sys.stderr)
        sys.exit(1)
