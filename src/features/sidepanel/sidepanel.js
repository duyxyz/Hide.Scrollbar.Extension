const textarea = document.getElementById('whitelistTextarea');
const saveStatus = document.getElementById('saveStatus');
const { applyI18n } = globalThis.ScrollHideI18n;
const { normalizeWhitelist, serializeDomains } = globalThis.ScrollHideWhitelist;

let lastSavedValue = '';
let lastKnownStorageValue = '';

const setSaveStatus = (message) => {
  saveStatus.textContent = message;
  saveStatus.classList.toggle('visible', Boolean(message));
};

const renderWhitelist = (domains) => {
  const nextValue = serializeDomains(domains);
  textarea.value = nextValue;
  lastSavedValue = nextValue;
  lastKnownStorageValue = nextValue;
};

const save = () => {
  const draftDomains = normalizeWhitelist(textarea.value.split('\n'));

  chrome.storage.sync.get({ whitelist: [] }, (data) => {
    if (chrome.runtime.lastError) {
      setSaveStatus(chrome.i18n.getMessage('error') || 'Error');
      return;
    }

    const remoteValue = serializeDomains(data.whitelist);
    const nextDomains = remoteValue === lastKnownStorageValue
      ? draftDomains
      : normalizeWhitelist([...data.whitelist, ...draftDomains]);

    if (remoteValue !== lastKnownStorageValue) {
      renderWhitelist(nextDomains);
    }

    chrome.storage.sync.set({ whitelist: nextDomains }, () => {
      if (chrome.runtime.lastError) {
        setSaveStatus(chrome.i18n.getMessage('error') || 'Error');
        return;
      }
      lastSavedValue = serializeDomains(nextDomains);
      lastKnownStorageValue = lastSavedValue;
      setSaveStatus(chrome.i18n.getMessage('saved') || 'Saved');
      setTimeout(() => setSaveStatus(''), 1500);
    });
  });
};

chrome.storage.sync.get({ whitelist: [] }, (data) => {
  if (!chrome.runtime.lastError) {
    renderWhitelist(data.whitelist);
  }
});

let saveTimer;
textarea.addEventListener('input', () => {
  setSaveStatus(chrome.i18n.getMessage('saving') || 'Saving...');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 500);
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace !== 'sync' || !changes.whitelist) return;

  const nextDomains = changes.whitelist.newValue || [];
  const nextValue = serializeDomains(nextDomains);
  lastKnownStorageValue = nextValue;

  if (textarea.value === lastSavedValue || textarea.value === nextValue) {
    renderWhitelist(nextDomains);
  }
});

applyI18n();
