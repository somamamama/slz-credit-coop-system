import axios from 'axios';

const PROD_HOST = 'https://api.slzcreditcoop.online';

const sanitizeApiBase = (value, fallback) => {
  const normalized = String(value || '').trim();
  if (!normalized || /REACT_APP_[A-Z0-9_]+/.test(normalized)) {
    return fallback;
  }
  return normalized;
};

const URL_MAP = Object.freeze({
  'http://localhost:5000': sanitizeApiBase(
    process.env.REACT_APP_STAFF_API_URL,
    process.env.NODE_ENV === 'production' ? PROD_HOST : 'http://localhost:5000'
  ),
  'http://localhost:5001': sanitizeApiBase(
    process.env.REACT_APP_MEMBER_ASSETS_URL || process.env.REACT_APP_MEMBER_API_URL,
    process.env.NODE_ENV === 'production' ? PROD_HOST : 'http://localhost:5001'
  ),
  'http://localhost:3002': sanitizeApiBase(
    process.env.REACT_APP_LANDING_API_URL,
    process.env.NODE_ENV === 'production' ? PROD_HOST : 'http://localhost:3002'
  )
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
  if (typeof window === 'undefined' || window.__staffRuntimeUrlInitDone) {
    return;
  }

  window.__staffRuntimeUrlInitDone = true;

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

  axios.interceptors.request.use((config) => {
    if (config && typeof config.url === 'string') {
      return { ...config, url: resolveRuntimeUrl(config.url) };
    }
    return config;
  });
};
