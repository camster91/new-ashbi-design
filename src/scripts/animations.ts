// Animation layer. Provides two animation engines for the template:
//   1) `data-anim` engine: inline-driven animations (Expertise bento, fade-ups, tag marquees).
//   2) Hook-driven (`animation=` / data-* attributes): hero entrance, scroll reveals, logo marquee
//      built as GSAP timelines.
// Plus number counters and generic reveals. prefers-reduced-motion is respected throughout.

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ───────────────────────── 1. data-anim engine ─────────────────────────
function initDataAnim() {
  // Smart trigger: play on load if visible, use ScrollTrigger if below the fold.
  function smartPlay(el: Element, tl: gsap.core.Timeline, delay?: number) {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.85) {
      tl.delay(delay || 0.3).play();
    } else {
      ScrollTrigger.create({ trigger: el, start: "top 85%", onEnter: () => tl.play() });
    }
  }

  // 1. CARD REVEAL (Expertise bento cards)
  document.querySelectorAll<HTMLElement>('[data-anim="card-reveal"]').forEach((c) => {
    const tl = gsap.timeline({ paused: true });
    tl.from(c, { autoAlpha: 0, scale: 0.92, duration: 0.55, ease: "power3.out" });
    const labels = c.querySelectorAll('[data-anim="fade-up"]');
    if (labels.length) {
      tl.from(labels, { autoAlpha: 0, y: 10, duration: 0.4, stagger: 0.1, ease: "power2.out" }, "-=0.4");
    }
    c.querySelectorAll<HTMLElement>('[data-anim="progress"]').forEach((b) => {
      const f = b.firstElementChild as HTMLElement | null;
      if (f) {
        const w = f.style.width || "49%";
        gsap.set(f, { width: "0%" });
        tl.to(f, { width: w, duration: 0.9, ease: "power2.inOut" }, "-=0.15");
      }
    });
    c.querySelectorAll<HTMLElement>('[data-anim="stagger-rows"]').forEach((r) => {
      tl.from(r.children, { autoAlpha: 0, x: 20, duration: 0.4, stagger: 0.1, ease: "power2.out" }, "-=0.35");
    });
    const barChart = c.querySelector('[data-anim="bar-grow"]');
    if (barChart) {
      const barEls = barChart.querySelectorAll<HTMLElement>(".bcard_bar");
      barEls.forEach((bar) => gsap.set(bar, { scaleY: 0, transformOrigin: "bottom center" }));
      const yearLabels = barChart.querySelectorAll(".bcard_text-year");
      tl.from(yearLabels, { autoAlpha: 0, y: 6, duration: 0.25, stagger: 0.05, ease: "power2.out" }, "-=0.3");
      tl.to(barEls, { scaleY: 1, duration: 0.6, stagger: 0.09, ease: "back.out(1.4)" }, "-=0.1");
    }
    c.querySelectorAll<HTMLElement>('[data-anim="stagger-text"]').forEach((st) => {
      tl.from(st.children, { autoAlpha: 0, y: 12, duration: 0.35, stagger: 0.09, ease: "power2.out" }, "-=0.35");
    });
    smartPlay(c, tl, 0.3);
  });

  // 2. ORBIT REVEAL (ocard)
  document.querySelectorAll<HTMLElement>('[data-anim="orbit-reveal"]').forEach((o) => {
    const tl = gsap.timeline({ paused: true });
    const rings = o.querySelectorAll(".ocard_ring");
    tl.from(o, { autoAlpha: 0, duration: 0.25 });
    tl.from(rings, { scale: 0, autoAlpha: 0, duration: 0.45, ease: "back.out(2)" }, "-=0.15");
    const center = o.querySelector('[data-anim="fade-up"]');
    if (center) tl.from(center, { scale: 0, autoAlpha: 0, duration: 0.45, ease: "back.out(2)" }, "-=0.4");
    const pills = o.querySelectorAll<HTMLElement>('[data-anim="pill-float"]');
    pills.forEach((pill) => {
      tl.from(pill, { autoAlpha: 0, scale: 0.7, duration: 0.5, ease: "back.out(1.5)" }, "-=0.35");
    });
    // continuous orbit after the reveal
    tl.call(() => {
      const oRect = o.getBoundingClientRect();
      const cx = oRect.left + oRect.width / 2;
      const cy = oRect.top + oRect.height / 2;
      const durations = [50, 60, 45];
      pills.forEach((pill, i) => {
        const pRect = pill.getBoundingClientRect();
        const px = pRect.left + pRect.width / 2;
        const py = pRect.top + pRect.height / 2;
        const dx = px - cx, dy = py - cy;
        const radius = Math.sqrt(dx * dx + dy * dy);
        const startAngle = Math.atan2(dy, dx);
        const origX = Math.cos(startAngle) * radius;
        const origY = Math.sin(startAngle) * radius;
        const speed = (2 * Math.PI) / (durations[i] || 50);
        let angle = startAngle;
        gsap.ticker.add(() => {
          angle += (speed * gsap.ticker.deltaRatio(60)) / 60;
          gsap.set(pill, { x: Math.cos(angle) * radius - origX, y: Math.sin(angle) * radius - origY });
        });
      });
    });
    smartPlay(o, tl, 0.3);
  });

  // 3. STANDALONE FADE-UP (no anidado en card/orbit)
  document.querySelectorAll<HTMLElement>('[data-anim="fade-up"]').forEach((el) => {
    if (el.closest('[data-anim="card-reveal"]') || el.closest('[data-anim="orbit-reveal"]')) return;
    const tl = gsap.timeline({ paused: true });
    tl.from(el, { autoAlpha: 0, y: 40, duration: 0.7, ease: "power2.out" });
    smartPlay(el, tl, 0.2);
  });

  // 4. TAG MARQUEES inside cards (data-anim) — speed 35 px/s
  initMarquee('[data-anim="marquee-right"]', "left", 35);
  initMarquee('[data-anim="marquee-left"]', "right", 35);
}

