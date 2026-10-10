# Website editorial workflow

## Supported editorial types

The authenticated gateway provides `/admin/content`: select Homepage, any of the four services, any of the five campaigns, 14 current commerce projects or 12 Insights articles. A grouped document selector keeps the editor usable on mobile. Edit the supported plain-text fields, save a private draft, review the saved copy, explicitly approve it and download its document-specific `/admin/content/export`. The dashboard links to this editor when the content store is configured. No extra account or client database is introduced.

Text has required/max-length validation. Plain fields cannot contain HTML. Article bodies allow balanced p, h2, h3, ul, ol, li, strong and em tags, plus HTTPS anchors to the existing reviewed reference hosts. Scripts, media, styles, arbitrary attributes and unapproved reference hosts are rejected. The public Astro build validates and escapes the committed JSON. Homepage: five introductions/labels. Services: introduction and audience fit. Campaigns: headline, introduction, audience question/explanation and a project description where the campaign uses one. Project introductions, context, approach and supported outcomes are editable. Article titles, summaries and bodies are editable; card titles are exposed only where used. Project card and case-study images can be selected from that project’s source-controlled local asset catalog. The picker retains source alt text, excludes Marin tote-focused choices and exposes original BPM Figma exports. Arbitrary URLs, paths, uploads and cross-project assets are rejected. Routes, prices, role credits, service deliverables and the featured sequence remain source-controlled. A save removes approval. Revision checks prevent another tab's save from being overwritten. A changed source baseline blocks saving/export until explicitly reconciled.

The store runs with the gateway's single-instance model. Drafts use atomic file replacement and private file/directory permissions under `/data/content/`. Each document has its own state file and history directory. Every mutation preserves the prior revision before replacing current state. The editor lists the most recent 20 revisions; older files remain available in the private backup. Restore creates a fresh unapproved draft and rejects stale or incompatible source revisions. An invalid save preserves entered words for correction while the review continues to show persisted content. Include this directory in existing private volume backups. It contains editorial content, not lead personal data. Staff login and CSRF protection apply to mutations; authenticated exports are no-store. Mailgun is not needed to edit content.

## Review and build

### Reconcile a changed source baseline

When the editor says the source changed, compare **Current website source** with **Saved draft**. Confirm that you want to keep the saved words, then choose **Reconcile saved draft**. The server checks both the saved revision and current source baseline, archives the previous revision, and keeps the saved copy as a new unapproved draft. Reload and review again if either guard changed. Reconciliation does not approve, export or publish the copy; the normal review and approval steps still apply. Earlier history remains available, but incompatible older-source revisions cannot be restored directly.

1. Sign in, save a draft and review its factual claims. The editor's review is a text review, not a full rendered page preview.
2. Approve the saved revision and download its JSON export privately.
3. Validate it without modifying source:

   `node --experimental-strip-types ops/apply-content.mjs /absolute/path/ashbi-home-approved.json`

4. Apply locally with the same command plus `--apply`. A named backup is created in ignored `data/content-backups/`; the source diff is reviewable in `src/data/home-content.json` or `src/data/editorial-content.json`. The latter is the single editable text source for services and campaigns; structural data stays in its existing models.
5. Run typecheck, tests, production build, `npm run check:content` and links; review the rendered desktop/mobile page. Commit approved content, then follow the existing authorized preview release workflow. Approval in the CMS does not authorize deployment.

The CLI rejects exports based on a different committed baseline. To reconcile a stale draft, preserve its JSON and the private content file, compare edits against the new source, then create a new draft using the current base. Do not silently overwrite either copy. Multi-process editing, arbitrary uploads, scheduling and automatic publication are not supported in this slice.

## Rendered local draft preview

Download **saved draft for layout preview** from the editor. This authenticated, no-store export has type `ashbi-draft` and cannot be applied by the release command. To render it in the actual Astro layouts:

```
npm run preview:content -- /absolute/path/ashbi-project-bpm-draft.json /tmp/ashbi-new-draft-preview
cd /tmp/ashbi-new-draft-preview
node node_modules/astro/bin/astro.mjs preview --host 127.0.0.1 --port 4357
```

