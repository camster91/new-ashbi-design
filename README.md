# Ashbi Design website

The next version of the Ashbi Design studio site: a static Astro build with a portfolio, services, campaign pages, articles and a small Node gateway for enquiries and editorial content.

![Ashbi Design social card featuring CocoFro packaging work](public/images/ashbi/og-default.webp)

## What it is

Ashbi Design is a Toronto branding and web studio for growing businesses, with a focus on CPG, DTC and packaging. This repo is a ground-up rebuild of the studio's public site in Astro. It ships as a fully static site for speed and simplicity, while a separate, optional Node service handles brief submissions and a private editor for site copy. The public pages never depend on that service being up: without it, the contact form falls back to an email draft.

The site is built for review before launch on the main domain. Every push to `main` runs the full verification pipeline in GitHub Actions.

## Key features

- **Portfolio and case studies**: project pages with responsive image galleries (multiple widths per image), project context, approach, deliverables and outcomes, plus a filterable work archive.
- **Services, pricing and campaigns**: service detail pages, ongoing plan options and focused campaign landing pages that carry service and project context into the brief.
- **Insights**: articles migrated from the previous site on their original URL slugs, plus buyer guides linked to real work and services.
- **Legacy URL coverage**: older portfolio routes (`/branding-projects/`, `/web-design-projects/`) are kept so existing links keep working.
- **Enquiry flow**: a brief form that can post to a Mailgun-backed gateway or to the studio's client Hub, with consent and privacy-version handling. Online submission stays off until an endpoint is configured.
- **Private editorial CMS**: an authenticated `/admin/content` editor for homepage, service, campaign, project and article copy with drafts, review, approval, revision history, stale-write protection and CSRF checks. Approved edits are exported as JSON and applied to source through a validated CLI, so the public build stays static and reviewable.
- **Draft layout previews**: render a saved draft in the real Astro layouts in an isolated directory, with a draft banner and `noindex`.
- **Privacy-first measurement**: page views and conversion events are emitted as local `ashbi:analytics` CustomEvents with no network calls and no form values, ready to connect to a consent-appropriate analytics handler.
- **Build-time quality gates**: scripts check every built internal link and fragment, the sitemap and the rendered CMS content before a build is accepted.
- **Motion**: GSAP-driven animations, a looping logo and quote scroller, and a work carousel.

## Tech stack

- [Astro](https://astro.build) 7 (static output) with `@astrojs/sitemap`
- TypeScript
- GSAP for animation
- Inter and Plus Jakarta Sans via Fontsource
- Node.js (22.12+) gateway in `server/` for enquiries and the content editor, with Mailgun for email delivery and a Dockerfile for packaging
- Node's built-in test runner, plus Python `unittest` for one ops helper
- GitHub Actions CI

## Getting started

Requires Node 22.12 or later.

```sh
npm install
npm run dev
```

Open `http://127.0.0.1:4321/`.

To build and serve the static output:

```sh
npm run build
npm run preview
```

### Optional build settings

All are public build-time variables; none are required for local development.

| Variable | Purpose |
|---|---|
| `PUBLIC_ENQUIRY_MODE` | `mailgun` (default) or `hub` |
| `PUBLIC_ENQUIRY_ENDPOINT` | Enables direct brief submission to the enquiry gateway |
| `PUBLIC_HUB_INQUIRY_BASE` | Base URL for Hub mode |
| `PUBLIC_BOOKING_URL` | Overrides the "Book a call" destination |
| `SITE_URL` | Canonical site URL for the sitemap (defaults to the production domain) |

### Enquiry and content gateway

```sh
npm run enquiry-server
```

The gateway needs its own private configuration (staff login, Mailgun and storage settings). See the [enquiry contract](docs/enquiry-contract.md) and the [editorial workflow](docs/website-cms.md) for the request contract, setup and the content review process.

## Testing and checks

```sh
npm test               # unit and integration tests (tests/*.test.ts)
npm run typecheck      # tsc --noEmit
npm run build
npm run check:links    # every internal link and fragment in dist/
npm run check:sitemap
npm run check:content  # rendered CMS content and release gates
```

CI runs all of the above, plus the Python ops test (`python3 -m unittest discover -s ops/tests`), on every pull request and push to `main`.

## Project structure

```
src/
  pages/        routes: home, work, services, pricing, campaigns, insights, legacy URLs
  components/   Astro components (hero, galleries, pricing, FAQ, booking, etc.)
  data/         site, projects, services, insights and CMS-editable JSON
  lib/          content validation, enquiry, analytics and Hub helpers
  scripts/      client-side interaction and motion
  styles/       tokens and page styles
server/         enquiry gateway, private admin and content store
ops/            content apply/preview tools and build checks
tests/          Node test suites
docs/           content, enquiry and CMS documentation
public/         images, fonts and icons
```

## Content and assets

- `src/data/site.ts`: projects, services, process, testimonials, FAQs and the booking destination.
- `src/data/insights.ts`: articles migrated from the previous site, keeping their original slugs.
- `src/data/home-content.json` and `src/data/editorial-content.json`: copy managed through the editor.
- `public/images/ashbi/`: optimized images from Ashbi's public portfolio and team pages.

Portfolio work is only added with public-use approval and real, verified assets. More notes: [content expansion](docs/content-expansion.md) and [original URL inventory](docs/legacy-url-inventory.md).