// Seamless marquee; the children are duplicated ×2 in the markup.
function initMarquee(selector: string, direction: "left" | "right", speed: number) {
  document.querySelectorAll<HTMLElement>(selector).forEach((row) => {
    const items = gsap.utils.toArray<HTMLElement>(row.children);
    if (!items.length) return;
    const half = items.length / 2;
    let totalWidth = 0;
    for (let i = 0; i < half; i++) {
      totalWidth += items[i].offsetWidth + parseFloat(getComputedStyle(row).gap || "0");
    }
    const duration = totalWidth / speed;
    if (direction === "left") {
      gsap.set(row, { x: 0 });
      gsap.to(row, {
        x: -totalWidth, duration, ease: "none", repeat: -1,
        modifiers: { x: gsap.utils.unitize((x: number) => parseFloat(x as any) % totalWidth) },
      });
    } else {
      gsap.set(row, { x: -totalWidth });
      gsap.to(row, {
        x: 0, duration, ease: "none", repeat: -1,
        modifiers: { x: gsap.utils.unitize((x: number) => -totalWidth + ((parseFloat(x as any) + totalWidth) % totalWidth)) },
      });
    }
  });
}

// ───────────────────────── 2. HERO ENTRANCE (on load) ─────────────────────────
function initHero() {
  const heroBits = document.querySelector('[hero-text], [data-hero-bg], [data-hero-visual], [data-hero-wrap], [data-hero-fade]');
  if (!heroBits) return;
  const tl = gsap.timeline();
  // [data-hero-wrap]: scale 1.1→1 (ease power1.out). Home hero only. Use
  // [data-hero-fade] on secondary heroes.
  gsap.utils.toArray<HTMLElement>("[data-hero-wrap]").forEach((el) => {
    tl.from(el, { scale: 1.1, duration: 1.0, ease: "power1.out" }, 0);
  });
  // [data-hero-fade]: staggered fade-up (opacity 0→1 + y 2rem→0) for secondary-hero
  // content blocks. A single element fades plainly; multiple elements stagger.
  const heroFades = gsap.utils.toArray<HTMLElement>("[data-hero-fade]");
  if (heroFades.length) {
    tl.from(heroFades, { autoAlpha: 0, y: "2rem", duration: 0.8, stagger: 0.12, ease: "power2.out" }, 0);
  }
  // [data-hero-bg]: scale 1.2→1 (ease power1.inOut)
  gsap.utils.toArray<HTMLElement>("[data-hero-bg]").forEach((el) => {
    tl.from(el, { scale: 1.2, duration: 1.5, ease: "power1.inOut" }, 0);
  });
  // [data-hero-visual]: scale 0→1 + opacity (ease back.out(1.7))
  gsap.utils.toArray<HTMLElement>("[data-hero-visual]").forEach((el) => {
    tl.from(el, { scale: 0, autoAlpha: 0, duration: 1.25, ease: "back.out(1.7)" }, 0);
  });
  // [hero-text]: fade up (opacity 0→1 + a short upward move). Multiple lines
  // stagger lightly so the heading and sub-copy enter in quick succession.
  const heroTexts = gsap.utils.toArray<HTMLElement>("[hero-text]");
  if (heroTexts.length) {
    tl.from(heroTexts, { autoAlpha: 0, y: "1.5rem", duration: 0.6, stagger: 0.1, ease: "power2.out" }, 0);
  }
  // [data-hero-button]: scale 0→1 (pos 0.3, stagger)
  const buttons = gsap.utils.toArray<HTMLElement>("[data-hero-button]");
  if (buttons.length) {
    tl.from(buttons, { scale: 0, autoAlpha: 0, duration: 0.6, stagger: { amount: 0.25 }, ease: "power2.out" }, 0.3);
  }
  // [data-hero-stairs]: social proof enters from the left in a staircase cascade.
  // Stagger over [text, avatar-1, avatar-2, avatar-3] so each enters after the previous one.
  gsap.utils.toArray<HTMLElement>("[data-hero-stairs]").forEach((el) => {
    const text = el.querySelector<HTMLElement>(":scope > div:not(.avatars-wrap)");
    const avatars = gsap.utils.toArray<HTMLElement>(el.querySelectorAll(".avatar-item"));
    const targets = [text, ...avatars].filter(Boolean) as HTMLElement[];
    if (!targets.length) return;
    tl.from(targets, { x: -32, autoAlpha: 0, duration: 0.6, stagger: 0.1, ease: "power3.out" }, 0.15);
  });
}