Use the route reported by the preview command. It creates a new private directory, copies source without `.env` or credentials, reuses public assets/dependencies, validates the draft's source baseline and builds all pages. Existing directories are rejected. The working checkout and approval state are unchanged. The output has a draft banner, draft titles and `noindex`, with direct enquiry submission disabled. The release content gate rejects draft-banner builds. Stop the local server with Ctrl+C after review. Keep draft exports and directories private; they are review artifacts and must never be uploaded as a release.

This is a local build preview, not a one-click hosted preview or public self-service publication. New images remain a reviewed asset-catalog change. Older saved project narrative drafts remain readable after the selector schema is introduced, but their old baseline blocks writes, preview and release export until reconciled.

## Integration boundary

The Hub remains the owner of leads, clients, projects and portals. CMS drafts do not send data to Hub or third parties. The future staff UI can consume this editorial contract after authenticated integration is reviewed. The legacy WordPress bridge was removed from the current Hub and is not assumed to be an Astro CMS.

## Deployment

The reviewed proxy configuration adds a 512 KB limit only for `/admin/content/save`; the authenticated application caps this at 500,000 bytes to accommodate encoded article bodies. Other admin routes retain 12 KB and public enquiries retain 8 KB. Apply and syntax-check this proxy change only during an authorized gateway release; the live proxy has not been changed.

Gateway image must include `src/lib/editorial-assets.ts` and `src/data/editorial-assets.json` in addition to `server/`, `src/lib/content.ts`, `src/lib/enquiry.ts` and `src/data/home-content.json` and `src/data/editorial-content.json` (updated `server/Dockerfile`). Static-site CI does not promote the gateway. Keep the current gateway image and private volume backup before an approved CMS gateway release; rollback the image without deleting the saved drafts. Server startup fails on malformed draft state rather than silently discarding it.

## Verification — 28 September continuation

Local campaign save → approve → export → restore flow verified with fabricated isolated data at 375 px, with no horizontal overflow. Restore removed the export action and returned original source words as a draft. Tests cover document separation, stale/unknown/type-confused exports, history/restart, restore confirmation and CSRF, and invalid-save recovery. All 32 tests, typecheck, the 75-page production build, 42 CMS fields across 10 built page bodies, and 3,149 local links/assets plus 295 fragments passed. Public deployment and Hub delivery remain separate gates. The subsequent local article/project increment supports 36 documents and 134 rendered fields. All 34 tests, typecheck, the 75-page build and link/fragment checks pass. Migration verified 92 text fields against the prior committed source. Local browser review verified article save at 375 px and project editor/selector at 1440 px without overflow. The next local checkpoint adds verified project image selection and full-layout local draft builds. Hosted staff previews and automatic publication remain separate integration work.

## Image-selection and rendered-preview verification

38 tests pass, plus typecheck, a 75-page production build, 162 editable text/asset placements across 36 routes, and all existing links/fragments. A separate fabricated BPM draft changed both its card and hero to the original product-page export; the isolated full-site build passed its content checks. Browser review at 375 and 1440 px confirmed the selected image, draft copy, noindex/banner, no horizontal overflow and no broken images on the reviewed desktop page. Committed project copy/default images remained unchanged. No push, gateway release, hosted preview, visitor data or external communication occurred.

## Hosted-preview worker preparation — 28 September 2026

The existing isolated builder now uses a fixed environment allowlist: OS path/temp/locale values only, draft banner/noindex and disabled enquiry routing. Gateway encryption keys, setup tokens, Mailgun credentials, GitHub tokens, arbitrary public telemetry variables and NODE_OPTIONS are not inherited by the Astro child. Each build has a 90-second deadline; overdue children receive TERM then KILL, and completion is reported only after child close. Compiler output is bounded to 20,000 characters and remains a private diagnostic.

`server/content-preview-queue.mjs` implements the next worker layer: one build at a time, coalescing the same document/revision/baseline, at most eight retained jobs, generated private output paths, generic failure status and 30-minute completed-job expiry. Expired owned directories are removed on the next request. Active jobs cannot expire mid-build. This module is not wired into admin or deployed: authenticated request/status/artifact routes, a safe rendered-view policy, restart cleanup, gateway packaging and the reviewed publication handoff remain required. The source checkout must match the draft baseline; CMS approval remains separate from deployment authority.

