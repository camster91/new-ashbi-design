// navbar.ts — scaling-hamburger toggle. Self-contained, no external dependencies.
// =============================================================================
// Menu state lives on <html data-navigation-status> ("active"/"not-active") so the
// pill (inside the navbar) and the dim backdrop (a fixed sibling) react together via
// CSS. No GSAP — pure CSS transitions keyed off the attribute.
//
// Behavior:
//   - click on [data-navigation-toggle="toggle"]  → toggle open/closed
//   - click on [data-navigation-toggle="close"]   → close (the backdrop)
//   - click on a menu link (.hamburger-nav__a)     → close (navigate + close)
//   - Escape                                       → close if open
//   - sticky hide-on-scroll-down / show-on-scroll-up on [data-navbar]
//     (scroll is locked while the menu is open, so the two never fight).
// =============================================================================

function initNavbar() {
  const html = document.documentElement;
  const toggleEls = document.querySelectorAll<HTMLElement>('[data-navigation-toggle="toggle"]');
  const closeEls = document.querySelectorAll<HTMLElement>('[data-navigation-toggle="close"]');
  const menuLinks = document.querySelectorAll<HTMLAnchorElement>('.hamburger-nav__a');

  const setStatus = (active: boolean) => {
    html.setAttribute('data-navigation-status', active ? 'active' : 'not-active');
    html.style.overflow = active ? 'hidden' : '';
    toggleEls.forEach((el) => el.setAttribute('aria-expanded', String(active)));
  };
  setStatus(false);

  toggleEls.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setStatus(html.getAttribute('data-navigation-status') !== 'active');
    });
  });
  closeEls.forEach((el) => el.addEventListener('click', () => setStatus(false)));
  menuLinks.forEach((link) => link.addEventListener('click', () => setStatus(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && html.getAttribute('data-navigation-status') === 'active') {
      setStatus(false);
    }
  });

  // Sticky hide-on-scroll-down / show-on-scroll-up.
  // Scroll is locked while the menu is open, so the two never fight.
  const navbar = document.querySelector<HTMLElement>('[data-navbar]');
  if (navbar) {
    let lastY = window.scrollY;
    window.addEventListener(
      'scroll',
      () => {
        const y = window.scrollY;
        if (y > lastY && y > 200) navbar.classList.add('is-hidden');
        else navbar.classList.remove('is-hidden');
        lastY = y;
      },
      { passive: true }
    );
  }
}

if (document.readyState !== 'loading') initNavbar();
else document.addEventListener('DOMContentLoaded', initNavbar);
