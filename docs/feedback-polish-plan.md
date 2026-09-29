# Preview feedback implementation plan — 29 September 2026

## Release scope

1. Hero: full viewport width with readable copy width. Start both rows after a brief 1.8s hold; remove hover-wide/12s stalls and mobile snap interference. Preserve explicit pause, keyboard focus pause, swipe, links and reduced motion.
2. Services: remove perspective/rotation from the card containers. Use short vertical entrance motion, keeping text and buttons level. Preserve the ongoing partnership emphasis and mobile carousel.
3. Home narrative: replace generic selected-work copy; add six specific studio benefits: direct collaborators, tailored direction, product expertise, agreed milestones, useful customer journeys, ongoing support. Do not invent measured results or guarantee every project in 4–8 weeks.
4. Portrait: remove face-cropping zoom/parallax and arch mask; show the full source photograph. Keep a modest entrance motion around the frame.
5. Process: split headline and introduction across the desktop header, balance vertical padding, stack on mobile.
6. Portfolio: move Mom Water and Shongani Skin immediately after the four featured brands. Retain Della, BPM, Marin and CocoFro first.
7. Insights: consistent 4:3 covers and equal-height card bodies/CTA baselines. Six distinct AI editorial scenes, no generated client work, no embedded text. Persist compressed local assets and descriptive alt text; maintain accessible article titles outside covers.
8. Performance: measure live response times, asset payloads and rendering behavior. Add compression and appropriate static asset caching; limit font subsets; remove expensive/unhelpful distortion. Verify results rather than claiming a Lighthouse score without a run.
9. Verify: typecheck, tests, production build, links/content; desktop and 375px motion/pause/manual controls, image framing, insights grid, portfolio order, no overflow. Commit and release to authorized preview; verify CI and release marker. Main domain remains separate.

## Initial evidence

Preview curl samples: home TTFB 257ms / total305ms; Studio243ms /289ms; Insights211ms /245ms. These are this connection's samples, not field performance. Server headers show no gzip/cache policy for the inspected HTML; largest JS bundle139KB and CSS80KB uncompressed. Old hero code paused on gallery hover or any focus and waited12s; mobile used5s advances with scroll snapping. Service cards used rotationX12deg, portrait used scale1.15 plus vertical drift inside an arch. Insight cover height grew with title length.

## Implementation checkpoint

All six featured Insights covers are generated editorial artwork, stored under `public/images/ashbi/editorial/*-v1.webp`. Prompts used one simple subject per article: paper website planning; passing a sketchbook; carton and dieline; related cut-paper flowers; wooden hierarchy/navigation shapes; three pear illustration styles. Shared direction: landscape4:3, cream/indigo/lime, tactile materials, no text/logos/client claims. Original generated PNGs retained in the Codex generated-images directory; compressed900px WebP derivatives serve the site.

Local review: all six Insights cards451px and covers292px at1280px, no overflow; desktop and375px hero row positions changed over time; explicit pause held both positions unchanged. Hero spans viewport. Service card transforms no longer contain perspective/rotation; portrait shows full source. Production build,53tests,typecheck,3112links/assets,295fragments and162CMSplacements pass.

Preview nginx compression/cache configuration was syntax-checked and reloaded with a named backup at `/srv/ashbi-astro-preview/auto-nginx.conf.before-performance-20260929`. Fresh HTTPS headers confirm gzip. Static release remains to be verified after the final commit.

## Preview release verification

Release `eafe32c` passed GitHub run36507015165 and was verified via public `_release.json`. Live Insights images returned200, no loaded broken images or horizontal overflow; six covers measured332px at1440px. Compressed Studio HTML measured4,701bytes; mainJS53,076bytes, CSS23,916bytes. New editorial covers are16–60KB each. This is transfer/layout evidence, not a claim of field Core Web Vitals or all-device performance. A final spacing adjustment reduces the gap before the Insights archive.
