(function () {
  if (globalThis.__ScrollHideInitialized__) return;
  globalThis.__ScrollHideInitialized__ = true;
  const { STYLE_ID } = globalThis.ScrollHideConstants;
  const { getSyncState } = globalThis.ScrollHideStorage;
  const { isWhitelisted } = globalThis.ScrollHideWhitelist;

  const applyStyle = (hide) => {
    let style = document.getElementById(STYLE_ID);
    if (hide && !style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
        ::-webkit-scrollbar { width: 0 !important; height: 0 !important; }
        * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
        div[data-visualcompletion="ignore"][data-thumb="1"],
        .os-scrollbar,
        .simplebar-scrollbar,
        .simplebar-track,
        .ps__rail-x,
        .ps__rail-y,
        .mac-scrollbar {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          width: 0 !important;
          height: 0 !important;
        }
      `;
      (document.head || document.documentElement).appendChild(style);
    } else if (!hide && style) {
      style.remove();
    }
  };

  const update = async () => {
    try {
      const state = await getSyncState();
      applyStyle(state.scrollbarHidden && !isWhitelisted(window.location.hostname, state.whitelist));
    } catch (err) {
      console.error('[Content] Failed to read sync state', { error: err });
      return;
    }
  };

  update();

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && (changes.scrollbarHidden || changes.whitelist)) {
      update();
    }
  });

  const cleanupOrphanedContext = () => {
    if (!chrome.runtime?.id) {
      applyStyle(false);
      globalThis.__ScrollHideInitialized__ = false;
      document.removeEventListener('mousemove', cleanupOrphanedContext);
      document.removeEventListener('scroll', cleanupOrphanedContext);
      document.removeEventListener('keydown', cleanupOrphanedContext);
      document.removeEventListener('click', cleanupOrphanedContext);
    }
  };

  document.addEventListener('mousemove', cleanupOrphanedContext, { passive: true });
  document.addEventListener('scroll', cleanupOrphanedContext, { passive: true });
  document.addEventListener('keydown', cleanupOrphanedContext, { passive: true });
  document.addEventListener('click', cleanupOrphanedContext, { passive: true });
})();