// ───────────── 2b. HERO VISUAL — looping 3D carousel (._3d .group) ─────────────
// The .wrap has a fixed tilt rotateX(-77deg) (perspective 2000px on ._3d). Each
// .group has a base rotateZ (CSS: -15/-30/0) that rotates in a continuous loop.
// ~360° over 40s, linear, negative direction. The relative tween (-=360) preserves
// each group's base rotation offset and loops seamlessly.
function initHeroVisual() {
  gsap.utils.toArray<HTMLElement>("._3d .group").forEach((group) => {
    gsap.to(group, { rotation: "-=360", duration: 40, ease: "none", repeat: -1 });
  });
}

// ───────────────────────── 3. LOGO MARQUEE (.loop_logos) ─────────────────────────
// x 0→-100%, 20s, linear, loop. The two .loop_logos rows are duplicated in the markup,
// so the .loop container is animated as a seamless -50% ribbon.
function initLogoMarquee() {
  document.querySelectorAll<HTMLElement>(".loop").forEach((track) => {
    const rows = track.querySelectorAll<HTMLElement>(".loop_logos");
    if (rows.length < 2) return; // needs 2 identical rows for a seamless loop
    gsap.to(track, { xPercent: -50, duration: 20, ease: "none", repeat: -1 });
  });
}

// Continuous image loops: hero image loop (.loop_img > 2× .loop_img-group) and
// services testimonials (.testi_loop > 2× .testi-services_cards). Same seamless
// pattern as the logo marquee: 2 identical groups in a max-content track →
// translate -50% = one group width, then it restarts invisibly. ≈20s per group,
// moving left. Resolution-independent (xPercent); respects reduced-motion
// (run() exits earlier under `reduce`).
function initLoops() {
  document.querySelectorAll<HTMLElement>(".loop_img, .testi_loop").forEach((track) => {
    if (track.children.length < 2) return; // 2 identical groups for a seamless loop
    gsap.to(track, { xPercent: -50, duration: 20, ease: "none", repeat: -1 });
  });
}

