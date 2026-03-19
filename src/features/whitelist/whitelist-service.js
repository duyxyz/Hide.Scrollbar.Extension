(() => {
  const sanitizeDomain = (raw) =>
    String(raw)
      .trim()
      .toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .replace(/\/.*$/, '');

  const normalizeWhitelist = (domains) =>
    [...new Set(
      (Array.isArray(domains) ? domains : [])
        .map((domain) => sanitizeDomain(domain))
        .filter(Boolean)
    )].sort();

  const serializeDomains = (domains) => normalizeWhitelist(domains).join('\n');

  const isWhitelisted = (hostname, whitelist) => {
    if (!hostname) return false;
    const whitelistSet = new Set(whitelist);
    if (whitelistSet.has(hostname)) return true;
    return whitelist.some((domain) => hostname.endsWith(`.${domain}`));
  };

  globalThis.ScrollHideWhitelist = {
    isWhitelisted,
    normalizeWhitelist,
    sanitizeDomain,
    serializeDomains,
  };
})();