Local verification: 46 tests pass, including isolated worker environment, real overdue-child termination, bounded output, queue serialization/coalescing/capacity/expiry and failure privacy. A real fabricated homepage draft built successfully through the restricted runner, passing all 162 CMS placements across 36 routes without changing committed copy. Typecheck remains required after each checkpoint. No hosted preview or publication was enabled.

## Admin layout preview — local implementation, 28 September 2026

With the optional preview runtime configured, the editor offers **Build saved draft layout preview**. The POST requires the existing admin session, CSRF token and exact saved revision; stale/source-changed drafts cannot start a build. The status page identifies the snapshot revision and warns if the current draft subsequently changes. Ready previews open the actual built page under authenticated `/admin/content/preview/<job-id>/…`; every HTML, CSS, image and font request requires login. Expired jobs return unavailable. Logout removes access.

The served viewer is deliberately a **static editorial layout review**: CSP disables scripts, connections, forms and frames; script tags and meta refresh are removed, local assets/navigation are confined to the job prefix. Traversal, encoded traversal, backslashes, symlinks escaping the build, JSON/private files and script responses are rejected. The draft banner and a return-to-review control remain visible. Use the normal reviewed website preview for motion, menu, carousel and booking/form journeys; this viewer cannot establish interactive acceptance or authorize publication.

The optional runtime reads `CONTENT_PREVIEW_SOURCE_ROOT` from private operator configuration and builds a trusted matching source release, never arbitrary uploaded code. `server/Dockerfile` exposes an explicit `cms-preview` target with source/assets/build tools; the final default target remains the existing editor-only gateway. The private `/data` volume and single-instance deployment requirement still apply. Graceful shutdown waits for the current bounded build then removes that session's temporary previews. Expired abandoned session directories are now swept on startup and every five minutes, using explicit ownership markers; an abandoned worker lock requires verified operator recovery before restart; do not enable this runtime without a reviewed capacity/retention policy. The stock gateway does not receive build controls when the runtime is absent.

Verification: 48 tests cover queue/build isolation and real admin HTTP requests (login, CSRF, stale revision, authenticated assets, logout, changed-copy warning), plus path confinement and CSP. Typecheck passes. In a disposable local fixture, a real saved homepage draft completed a full Astro build and opened through authenticated preview routes. Browser review at 375 and 1440 px showed the fabricated draft, zero broken images, no horizontal overflow and no script elements. Evidence is in the task's `outputs/cms-hosted-preview-review-2026-09-28/`. No real account credentials, Mailgun calls, Hub submissions, source publication or deployment occurred. Docker image build remains unverified because the daemon was unavailable. Hosted target rollout, staff acceptance and the approved publication handoff remain open.


## Preview restart ownership and release handoff

`server/content-preview-workspace.mjs` exclusively creates the preview worker lock. A second worker is rejected. Each session is marked with its generated directory name and creation time; only matching, expired directories can be removed. Unmarked directories and symlinks are preserved, and the current active session is excluded. Graceful shutdown waits for its bounded build, removes only its own session and releases only its own lock token. A leftover lock after a hard crash is never silently removed: the operator must verify the previous container/process stopped, preserve the lock as a named recovery record, and remove the stale active lock before restart. Single-instance deployment and private volume access remain required. Validate this recovery in the approved container environment before activation.

The CMS publication handoff continues through approved exports, source review and the existing GitHub release workflow. Admin layout review is not deployment permission. Download the current approved export, dry-run `ops/apply-content.mjs`, apply it in an isolated review checkout with the named backup, inspect the source diff and affected layouts, run the release checks and prepare the commit/PR. Push/merge and hosted preview release require the separately authorized action. Verify the deployed `_release.json` and affected pages after release. Main-domain launch remains separate. Do not provide a public publish button until this reviewed source-and-release path is connected with explicit authority, provenance and rollback.

Restart tests cover expired owned sessions, preservation of unmarked/symlinked files, active-session exclusion, repeated release, exclusive locking and retained stale-lock recovery evidence. 51 tests and typecheck passed locally. Container build/restart and hosted staff review remain unverified.

