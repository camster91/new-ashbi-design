import hashlib
import importlib.util
import io
from pathlib import Path
import sys
import tarfile
import tempfile
import unittest
from unittest.mock import patch


MODULE_PATH = Path(__file__).parents[1] / "preview-receive.py"
spec = importlib.util.spec_from_file_location("preview_receive", MODULE_PATH)
preview = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preview)
COMMIT = "a" * 40


def archive(files: dict[str, bytes]) -> bytes:
    output = io.BytesIO()
    with tarfile.open(fileobj=output, mode="w:gz") as package:
        for name, content in files.items():
            entry = tarfile.TarInfo(name)
            entry.size = len(content)
            package.addfile(entry, io.BytesIO(content))
    return output.getvalue()


class PreviewDeployTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        root = Path(self.temp.name)
        preview.BASE = root
        preview.RELEASES = root / "releases"
        preview.CURRENT = root / "current"
        bootstrap = root / "bootstrap"
        bootstrap.mkdir()
        preview.CURRENT.symlink_to(bootstrap)

    def deploy(self, package: bytes, health_check):
        digest = hashlib.sha256(package).hexdigest()
        stream = io.TextIOWrapper(io.BytesIO(f"{COMMIT} {digest}\n".encode() + package))
        with patch.object(preview.sys, "stdin", stream), patch.object(preview, "verify_live", side_effect=health_check):
            preview.deploy()

    def test_valid_archive_switches_release(self):
        files = {name: b"page" for name in (
            "index.html", "services/index.html", "contact/index.html",
            "work/index.html", "404.html"
        )}
        files["_release.json"] = f'{{"commit":"{COMMIT}"}}'.encode()
        self.deploy(archive(files), lambda commit: self.assertEqual(commit, COMMIT))
        self.assertEqual((preview.CURRENT / "_release.json").read_bytes(), files["_release.json"])

    def test_failed_health_check_restores_previous_release(self):
        files = {name: b"page" for name in (
            "index.html", "services/index.html", "contact/index.html",
            "work/index.html", "404.html"
        )}
        files["_release.json"] = f'{{"commit":"{COMMIT}"}}'.encode()
        with self.assertRaisesRegex(RuntimeError, "offline"):
            self.deploy(archive(files), lambda _: (_ for _ in ()).throw(RuntimeError("offline")))
        self.assertEqual(preview.CURRENT.resolve(), (preview.BASE / "bootstrap").resolve())

    def test_symlink_in_archive_is_rejected(self):
        output = io.BytesIO()
        with tarfile.open(fileobj=output, mode="w:gz") as package:
            entry = tarfile.TarInfo("index.html")
            entry.type = tarfile.SYMTYPE
            entry.linkname = "/etc/passwd"
            package.addfile(entry)
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaisesRegex(RuntimeError, "non-file"):
                path = Path(directory) / "site.tar.gz"
                path.write_bytes(output.getvalue())
                preview.extract_safe(path, Path(directory) / "site")


if __name__ == "__main__":
    unittest.main()
