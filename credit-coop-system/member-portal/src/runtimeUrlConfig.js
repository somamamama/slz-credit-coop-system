const URL_MAP = Object.freeze({
  'http://localhost:5001': process.env.REACT_APP_MEMBER_API_URL || 'http://localhost:5001',
  'http://localhost:5000': process.env.REACT_APP_STAFF_API_URL || 'http://localhost:5000',
  'http://localhost:3002': process.env.REACT_APP_LANDING_API_URL || 'http://localhost:3002'
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
  if (typeof window === 'undefined' || window.__memberRuntimeUrlInitDone) {
    return;
  }

  window.__memberRuntimeUrlInitDone = true;

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
