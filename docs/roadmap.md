# Ashbi website and Hub delivery roadmap

Canonical scope for this continuation, 28 September 2026. Historical plans remain design/source references; this file records current sequence and ownership. Active goal: finish the approved website, marketing and editorial system and connect it to the existing Hub without duplicating agency operations.

## Verified ownership

- `camster91/new-ashbi-design`: Astro public website, source portfolio, services, Insights, campaigns, booking and the isolated enquiry/settings gateway. Local HEAD before this increment: `2d5f3f8`; 30 commits ahead of the last fetched origin/main. No deployment in this continuation.
- `camster91/ashbi-platform`: existing Hub, inspected locally at `90838ef`. Fastify/Prisma backend, React UI, clients, projects, staff and client portals already exist. Remote main was verified at `e8a0e5e`; current product status names #393 as the replacement roadmap, with #290/#291 being reconciled. Its README describes production-deployed code; this continuation has not verified the live Hub.
- Website CMS owns public editorial content only. Hub owns leads converted to clients, projects and private portals. Do not create another CRM, project system or portal in the website gateway.

## Delivery sequence and acceptance

| Work | State | Acceptance and remaining action |
|---|---|---|
| Website/CRO fixes | Implemented locally | Release approved candidate, verify exact marker and mobile/desktop landing → proof → service → brief/calendar journeys |
| Homepage CMS | First vertical slice implemented | Authenticated plain-text draft/edit/review, stale-write protection, approval/export, validated source application, unchanged default build. Local 375/1440 editor review, save/approve/export flow, 30 tests, typecheck, 75-page build and built-link checks pass. Gateway/static release remains separate |
| CMS expansion | Project/article editing implemented locally | 36 records cover homepage, four services, five campaigns, 14 commerce projects and 12 articles, including restricted article-body formatting. 38 tests, typecheck, 162 CMS text/asset placements in 36 built page bodies and all local links/fragments pass. Mobile article saving and desktop project editing reviewed. Verified project asset selection and isolated full-layout local draft builds are implemented. Authenticated static layout preview is implemented and locally reviewed; hosted runtime/container verification, candidate review/release and live Hub activation remain. A multi-document candidate tool now binds approved edits to source/result digests, named rollback copies and isolated build/link/content checks. Protect role/source credits, prices, routes and featured ordering from accidental edits |
| Hub lead connection | Local adapter and rendered review complete, target review pending | Use the existing governed `/api/client-acquisition/config` and `/intake` contract (#426), with explicit origin, organization/owner, privacy version and idempotency gates. Verify isolated integration and target configuration before sending visitor data |
| Hub projects/client portals | Existing code, target verification pending | Reuse existing modules and issue acceptance criteria; verify staff/client boundaries and isolated lead → client → project → portal journey before integration release |
| Custom brand system | Homepage first pass implemented | Shared interior palette/typography and six editorial diagram covers now implemented; 45 local checks across 15 routes at three widths pass. Further page-specific artwork and full-page review remain. Licensed Neue Haas and PP Editorial webfont files remain Cameron input; use honest fallbacks meanwhile |
| Portfolio | Mostly reconciled | Keep Della → BPM → Marin → CocoFro. Obtain actual Della campaign deliverable, Evergreen scope, Jill finished posts and final TMM site. Kalm remains production-only. No fictional mockups/results |
| Services/pricing | Built, terms incomplete | Cameron confirms currency, commitment, rollover, turnaround and exclusions. Keep ongoing partnership prominent; preserve plan context into brief |
| Five campaigns | Built locally | Review live creative-partner, Shopify, packaging, brand-launch and website-redesign. Specific audience/channel and ad/outreach creatives follow approval; do not add thin extra pages |
| Insights | Four buyer guides and refreshed articles built | Maintain relationships to real work/services. Prepare an editorial calendar; research search priorities before claiming keyword opportunity |
| Mailgun/enquiries | Code tested with isolated sink | Cameron privately completes login/key setup, retention choice and approved receipt test. Verify stored brief/delivery before enabling public endpoint |
| Measurement | Local event/context plumbing | Choose reporting destination and privacy/consent approach, establish actual baseline; a calendar click is not a booking |
| Main-domain launch | Approval gate | Reviewed preview, working enquiry route, URL/redirect/legal/rollback checks, then explicit main-domain approval |

## Current CMS increment

See [website-cms.md](website-cms.md). This is private editing and reviewed build export, not live self-service publication. Homepage, service and campaign text are supported editorial types. Server-side drafts live in `/data/content`; committed JSON drives static builds. Deploying the static site does not deploy the gateway or CMS automatically.

## Integration findings to resolve

The older local checkout had an anonymous `/leads/intake` implementation. Fresh remote-main inspection superseded that finding: the old public endpoint has been removed. `/api/client-acquisition/config` and `/intake` now validate origin, privacy version, consent, service lines and bounded attribution; persist organization-owned inquiries idempotently and create the staff notification transactionally. Success means Hub acceptance, not email receipt or client/project creation. Issue #426 is closed for source implementation; this continuation has not verified target configuration or visitor delivery. The existing legacy admin conversion remains separate and must not become the website integration path. Follow Hub CONTRIBUTING: accepted issue, isolated branch, applicable tests and independent review for sensitive changes.

## Human/external inputs

Private credentials and inbox receipt; retention; commercial terms; client-source evidence; licensed font files; reporting/provider choice; release and main-domain/ad/outreach approval. Continue independent implementation while these are pending. Do not mark the entire goal complete from a successful build or local CMS test.

## Hub adapter checkpoint

See [enquiry-contract.md](enquiry-contract.md) for the explicit Hub build mode, request mapping, consent/version handling and activation/rollback gates. 42 tests, default and isolated Hub-mode builds pass. Subsequent local browser review passed at 375/1440 px, including consent, privacy conflict and fabricated receipt; live Hub acceptance remains unverified. No target settings or deployment changed.

## Admin preview checkpoint

Optional authenticated layout-preview requests/status/viewer now use the isolated builder and bounded queue. A real local draft was reviewed at 375/1440 px; 48 tests and typecheck pass. Docker daemon unavailable: no container or hosted release verification. Default gateway remains editor-only. See website-cms.md for runtime, static-view limitations and remaining operational gates.

### Preview lifecycle checkpoint — 28 September

Single-worker ownership, marked expired-session cleanup and graceful/failed-start cleanup are implemented. 51 tests and typecheck pass, including real isolated gateway processes. An abandoned crash lock deliberately needs operator verification before recovery. No hosted configuration, push, merge or release changed.

## Live Hub entry-point check — 28 September 2026, 19:16 UTC

Remote main remains `e8a0e5e84216f057868e81557928fdea6cd0c706`. Current product-status source still distinguishes deployed authentication/operations code from pending authenticated portal/tenant/provider evidence.

Direct browser navigation to `https://hub.ashbi.ca/` failed with `ERR_CERT_DATE_INVALID`. A separate normal `curl -I --max-time 10 https://hub.ashbi.ca/` failed certificate verification with exit 60 and “certificate has expired.” No insecure request, sign-in, visitor submission or hosting mutation was performed. Current runtime clock was verified at 2026-09-28 19:16 UTC.

Owner: Cameron / the Hub hosting operator. Next action: identify the serving certificate/proxy and renewal failure with read-only infrastructure checks, prepare a scoped backup/repair, obtain explicit hosting-change approval, renew the certificate, then re-run normal verified HTTPS and the controlled authenticated Hub journey. Until then, live Hub integration is unverified and must remain disabled. This does not prevent local CMS/content work.
