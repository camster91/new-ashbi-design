# Project brief delivery and admin setup

The Astro site is static. A separate Node service in `server/` provides `/admin/`, `/api/enquiries`, and `/health`. The public brief remains disabled until the service is deployed, Mailgun is configured and tested, and the site is rebuilt with `PUBLIC_ENQUIRY_ENDPOINT=/api/enquiries`. The email-draft fallback continues to work meanwhile.

## Deploy the private service

Build `server/Dockerfile` using the project root as context. Mount a **persistent private volume** at `/data`; the admin password hash and encrypted Mailgun settings are stored in `/data/admin-state.json`. Run one instance only. Back up this volume and the encryption key together. The container runs as a non-root user and listens on port 3000 on the private network.

Set these private environment variables in Coolify, never in Astro's `PUBLIC_` build variables:

| Variable | Value |
|---|---|
| `ENQUIRY_ORIGIN` | Exact HTTPS site origin, such as `https://preview.ashbi.ca` |
| `CONFIG_ENCRYPTION_KEY` | 32 random bytes, base64 encoded (`openssl rand -base64 32`) |
| `ADMIN_SETUP_TOKEN` | One-time token of at least 32 characters (`openssl rand -hex 32`) |
| `DATA_DIR` | `/data` in the container |
| `PORT` | `3000` |
| `TRUSTED_PROXY_ADDRESS` | Exact private IP of the reverse proxy that connects to Node; required when proxying multiple visitors through one socket address |

Both generated values must be stored as Coolify secrets. Do not paste them into chat or commit them. After Cameron completes one-time setup, remove `ADMIN_SETUP_TOKEN` from the service environment and redeploy; the account persists in `/data`. If the encryption key is lost, saved Mailgun settings cannot be recovered. If the volume is lost, the admin account and settings must be set up again. Keep the backend private to the site reverse proxy; do not publish port 3000 directly.

Proxy both paths from the **same HTTPS site origin** to the private service:

```nginx
location ^~ /admin/ {
    client_max_body_size 12k;
    client_body_timeout 10s;
    proxy_read_timeout 20s;
    proxy_pass http://ashbi-enquiry-gateway:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
location = /api/enquiries {
    client_max_body_size 8k;
    client_body_timeout 10s;
    proxy_read_timeout 20s;
    proxy_pass http://ashbi-enquiry-gateway:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

Also redirect `/admin` to `/admin/`. Configure the edge's true client IP first: `$remote_addr` must be the verified visitor address, not an untrusted forwarding header. Only the exact IP in `TRUSTED_PROXY_ADDRESS` may provide `X-Real-IP` to Node; strip incoming client copies of that header at the edge. Verify this IP in the running topology before exposing either route. The service checks the exact `Origin` of POST requests, with `Origin: null` accepted only because some in-app browsers submit opaque origins; setup still requires the private token, login requires the password, and authenticated changes require a session CSRF token. The admin cookie is HTTP-only, Secure on HTTPS, SameSite Strict, and expires after eight hours. The admin page is noindex and sends a restrictive Content Security Policy. Apply edge per-client rate limits using the verified visitor IP. The backend also limits each visitor and caps accepted brief deliveries at 60 per hour per instance.

## Cameron's setup

1. Visit `/admin/` and enter the one-time setup token and a password of at least 16 characters. The only login is `cameron@ashbi.ca`; the password is hashed with scrypt. No email password reset is offered.
2. In Mailgun, create a **domain sending key** for the verified sending domain. Mailgun recommends this restricted key for applications that only send messages: [Mailgun API key management](https://documentation.mailgun.com/docs/mailgun/user-manual/api-key-mgmt/rbac-mgmt).
3. In the admin page, choose US or EU region, enter the sending domain, a From address on that domain, and the sending key. The key is encrypted on disk and never displayed after saving. Saving or changing settings disables public delivery.
4. Explicitly send a test email to `cameron@ashbi.ca`. This is a **real Mailgun email and may incur a charge**. Check receipt, then confirm in the admin page and enable brief delivery. No test is sent automatically.
5. Build the static site with `PUBLIC_ENQUIRY_ENDPOINT=/api/enquiries`; verify the full form journey on preview before any production launch. The recipient for visitor briefs is fixed server-side at `hello@ashbi.ca`.

Mailgun's [US and EU API bases](https://documentation.mailgun.com/docs/mailgun/api-reference/api-overview) and [message endpoint](https://documentation.mailgun.com/docs/mailgun/api-reference/send/mailgun/messages/post-v3--domain-name--messages) are used directly from the server. The key never reaches the browser. The service sends plain text, disables tracking for these briefs, and requests TLS for Mailgun's onward delivery. Mailgun acceptance means queued for delivery; it does not prove inbox receipt.

## Public request contract

The browser posts JSON to `/api/enquiries` and expects an HTTP success with `{"accepted":true}` only after Mailgun accepts the message. Required fields: name (100 characters), email (254), allowed service slug, and description (5,000). Optional: company (150), website (300), timing (200). The endpoint revalidates every field, checks the exact origin, caps the body at 8 KB, uses a hidden bot field, and applies a five-attempts-per-ten-minutes client limit when the trusted proxy identity is configured. Validated briefs are encrypted with AES-256-GCM and saved under the private `/data/leads/` directory before Mailgun is called. Records distinguish pending, delivery-failed and accepted-by-mailgun; acceptance is not proof of inbox delivery. Form contents are never sent to analytics. Storage failure prevents sending. The directory and encryption key must be backed up together. Admin retrieval, retention cleanup and recovery of failed deliveries must be verified before enabling this revised gateway.

The admin lists saved briefs in pages of up to 100 and can remove the saved content of an accepted brief after reviewing its delivery. This requires a signed-in session, CSRF token and explicit confirmation. The encrypted record keeps its random submission ID, accepted status and a keyed fingerprint of the original content so a repeated submission cannot trigger another email. Pending and failed records cannot be redacted until delivery has been reviewed. This action does not remove copies from the studio mailbox, Mailgun or backups. No automatic retention period has been selected; Cameron must approve a retention schedule and the corresponding cleanup process before enabling live capture.

Before launch, update the privacy policy with Mailgun as processor, hosting and mailbox retention details, and the actual booking provider. Use fabricated details and an isolated sink for automated tests. A real test email requires Cameron to initiate it in admin. `npm test`, `npm run typecheck`, and `npm run build` send no email.


## Retry safety (local implementation)

The browser supplies a UUID `Idempotency-Key`, retained for retries of the unchanged brief during the current page session. Editing the brief or reloading the page starts a new submission. The gateway atomically reserves the encrypted record before calling Mailgun. An already accepted ID returns success without resending; pending or failed IDs require delivery review. Reusing an ID with different content is rejected. Older clients without a key remain supported but have no retry deduplication.

A transport error may occur after Mailgun accepted a message. `delivery-failed` therefore means the request did not complete successfully, not proof that Mailgun never received it. Check Mailgun and the destination mailbox before manually following up. There is no automatic retry job. Reservation and acceptance survive gateway restart. Local tests cover simultaneous submissions, lost responses, changed content, restart and encrypted storage.

Remaining release gates: live Mailgun setup and approved test receipt, approved retention policy and cleanup of mailbox/provider/backup copies, rendered admin review, and full preview form verification. No live email was sent during these checks.

## Campaign attribution

Briefs optionally include a known `campaign` slug: creative-partner, shopify-design, packaging-design, brand-launch or website-redesign. The frontend passes it from campaign links; the API validates the allowlist before storage/delivery. It appears in the encrypted record, admin record view and plain-text message. Arbitrary UTM/search values are not collected. Attribution describes the referral page, not a verified ad conversion or booking. A local real-handler integration test verifies persistence, message construction and accepted retry deduplication using an isolated sink; it sends no Mailgun request.

## Preview readiness observation — 26 September 2026

Read-only inspection found the preview gateway healthy, with `DATA_DIR=/data` empty and a setup token present. No admin-state file, saved Mailgun configuration or recorded test existed. No settings were changed and no secret values were printed. Cameron must complete the admin setup before live delivery can be verified. The public static marker still identified e5c62c88ef6bc7f2f40d15243c8b329e20fb1885 at this check. Local implementation and isolated browser success do not establish preview delivery readiness.
