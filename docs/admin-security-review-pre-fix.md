# Security Review: aeline

## Scope

Source-only review of the new Ashbi admin and enquiry backend.

- Scan mode: scoped_path
- Target kind: directory_snapshot
- Target ID: target_sha256_9e9106f7f12346c0faa25c57b58c15a3e2e0daca6988868a87d58beca8d95e4c
- Snapshot digest: codex-security-snapshot/v1:sha256:788a297a5f70c4c1f25473bc303c1db98145795a7ae257937faa50b73647ce13
- Inventory strategy: scoped_path
- Included paths: server
- Excluded paths: none
- Artifacts reviewed: server/admin.mjs, server/index.mjs, server/enquiry-handler.mjs, server/mailgun.mjs, server/state.mjs, server/Dockerfile, server/Dockerfile.dockerignore

Limitations and exclusions:
- No real credentials or Mailgun calls.
- Proxy and deployment controls unverified.

### Scan Summary

| Field | Value |
| --- | --- |
| Scan outcome | completed |
| Reportable findings | 8 |
| Severity mix | medium: 5, low: 3 |
| Confidence mix | high: 8 |
| Coverage | partial |
| Validation mode | Independent source review and local tests |

Canonical artifacts: `scan-manifest.json`, `findings.json`, and `coverage.json`. This report is a deterministic projection of those files.

## Threat Model

Public visitors can reach the enquiry gateway and admin login through a proxy; authenticated Cameron can change Mailgun settings. Secrets and delivery state are persisted in an encrypted local state file and Mailgun is an external network boundary.

### Assets

- Admin password and sessions
- Mailgun API key and delivery state
- Visitor project briefs

### Trust Boundaries

- Public client to proxy to Node backend
- Admin browser to authenticated backend
- Node process to state volume
- Node process to Mailgun HTTPS API

### Attacker Capabilities

- Make unauthenticated requests to exposed routes
- Supply visitor input and HTTP headers
- Open concurrent authenticated requests if a session is compromised

### Security Objectives

- Keep keys and sessions private
- Prevent unauthorized state changes
- Keep contact and admin paths available
- Send only intended briefs to the fixed recipient

### Assumptions

- Single private backend instance behind HTTPS proxy is documented but not runtime verified.

## Findings

