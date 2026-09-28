# Website editorial workflow

## Supported first slice

The authenticated gateway provides `/admin/content`: edit five homepage text fields, save a private draft, review the saved copy, explicitly approve it and download `/admin/content/export`. The dashboard links to this editor when the content store is configured. No extra account or client database is introduced.

Text has required/max-length validation and cannot contain HTML. The public Astro build validates and escapes the committed JSON. Links, images, prices, role credits and the featured sequence are not editable in this first slice. A save removes approval. Revision checks prevent another tab's save from being overwritten. A changed source baseline blocks saving/export until explicitly reconciled.

The store runs with the gateway's single-instance model. Drafts use atomic file replacement and private file/directory permissions in `/data/content/home.json`. Include this directory in existing private volume backups. It contains editorial content, not lead personal data. Staff login and CSRF protection apply to mutations; authenticated exports are no-store. Mailgun is not needed to edit content.

## Review and build

1. Sign in, save a draft and review its factual claims. The editor's review is a text review, not a full rendered page preview.
2. Approve the saved revision and download its JSON export privately.
3. Validate it without modifying source:

   `node --experimental-strip-types ops/apply-content.mjs /absolute/path/ashbi-home-approved.json`

4. Apply locally with the same command plus `--apply`. A named backup is created in ignored `data/content-backups/`; the source diff is reviewable in `src/data/home-content.json`.
5. Run typecheck, tests, production build and links; review the rendered desktop/mobile page. Commit approved content, then follow the existing authorized preview release workflow. Approval in the CMS does not authorize deployment.

The CLI rejects exports based on a different committed baseline. To reconcile a stale draft, preserve its JSON and the private content file, compare edits against the new source, then create a new draft using the current base. Do not silently overwrite either copy. Multi-process editing, arbitrary uploads, scheduling and automatic publication are not supported in this slice.

## Integration boundary

The Hub remains the owner of leads, clients, projects and portals. CMS drafts do not send data to Hub or third parties. The future staff UI can consume this editorial contract after authenticated integration is reviewed. The legacy WordPress bridge was removed from the current Hub and is not assumed to be an Astro CMS.

## Deployment

Gateway image must include `server/`, `src/lib/content.ts`, `src/lib/enquiry.ts` and `src/data/home-content.json` (updated `server/Dockerfile`). Static-site CI does not promote the gateway. Keep the current gateway image and private volume backup before an approved CMS gateway release; rollback the image without deleting the saved drafts. Server startup fails on malformed draft state rather than silently discarding it.
