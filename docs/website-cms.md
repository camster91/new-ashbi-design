# Website editorial workflow

## Supported editorial types

The authenticated gateway provides `/admin/content`: select Homepage, any of the four services, or any of the five campaigns. Edit the supported plain-text fields, save a private draft, review the saved copy, explicitly approve it and download its document-specific `/admin/content/export`. The dashboard links to this editor when the content store is configured. No extra account or client database is introduced.

Text has required/max-length validation and cannot contain HTML. The public Astro build validates and escapes the committed JSON. Homepage: five introductions/labels. Services: introduction and audience fit. Campaigns: headline, introduction, audience question/explanation and a project description where the campaign uses one. Links, images, prices, role credits, service deliverables and the featured sequence remain source-controlled. A save removes approval. Revision checks prevent another tab's save from being overwritten. A changed source baseline blocks saving/export until explicitly reconciled.

The store runs with the gateway's single-instance model. Drafts use atomic file replacement and private file/directory permissions under `/data/content/`. Each document has its own state file and history directory. Every mutation preserves the prior revision before replacing current state. The editor lists the most recent 20 revisions; older files remain available in the private backup. Restore creates a fresh unapproved draft and rejects stale or incompatible source revisions. An invalid save preserves entered words for correction while the review continues to show persisted content. Include this directory in existing private volume backups. It contains editorial content, not lead personal data. Staff login and CSRF protection apply to mutations; authenticated exports are no-store. Mailgun is not needed to edit content.

## Review and build

1. Sign in, save a draft and review its factual claims. The editor's review is a text review, not a full rendered page preview.
2. Approve the saved revision and download its JSON export privately.
3. Validate it without modifying source:

   `node --experimental-strip-types ops/apply-content.mjs /absolute/path/ashbi-home-approved.json`

4. Apply locally with the same command plus `--apply`. A named backup is created in ignored `data/content-backups/`; the source diff is reviewable in `src/data/home-content.json` or `src/data/editorial-content.json`. The latter is the single editable text source for services and campaigns; structural data stays in its existing models.
5. Run typecheck, tests, production build, `npm run check:content` and links; review the rendered desktop/mobile page. Commit approved content, then follow the existing authorized preview release workflow. Approval in the CMS does not authorize deployment.

The CLI rejects exports based on a different committed baseline. To reconcile a stale draft, preserve its JSON and the private content file, compare edits against the new source, then create a new draft using the current base. Do not silently overwrite either copy. Multi-process editing, arbitrary uploads, scheduling and automatic publication are not supported in this slice.

## Integration boundary

The Hub remains the owner of leads, clients, projects and portals. CMS drafts do not send data to Hub or third parties. The future staff UI can consume this editorial contract after authenticated integration is reviewed. The legacy WordPress bridge was removed from the current Hub and is not assumed to be an Astro CMS.

## Deployment

Gateway image must include `server/`, `src/lib/content.ts`, `src/lib/enquiry.ts` and `src/data/home-content.json` and `src/data/editorial-content.json` (updated `server/Dockerfile`). Static-site CI does not promote the gateway. Keep the current gateway image and private volume backup before an approved CMS gateway release; rollback the image without deleting the saved drafts. Server startup fails on malformed draft state rather than silently discarding it.

## Verification — 28 September continuation

Local campaign save → approve → export → restore flow verified with fabricated isolated data at 375 px, with no horizontal overflow. Restore removed the export action and returned original source words as a draft. Tests cover document separation, stale/unknown/type-confused exports, history/restart, restore confirmation and CSRF, and invalid-save recovery. All 32 tests, typecheck, the 75-page production build, 42 CMS fields across 10 built page bodies, and 3,149 local links/assets plus 295 fragments passed. Public deployment and Hub delivery remain separate gates. Articles, project editing and approved-asset selection are subsequent supported-type increments, not completed by this change.
