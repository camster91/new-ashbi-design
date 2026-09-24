# VPS preview deployment

Every push to `main` runs `Astro site checks`. After the typecheck, tests, and build pass, the workflow packages the exact built `dist/` directory with a public `_release.json` commit marker. The deploy job transfers that artifact over SSH to the dedicated `ashbi-preview-deploy` account on the VPS. Pull requests run checks without deploying.

The deploy account has a restricted SSH key that invokes only `ops/preview-receive.py`. It owns `/srv/ashbi-astro-preview/auto`, not Docker, Traefik, the enquiry gateway, or its private data. The receiver checks the archive checksum, rejects links and unsafe paths, extracts a versioned release, then atomically switches `auto/current`. It checks the commit marker and key pages on both localhost and public HTTPS. A failed check restores the previous symlink. Releases remain on disk for recovery.

The one-time VPS setup runs `ashbi-astro-preview-auto` on the existing `ashbi-preview-private` Docker network, bound only to `127.0.0.1:3112`. Its read-only Nginx configuration is `ops/preview-nginx.conf`; `/admin/` and `/api/enquiries` continue to proxy to the existing private gateway. Traefik's `preview.ashbi.ca` route points to this port. The former `ashbi-astro-preview-v9` container on port 3111 remains a manual rollback path. The `ashbi.ca` production route is unchanged.

Repository Actions configuration:

| Name | Purpose |
|---|---|
| `PREVIEW_DEPLOY_KEY` (secret) | Dedicated SSH private key; no passphrase, allowed only for the restricted receiver |
| `PREVIEW_DEPLOY_KNOWN_HOSTS` (secret) | Pinned VPS SSH host key |
| `PREVIEW_DEPLOY_HOST` (variable) | VPS IP or hostname |

The `preview` GitHub environment records deployments. The workflow has read-only repository permission and serializes preview deploy jobs. If a newer commit has reached `main`, an older queued job skips deployment.

To verify a release, compare `https://preview.ashbi.ca/_release.json` with the successful workflow's SHA, then review the rendered homepage, Services, Work, Contact, booking link, mobile navigation, and admin availability. The release marker proves which static commit is served; it does not prove appointment completion or enquiry delivery.

For a manual rollback, restore the previous `auto/current` symlink target and check the public marker and pages. If the auto container or proxy fails, restore the saved Traefik route to port 3111. Keep the corresponding release directory until recovery is verified. Do not repoint the production domain as part of this runbook.
