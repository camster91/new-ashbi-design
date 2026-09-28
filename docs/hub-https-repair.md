# Hub HTTPS repair candidate — 28 September 2026

State: prepared locally; hosting approval pending. No VPS configuration changed.

## Verified findings

- Hostinger VM 1370492, `vps.ashbi.ca`, running at `187.77.26.99`. Both Hub and preview DNS resolve here. Hostinger project inventory returned HTTP 500; SSH recon succeeded.
- Shared Traefik 3.7.5 is running and fronts multiple applications. Hub routes through file provider router/service `hub` to `http://127.0.0.1:3002`, with resolver `letsencrypt` on `websecure`. Current Hub container `ashbi-platform:deploy-c81024e` is healthy. Its image tag alone does not prove remote-main intake code is deployed.
- The certificate served by `hub.ashbi.ca` exactly matches `/opt/traefik/certs/hub.ashbi.ca.crt`. It expired 11 September 2026 at 16:22:53 UTC; fingerprint `47:BD:CA:90:88:11:AF:35:9C:31:A5:55:36:4F:DF:25:FF:88:1F:0F:67:D1:7C:C8:A3:31:46:1B:CD:F0:EF:6D`.
- `/opt/traefik/dynamic/tls.yml` explicitly loads this certificate and its key. Traefik's ACME store has 86 certificates and an account, permission 0600, but no Hub certificate. No Hub entries were found in the bounded last-24-hours/2000-line log sample. No certbot executable or matching renewal timer was found.
- This points to an unmanaged manual Hub certificate remaining loaded while the router also declares ACME. Traefik documents automatic renewal for certificates it generates; removing the stale manual entry is the scoped repair candidate, not proof that issuance will succeed. [Official ACME documentation](https://doc.traefik.io/traefik/reference/install-configuration/tls/certificate-resolvers/acme/).

## Exact prepared change

Remove only these two lines from `/opt/traefik/dynamic/tls.yml`:

```diff
-    - certFile: /etc/traefik/certs/hub.ashbi.ca.crt
-      keyFile: /etc/traefik/certs/hub.ashbi.ca.key
```

Original SHA256: `796f3fa421275821ab3b7db87351efc938acbe4338f5f93e54d7a9415ca735a2`.
Proposed SHA256: `0e902eb6b714b547eb72a790e26db927215c8c2e40e149ed971d6be3fa4244a0`.

Both YAML files were parsed and compared: all other certificate entries are identical. Local artifacts are in `/Users/Cameron/Documents/Codex/2026-09-23/let/outputs/hub-tls-review-2026-09-28/`. No certificate private key was exported or printed.

## Approved execution and verification

1. Re-read current config, compare original hash, and verify shared proxy/application health. A changed hash requires re-preparation, not overwriting concurrent work.
2. Keep an SSH safety session. Save timestamped owner-only backups of dynamic TLS configuration and ACME storage in a named private VPS backup directory. Preserve existing certificate/key files.
3. Atomically replace only the verified dynamic file. Its existing watched file provider can reload it; no shared proxy restart or DNS/firewall change is included.
4. Observe the bounded Hub issuance outcome and normal certificate-verifying HTTPS requests. Do not disable verification or repeatedly force CA requests. Stop on issuance/rate-limit/config errors and inspect the exact result.
5. Verify certificate dates/hostname, the Hub entry point, shared preview response and unchanged preview release marker. This proves HTTPS availability only; authenticated staff/client/portal and governed intake checks remain separate.
6. If configuration causes regression, restore the named dynamic-file backup and verify other sites. Restoration returns Hub to its prior expired-certificate state; it is not successful HTTPS recovery. Do not blindly restore ACME storage after new certificates have been issued.

The Hostinger VPS skill and user AGENTS.md require exact hosting-change approval. Pending approval is not deployment or completion of the integration goal.