The optional runtime was also started as real isolated Node processes: health readiness, rejection of a second worker, graceful shutdown preserving editorial data, and cleanup after an occupied-port startup failure all pass. This is local process evidence; Docker and hosted activation remain unverified.

## Multi-document release candidate

`npm run prepare:content-release -- /new/private/candidate-directory approved-home.json approved-service.json`

Use exports downloaded after approving saved revisions in the private editor. The parent directory must already exist; the candidate directory must be new and outside the checkout (or under ignored `data/`). The command rejects drafts, duplicate documents, empty changes, stale baselines and unsupported editorial fields before preparing a candidate. Export approval metadata is a review record, not a digital signature: only use exports from the authenticated editor and review their diff.

The command copies source and public assets into a private workspace, supplies no gateway/GitHub/Mailgun keys to the builder, and keeps named rollback content copies. It performs a full Astro build, local link/fragment checks and body/asset CMS checks. The manifest binds the source and result to content digests of all actual source/public/config/lockfile inputs; changes during copying or building prevent a ready manifest. It records every changed field and approval revision. This review artifact uses the preview canonical destination with enquiries unconfigured; final CI settings and hosted acceptance remain separate.

Review `REVIEW.md`, `release-candidate.json` and the changed pages in `workspace/dist`. Apply the original approved exports to the reconciled checkout using `ops/apply-content.mjs`, review/commit the diff, and follow the existing approved repository release path. The tool does not apply source edits, publish, push, merge, deploy, configure the Hub or send email. Rollback copies must only be used against the corresponding result baseline so they cannot overwrite newer accepted work.

Verified locally: fabricated one- and two-document candidates built successfully, all 162 CMS placements and local links passed, source digests stayed unchanged, and the result digest reflected only the approved edits. Unit coverage includes duplicate/stale/unapproved/structural changes and input/asset tampering. Candidate preparation does not establish hosted CMS or live release acceptance.

## Hosted CMS deployment — 28 September 2026

User approved the CMS/admin deployment and editable settings continuation. Gateway `ashbi-enquiry-gateway-preview-ee84464` now runs the `cms-preview` target from commit `ee84464a02cd67c7c869efb1f0818c512d302334`, preserving the existing encryption key, setup token and private `/data` volume. The source differs from the prior static release only by disabling Astro telemetry in the isolated builder and moving Astro/Vite caches into each build workspace. These fixes were found by running the actual read-only Docker image.

The VPS isolated container completed a real homepage draft build with network disabled, read-only root, one CPU and a 1 GiB memory limit; all 162 CMS placements across 36 page bodies passed. Live gateway retains read-only root, dropped capabilities, no-new-privileges, 128 PID limit, the private network/IP/alias, no host ports, one CPU and a 1 GiB memory cap. Draft queue retention remains eight jobs and 30 minutes. The scoped 512 KB save route passed `nginx -t` and was applied with a reload. Gateway health returned 200.

Private deployment/rollback evidence is under `/srv/ashbi-astro-preview/gateway-releases/ee84464/`: previous container inspect, preserved runtime env, pre-release data archive, previous proxy configuration, and source/image manifest. These files contain private configuration; do not attach or print them. Previous gateway `ashbi-enquiry-gateway-preview-b16e665` is stopped and disconnected, retained for rollback. Restore its original private network address/alias only after stopping/disconnecting the replacement; restore the saved proxy configuration in place and validate/reload nginx. Preserve newer CMS drafts when rolling back; do not overwrite the data volume blindly.

53 tests and typecheck passed. Static-site GitHub run 36499508822 succeeded; public `_release.json` matches `ee84464`. Live `/admin/` returns the one-time setup page for Cameron, with `Cache-Control: no-store`. Unauthenticated content/export/preview requests redirect to setup; no draft/export is exposed. No real account password or Mailgun key was created. Hosted authenticated save/build/export acceptance needs Cameron to complete setup. Browser verification was unavailable at the final check, so the setup page was verified over HTTPS, not claimed as a new visual review.

Hub HTTPS remains healthy, but `GET https://hub.ashbi.ca/api/client-acquisition/config` returns 404 in the currently deployed Hub. Website-to-Hub intake is therefore not enabled. Updating the Hub runtime and verifying authenticated staff/portal flows remains separate unfinished integration work.
