# Ashbi Design local redesign

Astro implementation of Ashbi's brand and web studio site, adapted from the Aeline template. This project is local for review; no deployment target or automatic deploy workflow is configured.

## Run locally

Requires Node 22.12 or later (tested with Node 26).

```sh
npm install
npm run dev
```

Open `http://127.0.0.1:4321/`. To verify the static output, run `npm run build` and `npm run preview`.

## Content and assets

- `src/data/site.ts`: project stories, services, process, testimonials, FAQs, and booking destination.
- `src/data/insights.ts`: articles migrated from Ashbi's public site, keeping their original URL slugs.
- `public/images/ashbi/`: optimized images from Ashbi's public portfolio and team pages plus the site's social image.
- `src/styles/ashbi.css` and `src/scripts/ashbi.ts`: visual system and interaction behavior.

Book a call opens the public Google Calendar event “30 min with Bianca.” `PUBLIC_BOOKING_URL` can override that destination for a future booking provider. Verify the event page before release; no booking credentials belong in the static build.

The homepage selects CocoFro, Blend, and Clypse Beauty for its detailed stories. The hero and Work archive show the broader original public portfolio, including Tyson Media and SplashTown. Other existing public portfolio URLs remain available in the project archive. Newer projects require public-use approval and verified assets before adding them.

## Review before launch

- Verify the “30 min with Bianca” Google Calendar event on preview and after launch.
- Confirm all project descriptions, team details, and testimonial attribution with Ashbi.
- Review privacy/legal copy against the final hosting, analytics, booking, and email setup.
- Decide production hosting and redirects for historical URLs, then run full staging QA. This folder contains no deploy automation.

## Content expansion and checks

See [implementation notes](docs/content-expansion.md), [original URL inventory](docs/legacy-url-inventory.md), and [enquiry delivery contract](docs/enquiry-contract.md).

```sh
npm test
npm run typecheck
npm run build
```

`PUBLIC_ENQUIRY_ENDPOINT` enables direct brief submission only after the Mailgun gateway and private admin in `server/` are deployed, configured, and verified. Until then, the form offers an email draft and keeps online submission disabled. The Astro site remains static; setup is described in [the enquiry contract](docs/enquiry-contract.md).

Measurement uses local `ashbi:analytics` CustomEvents without network transmission or personal form values. Connect a consent-appropriate analytics handler before measuring production conversion; booking clicks are not completed appointments.
