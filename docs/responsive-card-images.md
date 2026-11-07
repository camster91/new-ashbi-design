# Responsive hero and portfolio images

Prepared 17 October 2026 on `perf/responsive-home-images`, based on `55151f3`.

The hero reel and selected-work cards now use responsive WebP variants at up to
360, 720 and 1080 pixels wide. Fourteen approved card images are covered. The
original `src` remains intact, preserving fallback rendering, existing crop
selectors, editorial validation and full-resolution case-study artwork. No CSS,
copy, image choices, crop positions, loading priorities or motion behavior changed.
Unlisted editorial image selections fall back to their original image until
variants are added. `npm run generate:card-images` regenerates the committed
variants from the editorial catalog's default cards and the homepage Marin image.
No runtime image service or new dependency is required.

## Verification

- Node tests: 76 passed, one skipped (`TMPDIR=/private/tmp npm test`).
- TypeScript, static build and diff whitespace check passed.
- Built link checks: 3,675 local links/assets and 283 fragments passed.
- CMS content checks: 163 fields in 36 page bodies passed.
- Sitemap: 45 canonical indexable pages passed.
- Chrome at 375px/DPR 2 and 1440px/DPR 1: responsive sources selected;
  all hero/selected-work images load when requested; no horizontal document
  overflow or page errors; keyboard gallery scrolling works. Mobile hero and
  selected-work screenshots and desktop hero screenshot visually inspected.

## Local mobile Lighthouse comparison

Both runs used the same local static preview at http://127.0.0.1:4370/, with
Lighthouse mobile simulated throttling and a fresh launched Chrome profile.
The before run used the original build; the after run used the optimized build.

| Metric | Before | After |
|---|---:|---:|
| Performance score | 90 | 97 |
| LCP | 3.6 s | 2.5 s |
| First contentful paint | 1.7 s | 1.7 s |
| Total blocking time | 10 ms | 0 ms |
| Layout shift | 0.003 | 0.008 |
| Transferred resources | 1,733 KiB | 1,065 KiB |

Transfer size fell about 39%. This is one lab run per build; scores vary. Do not
compare the local 97 directly with the earlier live mobile 70, or claim a live
improvement before release. Local serving removes public-network latency.

Raw Lighthouse JSON, browser results and screenshots are in the task workspace's
sibling `speed-test/` directory, outside the repository.

## Release state

Local implementation only. No push, merge, hosted preview, deployment or live
mutation performed. Review and authorize publication separately, then repeat
Lighthouse against the actual deployed homepage. Rollback is reverting this
isolated commit; original images and content remain available.
