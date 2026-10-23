# ashbi.ca Cloudflare migration — 23 October 2026

## Current production topology

Public pages, images, CSS, JavaScript, sitemap and robots are served by Cloudflare Pages project `ashbi-design` through Worker `ashbi-design-edge`. Both `ashbi.ca/*` and `www.ashbi.ca/*` use this Worker; the existing `https://www.ashbi.ca` canonical is preserved.

The Worker deliberately sends `/admin`, `/admin/*`, `/api`, `/api/*` and `/health` to the existing DNS origin using `fetch(request)`. Cloudflare route subrequests reach the existing origin without re-entering the same route. This preserves the gateway's cookies, Origin checks, bodies and idempotency keys. Responses from these paths are never cached. Static requests send neither cookies nor authorization headers nor query values to Pages. Redirects preserve the visitor query on the public host.

**This is a public-site migration, not a complete VPS retirement.** The enquiry gateway, encrypted lead records, Mailgun configuration, staff authentication and editorial drafts still live on the VPS. Do not stop the VPS, remove its persistent volume or change the existing origin DNS record until that migration is separately completed and verified. No email or other subdomain DNS records were changed.

## Release details

- Cloudflare account: `1b2e351cbb39ab6b80efe36ca3577fe5`.
- Zone: `3f3fa62a70d7ad71eb6f4ed89bf81e38`.
- Repository: `camster91/new-ashbi-design`.
- Public build commit: `55151f3c0f8cf14db54ebc5244cd166926b46e0d`.
- Pages deployment: `279728ca-6d0a-4f3a-90ff-51ccd139784e`.
- Pages output: `dist`; Node `22.16.0`.
- Build variables: `PUBLIC_ENQUIRY_ENDPOINT=/api/enquiries`, `SITE_URL=https://www.ashbi.ca`.
- Build command: `npm run astro -- sync && npm run typecheck && npm test && npm run build && npm run check:links && npm run check:sitemap && npm run check:content`.
- Pages automatic production/preview deployments are disabled. Release manually after verification. The existing GitHub VPS preview workflow remains unchanged.
- Worker source: `edge/worker.mjs`; deploy using `wrangler deploy --config edge/wrangler.jsonc` with authorized Cloudflare credentials.

## Verification

The Cloudflare hosted build completed successfully. Local validation passed typecheck, 85 tests (one pre-existing test skipped), three Python ops tests, build, 3,454 internal link/asset checks, 283 fragment checks, a sitemap containing 45 canonical indexable URLs and 163 CMS placements across 36 page bodies. Nine new tests cover migration routing, credentials, redirects, private requests, error handling and 404 preservation. No dependencies were changed.

Production HTTP checks confirmed `/`, `/contact/`, `/work/`, `/sitemap-index.xml` and `/robots.txt` return 200 with `X-Ashbi-Hosting: cloudflare-pages`; a nonexistent route returns 404. `/admin/` returns 200 and the enquiry API rejects GET with 405, both with `X-Ashbi-Hosting: vps-gateway` and `Cache-Control: no-store`. `/health` returns the existing origin's 404; it is not a working production health probe. The public homepage rendered in a real desktop browser. Form validation and transport logic are covered by automated tests; no real enquiry or email was sent. Authenticated admin operations, inbox receipt, and mobile/tablet browser verification remain pending.

The dependency audit reported five existing high-severity build-tool findings: http-cache-semantics, sharp, source-map-js, vite and zod. These packages are used at build time rather than shipped as a Node server on Pages. Triage and upgrade them in isolated, tested changes before the next build release. Do not describe the audit as clean.

## Rollback

The original DNS and VPS site are intact. Remove only the two Worker routes below to restore public traffic to the VPS; do not delete the Worker or Pages deployment as part of rollback:

- `77a9fb226d8148078d4d407a72fb2e9c`: `www.ashbi.ca/*`.
- `ea4eda60017a46adb9ed1a719f85ab0e`: `ashbi.ca/*`.

Then verify homepage/contact/admin responses and lead handling. Future Pages releases can roll back to the saved successful deployment. Keeping the DNS A record pointed at the VPS is necessary for the private gateway pass-through in this stage.

## Finish removing the VPS dependency

1. Obtain authenticated gateway access and an operator backup of its encrypted state, leads, editorial data and encryption key; never commit these or paste secrets into chat.
2. Inventory current delivery settings and draft content read-only. Design Cloudflare persistence and staff authentication without losing saved records or weakening existing session/CSRF controls.
3. Implement and test the enquiry API, idempotency, rate limits, delivery status and admin/editor storage on Cloudflare. Import encrypted data through a private migration path and retain a verified backup.
4. Verify actual delivery with an explicitly authorized test, authenticated admin access and representative mobile/tablet/desktop flows. Switch private paths only after acceptance checks pass.
5. Inventory other VPS services and subdomains before considering retirement. The ashbi.ca migration does not authorize deleting unrelated services or cancelling the VPS subscription.

## Final hardening update pending reconnection

The initial Worker deployment and production route checks succeeded. A final review added a regression test and changed static upstream URL construction so double-slash paths cannot select a different host. The new test failed before the correction and passes afterward. The corrected Worker passed typecheck and all 85 tests (one existing skip), but Cloudflare rejected its upload because the app connection requires reauthentication. The previous Worker version remains deployed. Reconnect Cloudflare and deploy the corrected `edge/worker.mjs` before treating edge hardening as complete.