// ──────────── 3b. TITLE ICONS — width 0→3rem on scroll (animation="title") ────────────
// Inline heading icons (.title-icon) grow in width 0→3rem when the heading enters the
// viewport (trigger top 60%). Disabled on small/tiny screens (≤767), where they stay at
// their natural width. gsap.from leaves the final width (3rem) if the JS does not run.
function initTitleIcons() {
  if (window.matchMedia("(max-width: 767px)").matches) return;
  gsap.utils.toArray<HTMLElement>(".title-wrap").forEach((wrap) => {
    const icons = wrap.querySelectorAll(".title-icon");
    if (!icons.length) return;
    gsap.from(icons, {
      width: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: { trigger: wrap, start: "top 60%", once: true },
    });
  });
}

// ───────────────────────── 4. COUNTERS (fs-numbercount → GSAP) ─────────────────────────
function initCounters() {
  document.querySelectorAll<HTMLElement>("[fs-numbercount-element='number'], [fs-numbercount-end]").forEach((el) => {
    const end = parseFloat(el.getAttribute("fs-numbercount-end") || el.textContent || "0");
    const start = parseFloat(el.getAttribute("fs-numbercount-start") || "0");
    const dur = parseFloat(el.getAttribute("fs-numbercount-duration") || "2000") / 1000;
    if (isNaN(end)) return;
    // preserve suffixes/prefixes from the original text (e.g. "+", "k+", "%")
    const raw = (el.textContent || "").trim();
    const suffix = raw.replace(/[\d.,\s]/g, "");
    const obj = { v: start };
    const render = () => { el.textContent = Math.round(obj.v).toLocaleString("en-US") + suffix; };
    render();
    ScrollTrigger.create({
      trigger: el, start: "top 90%", once: true,
      onEnter: () => gsap.to(obj, { v: end, duration: dur, ease: "power1.out", onUpdate: render }),
    });
  });
}

// ───────────────────────── 5. GENERIC SCROLL REVEALS ([data-reveal]) ─────────────────────────
// "opacity" reveal: scale 0.75→1 + opacity, top 90%, once. (Applied to section wrappers.)
function initReveals() {
  document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
    const kind = el.getAttribute("data-reveal") || "up";
    const from: gsap.TweenVars = { autoAlpha: 0, duration: 1, ease: "power3.out" };
    if (kind === "scale") { from.scale = parseFloat(el.getAttribute("data-reveal-scale") || "0.92"); }
    else if (kind === "right") { from.x = "5rem"; }
    else { from.y = 40; }
    gsap.from(el, {
      ...from,
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
    });
  });
}

// ───────────────────────── 6. STAGGER REVEALS ([data-stagger]) ─────────────────────────
// Reveals a container's selected children in a fade-up cascade when it enters the
// viewport. data-stagger = child selector (e.g. ".pricing_card", ".faq_item").
// Animates opacity+y of each individual child (not the container), which is safe with
// Swiper (the Swiper wrapper transforms on x; slides get their own y, so they don't clash).
function initStaggers() {
  document.querySelectorAll<HTMLElement>("[data-stagger]").forEach((group) => {
    const sel = group.getAttribute("data-stagger");
    const targets = sel ? group.querySelectorAll<HTMLElement>(sel) : group.children;
    if (!targets.length) return;
    gsap.from(targets, {
      autoAlpha: 0, y: 28, duration: 0.6, stagger: 0.12, ease: "power3.out",
      scrollTrigger: { trigger: group, start: "top 85%", once: true },
    });
  });
}

// ───────────────────────── bootstrap ─────────────────────────
function run() {
  if (reduce) {
    // show everything statically
    gsap.set("[data-anim], [hero-text], [data-hero-bg], [data-hero-visual], [data-hero-wrap], [data-hero-fade], [data-hero-button], [data-hero-stairs] *, [data-stagger] > *, [data-reveal]", {
      clearProps: "all", autoAlpha: 1,
    });
    return;
  }
  initDataAnim();
  initHero();
  initHeroVisual();
  initTitleIcons();
  initLogoMarquee();
  initLoops();
  initCounters();
  initReveals();
  initStaggers();
  // refresh ScrollTrigger after images/fonts load
  window.addEventListener("load", () => ScrollTrigger.refresh());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", run);
} else {
  run();
}
