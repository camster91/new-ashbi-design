# Ashbi campaign landing pages

These pages are built for review and direct campaign traffic. They are `noindex` and omitted from the sitemap so they do not compete with the main service pages in organic search. Their shared visual system, public project examples, enquiry routes, and FAQs are defined in `src/data/offers.ts`.

| Path | Intended use | Service | Example work |
| --- | --- | --- | --- |
| `/campaigns/brand-launch/` | Founder and brand launch ads or outreach | Brand identity and strategy | CocoFro |
| `/campaigns/website-redesign/` | Website improvement ads or outreach | Web design and development | Clypse Beauty |
| `/campaigns/packaging-design/` | CPG and DTC packaging ads or outreach | Packaging design | Blend |
| `/campaigns/creative-partner/` | Ongoing creative partner outreach | Ongoing creative support | WaagBag |

Each page leads to `/contact/` for the booking link and to `/contact/?service=<slug>#project-brief` for a preselected brief. The booking button on the contact page opens the public Google Calendar event “30 min with Bianca.” The brief can open in the visitor’s email app when the enquiry endpoint is unavailable. These pages emit local `ashbi:analytics` events, including `campaign_view`, but no analytics vendor or ad pixel is connected.

Before an ad or outreach launch, confirm the campaign audience, channel, creative and copy, the real booking URL, the enquiry endpoint or email process, and attribution/consent requirements. Review the selected public project and testimonial for each channel. No ad account or outreach system is configured by this build.
