# Ashbi campaign landing pages

These pages are built for review and direct campaign traffic. They are `noindex` and omitted from the sitemap so they do not compete with the main service pages in organic search. Their shared visual system, public project examples, enquiry routes, and FAQs are defined in `src/data/offers.ts`.

| Path | Intended use | Service | Example work |
| --- | --- | --- | --- |
| `/campaigns/brand-launch/` | Founder and brand launch ads or outreach | Brand identity and strategy | CocoFro |
| `/campaigns/website-redesign/` | Website improvement ads or outreach | Web design and development | Clypse Beauty |
| `/campaigns/packaging-design/` | CPG and DTC packaging ads or outreach | Packaging design | Blend |
| `/campaigns/creative-partner/` | Ongoing creative partner outreach | Ongoing creative support | WaagBag |

Each booking action leads directly to the configured `site.bookingUrl` and to `/contact/?service=<slug>#project-brief` for a preselected brief. The booking button on the contact page opens the public Google Calendar event “30 min with Bianca.” The brief can open in the visitor’s email app when the enquiry endpoint is unavailable. These pages emit local `ashbi:analytics` events, including `campaign_view`, but no analytics vendor or ad pixel is connected.

Before an ad or outreach launch, confirm the campaign audience, channel, creative and copy, the real booking URL, the enquiry endpoint or email process, and attribution/consent requirements. Review the selected public project and testimonial for each channel. No ad account or outreach system is configured by this build.


## Shopify campaign — local implementation, 2026-09-26

- `/campaigns/shopify-design/` uses Shopify-specific scope, process and FAQs.
- `/work/chef-tanya/` added after the four featured projects in the current work index.
- Source: original Chef Tanya Figma file `RJPilIew1hRCZwsMTj0cG3`, Shop frame `261:2`. Export resized to WebP without changing artwork.
- Cameron identified the project as Shopify work. Case study describes design only; live implementation and sales results are unverified.
- Updated homepage frame `239:2` contains placeholder product panels and is excluded from public assets.
- Desktop rendering checked; mobile verification tracked in the audit evidence. No deployment in this change.

## Campaign and editorial refinement — 2026-09-26

All five campaigns now use a compact header, an offer-specific primary calendar CTA, a 30-minute Bianca call explanation and earlier case-study proof. Four original buyer guides link into the matching service, case study and campaign. Historical article routes and publication dates remain unchanged. The SafetyDetectives summary and source link no longer repeat a raw URL.

Local checks: 74-page build, typecheck and 19 tests pass. Static inspection found no missing root-relative anchor/image/script destinations across the built HTML (this does not verify external links, CSS assets or browser interactions). Packaging campaign desktop inspected with no overflow or broken loaded images. Responsive and full journey review remain open.
