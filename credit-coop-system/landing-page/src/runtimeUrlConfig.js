const sanitizeApiBase = (value, fallback) => {
  const normalized = String(value || '').trim();

  // Ignore unresolved placeholders like REACT_APP_* that can become bad relative URLs.
  if (!normalized || /^\/?REACT_APP_/i.test(normalized)) {
    return fallback;
  }

  return normalized;
};

const LANDING_API_FALLBACK =
  process.env.NODE_ENV === 'production' ? 'https://api.slzcreditcoop.online' : 'http://localhost:3002';

const URL_MAP = Object.freeze({
  'http://localhost:3002': sanitizeApiBase(process.env.REACT_APP_LANDING_API_URL, LANDING_API_FALLBACK),
  'http://localhost:5001': sanitizeApiBase(process.env.REACT_APP_MEMBER_API_URL, 'http://localhost:5001'),
  'http://localhost:5000': sanitizeApiBase(process.env.REACT_APP_STAFF_API_URL, 'http://localhost:5000')
});

const resolveBase = (base) => String(base || '').replace(/\/$/, '');

export const resolveRuntimeUrl = (url) => {
  if (typeof url !== 'string') {
    return url;
  }

  for (const [fromBase, toBase] of Object.entries(URL_MAP)) {
    if (url.startsWith(fromBase)) {
      return `${resolveBase(toBase)}${url.slice(fromBase.length)}`;
    }
  }

  return url;
};

export const initializeRuntimeUrlConfig = () => {
  if (typeof window === 'undefined' || window.__landingRuntimeUrlInitDone) {
    return;
  }

  window.__landingRuntimeUrlInitDone = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    if (typeof input === 'string') {
      return originalFetch(resolveRuntimeUrl(input), init);
    }

    if (input instanceof Request) {
      const rewrittenUrl = resolveRuntimeUrl(input.url);
      if (rewrittenUrl !== input.url) {
        return originalFetch(new Request(rewrittenUrl, input), init);
      }
    }

    return originalFetch(input, init);
  };
};