| Finding | Severity | Confidence | Detailed write-up |
| --- | --- | --- | --- |
| [Proxy-shared login quota can lock out Cameron](#finding-1) | medium | high | inline below |
| [Proxy-shared enquiry quota can block all visitors](#finding-2) | medium | high | inline below |
| [In-flight requests can outlive password rotation](#finding-3) | medium | high | inline below |
| [Unmatched admin prefixes can leave connections open](#finding-4) | medium | high | inline below |
| [A Mailgun test can attest to newer untested settings](#finding-5) | medium | high | inline below |
| [Slow or oversized public request bodies can occupy handlers](#finding-6) | low | high | inline below |
| [Concurrent saves can restore a stale Mailgun key](#finding-7) | low | high | inline below |
| [Admin attempt buckets retain stale entries](#finding-8) | low | high | inline below |

### Confidence Scale

| Label | Meaning |
| --- | --- |
| high | Direct evidence supports the finding with no material unresolved blocker. |
| medium | Evidence supports a plausible issue, but material runtime or reachability proof remains. |
| low | Evidence is incomplete and the item is retained only for explicit follow-up. |

<a id="finding-1"></a>

### [1] Proxy-shared login quota can lock out Cameron

| Field | Value |
| --- | --- |
| Severity | medium |
| Confidence | high |
| Confidence rationale | Independent reviewers traced the request path and state transition in the source. |
| Category | authentication |
| CWE | CWE-307 |
| Affected lines | server/admin.mjs:74 |

#### Summary

The admin login throttle keys only on the proxy socket address and charges successful attempts, allowing one caller to exhaust Cameron's bucket.

#### Root Cause

The admin login throttle keys only on the proxy socket address and charges successful attempts, allowing one caller to exhaust Cameron's bucket.

#### Validation

Validated by independent source review; runtime proxy controls were not inspected.

Counterevidence and remaining uncertainty:
- The deployment document requires a private HTTPS proxy and edge limits, but those controls are not yet verified.

#### Dataflow

An unauthenticated caller makes nine Origin-valid login requests via the shared proxy address before Cameron signs in.

#### Reachability

An unauthenticated caller makes nine Origin-valid login requests via the shared proxy address before Cameron signs in.

#### Severity

**Medium** — Source-backed reachable flaw in the reviewed server snapshot.

Additional runtime or deployment evidence could raise or lower this severity.

#### Remediation

Use a trusted client identity or edge per-client limit plus a separate bounded global defense; count failed attempts only.

<a id="finding-2"></a>

### [2] Proxy-shared enquiry quota can block all visitors

| Field | Value |
| --- | --- |
| Severity | medium |
| Confidence | high |
| Confidence rationale | Independent reviewers traced the request path and state transition in the source. |
| Category | availability |
| CWE | CWE-400 |
| Affected lines | server/enquiry-handler.mjs:31 |

#### Summary

The five-request quota keys on the proxy socket address; one visitor can exhaust the common bucket and prevent other briefs.

#### Root Cause

The five-request quota keys on the proxy socket address; one visitor can exhaust the common bucket and prevent other briefs.

#### Validation

Validated by independent source review; runtime proxy controls were not inspected.

Counterevidence and remaining uncertainty:
- The deployment document requires a private HTTPS proxy and edge limits, but those controls are not yet verified.

#### Dataflow

An unauthenticated caller sends five matching-Origin requests through a shared reverse proxy socket, causing legitimate users to receive 429.

#### Reachability

An unauthenticated caller sends five matching-Origin requests through a shared reverse proxy socket, causing legitimate users to receive 429.

#### Severity

**Medium** — Source-backed reachable flaw in the reviewed server snapshot.

Additional runtime or deployment evidence could raise or lower this severity.

#### Remediation

Use trusted edge per-client limits and a separate bounded global delivery budget; do not trust arbitrary forwarding headers.

<a id="finding-3"></a>

### [3] In-flight requests can outlive password rotation

| Field | Value |
| --- | --- |
| Severity | medium |
| Confidence | high |
| Confidence rationale | Independent reviewers traced the request path and state transition in the source. |
| Category | session |
| CWE | CWE-613 |
| Affected lines | server/admin.mjs:111 |

#### Summary

Session validity is captured before body reading and is not checked again before subsequent privileged mutations.

#### Root Cause

Session validity is captured before body reading and is not checked again before subsequent privileged mutations.

#### Validation

Validated by independent source review; runtime proxy controls were not inspected.

Counterevidence and remaining uncertainty:
- The deployment document requires a private HTTPS proxy and edge limits, but those controls are not yet verified.

#### Dataflow

A stolen authenticated request begins before password rotation and completes after sessions.clear.

#### Reachability

A stolen authenticated request begins before password rotation and completes after sessions.clear.

#### Severity

**Medium** — Source-backed reachable flaw in the reviewed server snapshot.

Additional runtime or deployment evidence could raise or lower this severity.

#### Remediation

Revalidate the current session immediately before mutations, use a session generation, and bound request-body reading time.

<a id="finding-4"></a>

### [4] Unmatched admin prefixes can leave connections open

| Field | Value |
| --- | --- |
| Severity | medium |
| Confidence | high |
| Confidence rationale | Independent reviewers traced the request path and state transition in the source. |
| Category | routing |
| CWE | CWE-400 |
| Affected lines | server/index.mjs:33 |

#### Summary

The outer router dispatches every URL beginning /admin, while the inner handler returns false for unmatched paths without responding.

#### Root Cause

The outer router dispatches every URL beginning /admin, while the inner handler returns false for unmatched paths without responding.

#### Validation

Validated by independent source review; runtime proxy controls were not inspected.

Counterevidence and remaining uncertainty:
- The deployment document requires a private HTTPS proxy and edge limits, but those controls are not yet verified.

#### Dataflow

An unauthenticated caller reaching a broad proxy route or backend port can hold many connections with /adminfoo.

#### Reachability

An unauthenticated caller reaching a broad proxy route or backend port can hold many connections with /adminfoo.

#### Severity

**Medium** — Source-backed reachable flaw in the reviewed server snapshot.

Additional runtime or deployment evidence could raise or lower this severity.

#### Remediation

Use exact parsed admin route boundaries and ensure every request receives a 404 or other bounded response.

<a id="finding-5"></a>

### [5] A Mailgun test can attest to newer untested settings

| Field | Value |
| --- | --- |
| Severity | medium |
| Confidence | high |
| Confidence rationale | Independent reviewers traced the request path and state transition in the source. |
| Category | state |
| CWE | CWE-362 |
| Affected lines | server/admin.mjs:123 |

#### Summary

The test uses a state snapshot for Mailgun, then stamps lastTestAt after a concurrent settings save can replace the configuration.

#### Root Cause

The test uses a state snapshot for Mailgun, then stamps lastTestAt after a concurrent settings save can replace the configuration.

#### Validation

Validated by independent source review; runtime proxy controls were not inspected.

Counterevidence and remaining uncertainty:
- The deployment document requires a private HTTPS proxy and edge limits, but those controls are not yet verified.

#### Dataflow

Two authenticated tabs save settings and test concurrently; the test of old settings finishes after new settings are saved.

#### Reachability

Two authenticated tabs save settings and test concurrently; the test of old settings finishes after new settings are saved.

#### Severity

**Medium** — Source-backed reachable flaw in the reviewed server snapshot.

Additional runtime or deployment evidence could raise or lower this severity.

#### Remediation

Compare a current configuration fingerprint inside the serialized update before marking the test accepted.

<a id="finding-6"></a>

### [6] Slow or oversized public request bodies can occupy handlers

| Field | Value |
| --- | --- |
| Severity | low |
| Confidence | high |
| Confidence rationale | Independent reviewers traced the request path and state transition in the source. |
| Category | availability |
| CWE | CWE-400 |
| Affected lines | server/enquiry-handler.mjs:44 |

#### Summary

The gateway has no explicit body-read deadline and resumes an over-limit stream after returning 413.

#### Root Cause

The gateway has no explicit body-read deadline and resumes an over-limit stream after returning 413.

#### Validation

Validated by independent source review; runtime proxy controls were not inspected.

Counterevidence and remaining uncertainty:
- The deployment document requires a private HTTPS proxy and edge limits, but those controls are not yet verified.

#### Dataflow

An unauthenticated caller sends an endless or very large body through a proxy without a read deadline.

#### Reachability

An unauthenticated caller sends an endless or very large body through a proxy without a read deadline.

#### Severity

**Low** — Source-backed reachable flaw in the reviewed server snapshot.

Additional runtime or deployment evidence could raise or lower this severity.

#### Remediation

Apply explicit server/proxy read timeouts and stop over-limit body processing.

<a id="finding-7"></a>

### [7] Concurrent saves can restore a stale Mailgun key

| Field | Value |
| --- | --- |
| Severity | low |
| Confidence | high |
| Confidence rationale | Independent reviewers traced the request path and state transition in the source. |
| Category | state |
| CWE | CWE-362 |
| Affected lines | server/admin.mjs:118 |

#### Summary

A blank key resolves from the request's earlier state snapshot before the queued state update.

#### Root Cause

A blank key resolves from the request's earlier state snapshot before the queued state update.

#### Validation

Validated by independent source review; runtime proxy controls were not inspected.

Counterevidence and remaining uncertainty:
- The deployment document requires a private HTTPS proxy and edge limits, but those controls are not yet verified.

#### Dataflow

Two authenticated settings saves overlap, and the later commit uses an older key snapshot.

#### Reachability

Two authenticated settings saves overlap, and the later commit uses an older key snapshot.

#### Severity

**Low** — Source-backed reachable flaw in the reviewed server snapshot.

Additional runtime or deployment evidence could raise or lower this severity.

#### Remediation

Resolve the blank key inside the queued state update and reject stale form versions.

<a id="finding-8"></a>

### [8] Admin attempt buckets retain stale entries

| Field | Value |
| --- | --- |
| Severity | low |
| Confidence | high |
| Confidence rationale | Independent reviewers traced the request path and state transition in the source. |
| Category | availability |
| CWE | CWE-770 |
| Affected lines | server/admin.mjs:59 |

#### Summary

The login/setup attempt map never evicts expired keys, allowing memory growth over the process lifetime.

#### Root Cause

The login/setup attempt map never evicts expired keys, allowing memory growth over the process lifetime.

#### Validation

Validated by independent source review; runtime proxy controls were not inspected.

Counterevidence and remaining uncertainty:
- The deployment document requires a private HTTPS proxy and edge limits, but those controls are not yet verified.

#### Dataflow

Many distinct source identities repeatedly reach login/setup through a broad deployment.

#### Reachability

Many distinct source identities repeatedly reach login/setup through a broad deployment.

#### Severity

**Low** — Source-backed reachable flaw in the reviewed server snapshot.

Additional runtime or deployment evidence could raise or lower this severity.

#### Remediation

Expire stale records and cap map size or use a bounded store.

## Reviewed Surfaces

| Surface | Risk Area | Outcome | Notes |
| --- | --- | --- | --- |
| Admin authentication, setup, sessions and CSRF | not recorded | Reported | All routes in server/admin.mjs reviewed. |
| Encrypted state and Mailgun configuration | not recorded | Reported | State and Mailgun network path reviewed. |
| Public enquiry validation and delivery | not recorded | Reported | Gateway and backend router reviewed. |
| Docker and documented deployment boundary | not recorded | No issue found | Source reviewed; runtime network, proxy and topology remain deployment gates. |

## Open Questions And Follow Up

- Before preview exposure verify private HTTPS proxy, exact path routing, true-client-IP edge limits, request timeouts, persistent volume and single-instance topology.
- Baseline candidate pending parent validation
  - Follow-up prompt: Review deferred unit prefix-routing and close its stated proof gap. Paths: server/index.mjs, server/admin.mjs.
- Baseline candidate pending parent validation
  - Follow-up prompt: Review deferred unit shared-enquiry-quota and close its stated proof gap. Paths: server/enquiry-handler.mjs.
- Baseline and focused candidate pending parent validation
  - Follow-up prompt: Review deferred unit shared-admin-throttle and close its stated proof gap. Paths: server/admin.mjs.
- Baseline and focused candidate pending parent validation
  - Follow-up prompt: Review deferred unit unbounded-attempt-map and close its stated proof gap. Paths: server/admin.mjs.
- Focused candidate pending parent validation
  - Follow-up prompt: Review deferred unit test-settings-race and close its stated proof gap. Paths: server/admin.mjs, server/state.mjs.
- Focused candidate pending parent validation
  - Follow-up prompt: Review deferred unit stale-api-key-race and close its stated proof gap. Paths: server/admin.mjs, server/state.mjs.
- Focused candidate pending parent validation
  - Follow-up prompt: Review deferred unit password-rotation-race and close its stated proof gap. Paths: server/admin.mjs.
- Conditional deployment candidate; verify reachability before report
  - Follow-up prompt: Review deferred unit deployment-plaintext and close its stated proof gap. Paths: server/index.mjs, server/Dockerfile.
- Conditional deployment candidate; verify instance count before report
  - Follow-up prompt: Review deferred unit multi-instance-state and close its stated proof gap. Paths: server/state.mjs.
