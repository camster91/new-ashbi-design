# Local verification — 23 September 2026

## Passed

- Production build: 59 static pages.
- TypeScript: `npm run typecheck`.
- Enquiry logic: 7 passing tests with injected transports; no real requests or email delivery.
- Built-page scan: internal links, local assets, source sets, fragments, one H1, title, and description across all 59 pages; zero errors.
- Original URL inventory: all 36 paths in the saved Ashbi page/post sitemaps retained locally.
- Existing booking fallback: `https://www.ashbi.ca/contact/` returned HTTP 200. No appointment was submitted.
- Browser layout checks: Home, Web design, Studio, and Contact at 375, 768, and 1440 px; no horizontal overflow or broken loaded images.
- Visual review: desktop testimonial/benefit layouts, desktop asymmetric CocoFro gallery, mobile Blend gallery, mobile contact form, tablet/mobile hero.
- Packaging filter returns all nine matching projects, including projects whose primary category is Branding.
- Mobile navigation: full-height overlay, focus loops from first link to Close menu, Escape closes and returns focus, background inert state clears.
- Reduced-motion presentation: hero copy visible and static; gallery arrow keys still advance a row (0 → 228 px in the test).
- Pause control: offsets stayed unchanged across separate observations; `aria-pressed=true` and Resume label confirmed.
- Journey: homepage Explore work → CocoFro case study with 14 gallery images → project brief with Packaging preselected.
- Contact: required-field errors rendered with focus moved to the first invalid field; service selection includes Not sure yet; online submission correctly disabled without endpoint.
- FAQ opens with Enter.
- No browser console errors in the reviewed QA tab.

## Limits / next inputs

This is local review evidence, not a production release. Final Calendly event configuration and actual brief receipt remain unverified because their production destinations are not configured. Success, rejection, duplicate-submit, and timeout logic were tested with mocked transport, not through a live email service. Physical-device touch testing and production hosting/redirect behaviour remain release checks. Local viewport and reduced-motion overrides were reset after QA.

Original client logo files were not available as separate assets in the reviewed strip. Verified names are shown without fabricated marks or affiliations. No new/private project work or performance metrics were introduced.

## Hero refinement follow-up

Straightened both image rows, removed the overlapping/alternating card tilts, and increased the image sizes. Cards now share a level baseline and initial inset. Depth uses shallow perspective, a raised frame, and softer shadows. The stage uses its content height, with separate space above, between, and below the rows.

Checked at 375, 768, and 1440 px: no horizontal page overflow; mobile cards approximately 278 px wide (previously 210 px), tablet cards 300 px, desktop cards up to 360 px. Mobile mandatory scroll snapping, arrow buttons, keyboard browsing, and dragging were verified. A mobile drag advanced the foreground row without opening the project link. Reduced-motion browsing remained usable. Typecheck and the 59-page production build passed. Preview overrides were reset after review. Changes remain local.
