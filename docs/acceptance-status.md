# Full-scope acceptance status

28 September 2026. Local verification is distinct from hosted preview, production launch and client acceptance. The active goal is not complete.

| Requirement | Evidence inspected | Status / next proof |
|---|---|---|
| Ashbi homepage and custom visual system | `src/pages/index.astro`, `src/styles/brand-home.css`, `brand-interior.css`, local rendered captures | Implemented locally; wider full-page visual acceptance and licensed fonts remain |
| Featured order and genuine imagery | Rendered homepage and project routes; `docs/content/project-source-status.md` | Della → BPM → Marin → CocoFro maintained. Della deliverable evidence and other named client inputs remain |
| Services and consolidated engagement options | Local homepage/services plus ongoing service route | Implemented. Mobile carousel/keyboard and selected plan verified; commercial terms require Cameron confirmation |
| Five marketing pages | All five rendered pages and clicked enquiry CTAs | Correct service/campaign prefill verified on mobile. Live release review and approved ad/outreach creative/audience remain |
| Insights and editorial programme | Existing article routes, six editorial covers, `editorial-calendar.md` | Local content/calendar prepared. Publication decisions, research and measurement baseline remain |
| Navigation/accessibility/mobile | 34 content routes at 375/1440; menu focus/Escape, carousel Enter, form error focus, anchor screenshot | These checks pass; not full-page/all-keyboard/reduced-motion acceptance |
| Booking | Rendered links target supplied Google appointment URL | Destination configured. A click is not a verified booked appointment |
| Enquiry admin and Mailgun | Local gateway/admin tests and prior isolated browser setup review; `enquiry-contract.md` | Code prepared. Cameron privately sets credentials/retention and approves recipient receipt test; public capture stays gated |
| CMS editing/history/approval | 36 content models, server handlers, isolated runtime tests; `website-cms.md` | Implemented locally. Hosted staff login/runtime/accepted editorial release remain |
| CMS layouts/release candidates | Isolated authenticated static previews; `prepare-content-release.mjs` source/result hashes and rollback manifests | Local candidate workflow prepared. Hosted optional container unverified; static preview deliberately excludes live scripts/submissions |
| Existing Hub reconciliation | Remote source main `e8a0e5e`; ownership/contract docs | Existing Hub owns clients/projects/portals. Website does not duplicate them |
| Hub inquiry activation | Local adapter tests and fabricated Hub-mode browser review | Live config, origin, owner, privacy version and isolated receipt remain unverified |
| Hub project/client portal journey | Existing modules found; live HTTPS failed certificate validation | Requires approved scoped TLS repair, then authenticated staff/client isolation and lead → client → project → portal proof |
| Routes/assets/metadata | Build/link/content gates; `legacy-url-inventory.md` | Local checks pass: 3,149 links/assets, 295 fragments, 162 CMS fields. Live redirect/canonical/noindex verification remains |
| Preview deployment | Existing CI path and locally committed candidate source | New local work is not released. Specific release approval, CI results, exact served marker and journeys required |
| Main domain | Preview-first migration plan | Separate explicit launch approval and rollback/SEO/legal/enquiry readiness |
| Measurement/ads/outreach | Local events and bounded context plumbing | Provider/privacy/baseline and channel approvals remain. No invented conversion results |

## Operational dependency

Hub TLS repair is a concrete two-line candidate in `hub-https-repair.md`, with exact hashes and backup/rollback steps. The existing specific approval request remains pending. No hosting change is authorized by automatic goal continuation.

## Current bounded next work

Finish representative full-section visual and keyboard reviews; resolve actual findings. Hosted CMS/Hub verification and release depend on the gates above. Do not substitute successful local builds for those outcomes.

### 28 September: approved CMS gateway now live

CMS gateway deployed at `ee84464`; private backup and rollback container retained. Actual read-only Docker draft build passed all 162 placements; 53 tests/typecheck passed. Static workflow 36499508822 succeeded and live release marker matches. `/admin/` is ready for Cameron's one-time account setup; authenticated CMS acceptance and Mailgun key/test/receipt are outstanding user inputs. Hub TLS is repaired, but its deployed intake config endpoint returns 404, so live Hub intake remains unfinished. These findings supersede earlier statements that the CMS was local-only or Hub access was TLS-blocked. See `website-cms.md` deployment entry for evidence and rollback.
