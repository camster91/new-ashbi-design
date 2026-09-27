# Ashbi character and brand integration plan

Status: proposed, 2026-09-26. Planning only; no site or Figma edits and no deployment.

## Source evidence

- Social/brand exploration: https://www.figma.com/design/Dh3de0jWEag4R0FuuJhZNd?node-id=64-2 — original hand character, doodles, circles, grids, editorial layouts and broader colour explorations.
- Welcome guide: https://www.figma.com/design/Dh3de0jWEag4R0FuuJhZNd?node-id=66-2051 — frame 66:2081 visually reviewed; text 66:2108 confirms Neue Haas Grotesk Display Pro 55 Roman and PP Editorial New Ultralight Italic. Greeting uses #eaf893. Forest and burgundy seen visually; exact values not extracted.
- Components: https://www.figma.com/design/qZaTebveZO0OgI1xB5Ku7X?node-id=0-1 — frame 1:2 visually reviewed; design context confirms #42467D, #2B2E52, #D8FFC2, #E6F254, #D2DEEA, #FFFDF2, #FFFDF4 and #17826A. Component buttons use Roboto Medium; do not import a third UI font solely for those buttons.
- Current local source: src/styles/ashbi.css and src/styles/fonts.css use Plus Jakarta Sans, indigo/cream/pale lime; homepage already consolidates services and partnerships.
- Limits: Figma scripting required unavailable approval; ordinary metadata, screenshot and design-context reads succeeded. Live browser unavailable; no fresh live visual QA claimed. Reference copy includes old dates and placeholders and is not approved website copy.

## Direction

An expressive independent studio: editorial typography, original Ashbi illustration, colourful section changes and real product work. Keep the existing script logo and recognisable indigo. Give the work space to be seen and booking a clear consistent treatment.

## Foundation

1. Use Neue Haas for principal headings/body where suitable; PP Editorial italic for one deliberate phrase in major headings. Obtain licensed webfont files before delivery; Figma availability does not establish web licensing. Retain a working fallback until supplied. Avoid ultra-light small text.
2. Token roles: indigo #42467D for identity, deep ink #2B2E52 for reading, cream #FFFDF4 for canvas, mint #D8FFC2 for supportive panels, yellow #E6F254 for main actions, powder #D2DEEA for quiet panels, green #17826A for selected brand moments. Test contrast before assigning text combinations. Burgundy/forest remain optional accents to validate with the actual source values.
3. Export original SVG hand character, monogram, arrows, bursts, circles/stamps, underline marks and grid texture. Store source node and usage notes. Do not substitute generated mascots or fictional project work.
4. Define reusable BrandHeading, BrandStamp, DoodleAccent, SectionSurface, ProjectFrame and BrandCTA components. Content editing can choose approved variants, not arbitrary fonts/colours.

## Page and section mapping

| Area | Proposed treatment | Purpose |
|---|---|---|
| Navigation | Existing script logo; monogram option for small UI; animated underline and concise colourful mobile menu | Recognition and clear navigation |
| Hero | Editorial word contrast; indigo or forest surface tested as a mockup; one original hand character at edge; purposeful stamp; aligned large project reels | Distinctive first impression with usable CTAs |
| Featured brands | Full-colour authentic logos with matched optical sizes, consistent spacing | Immediate proof |
| Selected work | Larger photography, less repeated card framing, restrained project-specific backgrounds and editorial captions | Make real work the main visual event |
| Testimonials | Readable quotations on mint/powder/cream, original quote doodle; manual/pause controls retained | Human proof without excessive visual noise |
| Services and partnerships | Preserve consolidated section; give ongoing partnership the strongest emphasis; specific icons and accent colours; fewer nested borders | Clarify the offer and ongoing relationship |
| Studio | Authentic portraits, greeting from the guide, hand character, one annotation-style detail | Show the people and their personality |
| Process | Four connected steps with custom arrows/grid; progress follows scroll | Explain collaboration clearly |
| FAQ | Quiet layout and small illustration beside intro, clear focus/open states | Resolve concerns without distraction |
| Closing CTA/footer | Large original monogram/script, strong coloured field and a concise invitation | Memorable finish with obvious booking route |
| Work and cases | Shared editorial structure, client-specific artwork and colour, image focal points by breakpoint | More individual stories and less template repetition |
| Services | Relevant proof and one custom service illustration; consistent booking | Match capability to evidence |
| Insights | Original typographic/diagram covers and comfortable article measure | Make useful content recognisably Ashbi |
| Campaign pages | Same brand fonts and art, reduced decoration, offer-specific proof | Preserve message match and lead flow |
| Hub/portals | Same identity with calmer cream surfaces, small character moments in welcome/empty/success states | Brand continuity while keeping tasks readable |

## Motion

Use GSAP for selective headline/illustration entrances, small parallax offsets, SVG line reveals and card transitions. Continuous movement remains pausable. Mobile uses shorter distances, native scrolling and tap controls. Reduced motion gets a complete static presentation. No scroll hijacking, essential hover-only content or animated form fields. Keep focus and CTA hit areas stable.

## Delivery order and review gates

1. Asset/font inventory: node IDs, SVG exports, exact palette, licensed webfont availability and current screenshot baseline.
2. Build reviewable desktop/mobile compositions for hero, consolidated services/partnerships, and studio/closing CTA. Review 375 and 1440 widths before broad rollout.
3. Implement accepted design tokens and reusable brand components; integrate homepage while retaining all CRO fixes and featured order Della, BPM, Marin, CocoFro. Marin remains food/packaging-led; Blend and Natural Matcha stay removed.
4. Apply the system to work, services, insights and campaigns. Connect CMS variant fields to real components. Confirm existing Ashbi Hub repository before implementing Hub styling or duplicate backend modules.
5. Verify 375/768/1440 layouts, content reflow, keyboard, touch, pause/reduced-motion, contrast, image framing, font loading, asset sizes and booking/enquiry journeys. Recheck page speed against baseline and production build.
6. Present side-by-side results and publish to preview only when authorised for that release. Main-domain launch is separate.

## Success criteria

Ashbi's original visual assets and type are recognisable; real work remains dominant; ongoing partnership is featured; every campaign has clear proof and next action; colour and motion do not harm reading, interaction or performance. No unsupported project imagery, stale guide copy or unverified client claims.

## First pass implemented locally — 2026-09-26

- Homepage-scoped brand palette and editorial fallback in `src/styles/brand-home.css`.
- Original hand illustration exported from node 71:2477; source recorded alongside SVG.
- Indigo/grid hero, yellow editorial accents, original hand and existing functional reels.
- Consolidated offer grid: green full-width ongoing partnership, three supporting offers; single-column mobile layout.
- Studio greeting, arched photo frame and expressive closing invitation.
- Hand entrance and stamp reveal join existing GSAP pause/reduced-motion lifecycle.
- Shared booking CTA expressive treatment is opt-in on homepage only.
- Brand fonts not supplied: Plus Jakarta Sans remains the sans; Georgia is the editorial fallback. No exact brand-font delivery claimed.
- Verified: typecheck, 22 existing tests, 75-page build; local homepage HTTP 200.
- Not verified: rendered desktop/mobile. In-app browser unavailable; native Chrome control denied by approval policy. Do not treat build as visual approval. Reopen browser access and review 375/768/1440 before rollout or deployment.
- No deployment, push or production change.
