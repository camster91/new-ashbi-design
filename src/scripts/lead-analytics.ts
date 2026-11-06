const storageKey = 'ashbi:analytics-consent:v1';
const choice = document.querySelector<HTMLInputElement>('[data-analytics-choice]');
const setting = document.querySelector<HTMLElement>('[data-analytics-preferences]');
const measurementId = setting?.dataset.measurementId;

if (choice && measurementId && /^G-[A-Z0-9]+$/.test(measurementId)) {
  const gaWindow = window as Window & { dataLayer?: unknown[] };
  const disableKey = 'ga-disable-' + measurementId;
  let initialized = false;

  function isAllowed() {
    try {
      return localStorage.getItem(storageKey) === 'granted';
    } catch {
      return false;
    }
  }

  function syncChoice() {
    const allowed = isAllowed();
    choice!.checked = allowed;
    Object.assign(gaWindow, { [disableKey]: !allowed });
  }

  function gtag(..._args: unknown[]) {
    (gaWindow.dataLayer ??= []).push(arguments);
  }

  choice.addEventListener('change', () => {
    try {
      if (choice.checked) localStorage.setItem(storageKey, 'granted');
      else localStorage.removeItem(storageKey);
    } catch {
      // If the preference cannot be saved, leave analytics disabled.
    }
    syncChoice();
  });
  window.addEventListener('storage', event => {
    if (event.key === storageKey || event.key === null) syncChoice();
  });
  syncChoice();
  setting?.removeAttribute('hidden');

  window.addEventListener('ashbi:analytics', event => {
    const detail = (event as CustomEvent<{ event?: string }>).detail;
    if (detail?.event !== 'brief_success' || !isAllowed()) return;

    if (!initialized) {
      initialized = true;
      gtag('js', new Date());
      gtag('config', measurementId, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        page_location: location.origin + location.pathname,
        page_referrer: '',
      });
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
      document.head.append(script);
    }

    // The enquiry event can carry context locally. Forward only the conversion.
    gtag('event', 'generate_lead', { send_to: measurementId });
  });
}
