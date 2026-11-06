# Ashbi Design 90-day growth plan

## Goal

Generate more qualified enquiries and won projects from product brands preparing for retail or growing online. Ashbi.ca should show how brand identity, packaging and ecommerce fit together. CameronAshley.ca serves a separate audience looking for technical troubleshooting, integrations and agency development partnerships.

Start with **packaging for a retail launch**. Build a single path from service page and portfolio proof to enquiry and follow-up. Use the results to decide which path to develop next.

| Buyer situation | What the site should help them do |
| --- | --- |
| Launching a product in retail | Understand packaging scope, see relevant product work and share their format, variants, timing and retailer requirements. |
| Refreshing an existing product line | See how Ashbi can evolve an identity across packaging and sales channels, then share what needs to change. |
| Growing a product brand on Shopify | See how product presentation, store design and the buying experience fit together, then share their current store and goals. |

## Days 1–30 · Establish the baseline

- [ ] Finish mobile and tablet QA for the Toronto branding page. Confirm its case-study links and branding enquiry path at representative widths. Release after approval, then request indexing in Search Console and track Google's decision separately. The page is currently on staging. [Branding page PR](https://github.com/camster91/new-ashbi-design/pull/29)
- [ ] Verify GA4 enquiry tracking with a test property before enabling it. A confirmed submission with consent should produce one `generate_lead` event. Validation errors, server failures, email fallback and declined or withdrawn consent should produce zero. After release, verify the live event and mark it as a GA4 key event. [Tracking PR](https://github.com/camster91/new-ashbi-design/pull/30)
- [ ] Investigate the difference between Search Console clicks and GA4 organic sessions. Check reporting periods, tag coverage, consent and channel attribution. Start a 28-day enquiry baseline after the live event is verified. Keep rank tracking separate until the provider error has been diagnosed.
- [ ] Agree on what counts as a qualified lead and where to record source, requested service, qualification and outcome. A starting definition is an identifiable business with a project that fits Ashbi's services and a concrete next step. Choose the strongest published case study for the retail packaging offer.

## Days 31–60 · Test the retail packaging path

- [ ] Update the packaging service page around a retail launch. Explain scope, what clients should bring and how to start. Link to the selected case study and carry the packaging service into the enquiry form.
- [ ] Make the case study useful in sales conversations. Show the client brief, the decisions Ashbi made and the materials delivered. Use verified outcomes where available. Link back to the relevant service and enquiry path.
- [ ] Use Search Console query data, approved personalised outreach and referrals from printers, co-packers and agency partners to bring relevant prospects to the same offer. Record recurring questions and objections for the next page revision.

This phase is ready to review when someone can move from the packaging page to a relevant case study and an enquiry with the service selected, and the team can follow that enquiry through qualification and follow-up.

## Days 61–90 · Decide where to expand

- [ ] Review qualified enquiries, calls, proposals and wins by offer and source. Use client-reported sources alongside analytics when available and keep unknown sources visible.
- [ ] Decide whether to extend the packaging path, build out the product-line refresh or Shopify path, or invest more in a channel already producing qualified conversations. Record the reason and the next decision date.
- [ ] Build toward three sales-ready case studies across the three buyer situations. Each should link to the matching service and give the team a clear reason to share it with a prospect.

## Monthly scorecard

| Measure | Source |
| --- | --- |
| Branded and non-brand search impressions and clicks by service page | Search Console |
| Confirmed, consented online form submissions | GA4 |
| Qualified enquiries, calls, proposals, wins and won revenue by offer and source | Lead records |

Use the first complete measurement window to set targets. With low volumes, review the individual enquiries and sales conversations alongside the counts.
