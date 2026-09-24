# Ashbi content expansion — local implementation

## What changed

- Kept the existing Ashbi colour system, typography, rounded shapes, and two-row image-only hero gallery.
- Homepage now follows work → client proof → services → real brand applications → studio/principles → process → engagement options → FAQ → invitation. The large Insights teaser is removed; Insights remains in navigation, and web design links to its relevant article.
- Three attributed homepage quotes; all six original quotes on Studio. No invented portraits, ratings, results, or client counts.
- Four richer service pages with audience fit, benefits, concrete deliverables, related work, process, testimonials, FAQs, and a preselected enquiry path.
- Added SplashTown to Work and restored all 89 distinct gallery images across 12 original projects. The three website-only entries retain their available original composite image. All gallery assets are local WebP with responsive source sets, dimensions, lazy loading, and natural aspect ratios.
- Portfolio filters support multiple disciplines per project. All 36 URLs in the saved original page/post sitemaps still resolve locally, including article slugs and legacy project routes. Legacy project pages declare the new Work route as canonical; production HTTP redirects remain a hosting decision.
- Studio includes the family-owned story, fuller source-based bios, additional studio imagery, working principles, and six testimonials.
- Book a call stays primary. Short project brief added with optional company/website/timing, a Not sure yet option, validation, honest unavailable state, and email-draft fallback. No phone, budget, upload, or newsletter requirement.
- Added local `ashbi:analytics` events: project/service views, booking clicks, calendar clicks, brief starts/success/failure, and email clicks. No analytics vendor, cookies, persistent ID, query strings, or form contents are sent.
- Fixed the existing mobile menu overlay height, focus loop, Escape handling, and background inert state. Darkened light purple headings for contrast. Closing art is static; hero motion has pause/manual controls and reduced-motion handling.

## Sources and decisions

Content and images were checked against Ashbi’s existing public site. `portfolio-sources.json` records original gallery pages and image URLs; `src/data/portfolio-assets.json` is the build manifest. Existing public About, services, portfolio indexes, and Contact informed the bios, quotes, service scope, and booking fallback.

- Display name Shongani Skin follows the artwork; the original `shongoni-skin` URL is retained. Contradictory geographic descriptions are omitted.
- DuraBuild’s copied packaging/social metadata was not carried over; the page uses supported identity and website scope.
- Client strip remains verified client names. Separate original logo assets were not available in the reviewed strip, so no substitute logos or “featured by” marks were invented.
- Clypse, Tyson Media, and SplashTown have the available composite portfolio artwork; extra process scenes or results are not fabricated.
- New project prose describes visual decisions and deliverables, not unverified business performance.
- Public prices, free trial, speculative metrics, press claims, client portal, lead magnet, and extra homepage sections are excluded from this phase.

## Template adaptation

Signed-in Temlis Copy Prompt and Copy Figma outputs were inspected for:

- Lyria Asymmetric Photo Gallery: mirrored wide/small image pairs; stacked natural-aspect images on mobile.
- Stayli Static Testimonial Grid: static attributed quote cards; no slider dependency or invented avatars.
- Victoria Contact Hero with Form: clear split introduction/form composition. Its demo-only success/reset behaviour was replaced with validated delivery handling.

Aeline ServiceBenefits supplied the benefits/image layout reference. Existing Acelia work cards and grid remain. All additions use Ashbi styles, real data, and the existing Astro/GSAP stack; no extra template font or UI framework was installed.

## Launch inputs

Verified booking event, approved delivery endpoint and receipt verification, hosting/redirect configuration, and final privacy/legal review. See `enquiry-contract.md`. The Google Calendar event “30 min with Bianca” is now the booking destination; this historical note does not establish main-domain release readiness.
