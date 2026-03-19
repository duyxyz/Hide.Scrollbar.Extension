document.addEventListener('DOMContentLoaded', () => {
  const { applyI18n } = globalThis.ScrollHideI18n;
  const { isWhitelisted, normalizeWhitelist, sanitizeDomain } = globalThis.ScrollHideWhitelist;
  const toggle = document.getElementById('toggleScroll');
  const addCurrentBtn = document.getElementById('addCurrentBtn');
  const whitelistedNotice = document.getElementById('whitelistedNotice');
  const restrictedNotice = document.getElementById('restrictedNotice');
  const toggleWhitelist = document.getElementById('toggleWhitelist');
  const domainDisplay = document.getElementById('domainDisplay');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFile');

  let currentHostname = '';
  let isRestricted = false;

  const RESTRICTED_PROTOCOLS = ['chrome:', 'chrome-extension:', 'edge:', 'about:', 'view-source:', 'devtools:'];
  const RESTRICTED_HOSTS = ['chrome.google.com', 'chromewebstore.google.com'];

  const checkRestricted = (url) => {
    if (!url) return true;
    try {
      const parsed = new URL(url);
      if (RESTRICTED_PROTOCOLS.includes(parsed.protocol)) return true;
      if (RESTRICTED_HOSTS.includes(parsed.hostname)) return true;
    } catch (_) {
      return true;
    }
    return false;
  };

  const applyRestrictedState = () => {
    toggle.classList.remove('active');
    toggle.disabled = true;
    toggle.style.opacity = '0.4';
    toggle.style.pointerEvents = 'none';
    restrictedNotice.style.display = 'block';
    addCurrentBtn.disabled = true;
  };

  const updateNotice = (whitelist) => {
    if (!currentHostname) {
      whitelistedNotice.style.display = 'none';
      domainDisplay.textContent = chrome.i18n.getMessage('cantAddPage') || 'Invalid Page';
      addCurrentBtn.disabled = true;
      return;
    }

    domainDisplay.textContent = currentHostname;

    const inList = isWhitelisted(currentHostname, whitelist);
    whitelistedNotice.style.display = inList ? 'block' : 'none';

    if (inList || isRestricted) {
      toggle.classList.remove('active');
      toggle.disabled = true;
      toggle.style.opacity = '0.4';
      toggle.style.pointerEvents = 'none';
    } else {
      chrome.storage.sync.get({ scrollbarHidden: true }, (data) => {
        if (isRestricted) return;

        toggle.classList.toggle('active', Boolean(data.scrollbarHidden));
        toggle.disabled = false;
        toggle.style.opacity = '1';
        toggle.style.pointerEvents = 'auto';
      });
    }

    addCurrentBtn.disabled = inList;
  };

  const loadState = () => {
    chrome.storage.sync.get(
      { scrollbarHidden: true, whitelist: [] },
      (data) => {
        if (chrome.runtime.lastError) return;

        toggle.classList.toggle('active', !isRestricted && Boolean(data.scrollbarHidden));
        updateNotice(data.whitelist);
      }
    );
  };

  const addDomain = (raw) => {
    const domain = sanitizeDomain(raw);
    if (!domain) return;
    chrome.storage.sync.get({ whitelist: [] }, (data) => {
      if (chrome.runtime.lastError) return;
      if (data.whitelist.includes(domain)) return;
      const newList = [...data.whitelist, domain].sort();
      chrome.storage.sync.set({ whitelist: newList }, () => {
        updateNotice(newList);
      });
    });
  };

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    const hidden = toggle.classList.contains('active');
    chrome.storage.sync.set({ scrollbarHidden: hidden }, () => {
      if (chrome.runtime.lastError) return;
    });
  });

  addCurrentBtn.addEventListener('click', () => {
    if (currentHostname) addDomain(currentHostname);
  });

  toggleWhitelist.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    if (chrome.sidePanel && chrome.sidePanel.open) {
      await chrome.sidePanel.open({ tabId: tab.id });
    } else if (typeof browser !== 'undefined' && browser.sidebarAction && browser.sidebarAction.open) {
      await browser.sidebarAction.open();
    } else if (chrome.sidebarAction && chrome.sidebarAction.open) {
      await chrome.sidebarAction.open();
    }

    window.close();
  });

  exportBtn.addEventListener('click', () => {
    chrome.storage.sync.get({ scrollbarHidden: true, whitelist: [] }, (data) => {
      if (chrome.runtime.lastError) return;
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'scrollhide-backup.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  });

  importBtn.addEventListener('click', () => {
    importFile.click();
  });

  importFile.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const data = JSON.parse(loadEvent.target.result);
        if (!data || !Array.isArray(data.whitelist)) return;

        const nextState = {
          whitelist: normalizeWhitelist(data.whitelist),
        };

        if (typeof data.scrollbarHidden === 'boolean') {
          nextState.scrollbarHidden = data.scrollbarHidden;
        }

        chrome.storage.sync.get({ whitelist: [] }, (current) => {
          if (chrome.runtime.lastError) return;
          const merged = normalizeWhitelist([
            ...current.whitelist,
            ...nextState.whitelist,
          ]);

          chrome.storage.sync.set({ ...nextState, whitelist: merged }, () => {
            if (chrome.runtime.lastError) return;
            loadState();
          });
        });
      } catch (_) {
        console.error('Invalid JSON');
      }
    };

    reader.readAsText(file);
    importFile.value = '';
  });

  applyI18n();

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabUrl = tabs[0]?.url || '';
    isRestricted = checkRestricted(tabUrl);

    if (!isRestricted && tabUrl) {
      try {
        currentHostname = new URL(tabUrl).hostname;
      } catch (_) {
        currentHostname = '';
      }
    }

    if (isRestricted) {
      applyRestrictedState();
    }

    loadState();
  });
});
