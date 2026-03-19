const textarea = document.getElementById('whitelistTextarea');
const saveStatus = document.getElementById('saveStatus');
const { applyI18n } = globalThis.ScrollHideI18n;
const { DEFAULT_SYNC_STATE } = globalThis.ScrollHideConstants;
const { getSyncState, setSyncValue } = globalThis.ScrollHideStorage;
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

  getSyncState()
    .then((data) => {
      const remoteValue = serializeDomains(data.whitelist);
      const nextDomains = remoteValue === lastKnownStorageValue
        ? draftDomains
        : normalizeWhitelist([...data.whitelist, ...draftDomains]);

      if (remoteValue !== lastKnownStorageValue) {
        renderWhitelist(nextDomains);
      }

      return setSyncValue({ whitelist: nextDomains }).then(() => {
        lastSavedValue = serializeDomains(nextDomains);
        lastKnownStorageValue = lastSavedValue;
        setSaveStatus(chrome.i18n.getMessage('saved') || 'Saved');
        setTimeout(() => setSaveStatus(''), 1500);
      });
    })
    .catch(() => {
      setSaveStatus(chrome.i18n.getMessage('error') || 'Error');
    });
};

getSyncState()
  .then((data) => {
    renderWhitelist(data.whitelist);
  })
  .catch(() => {
    renderWhitelist(DEFAULT_SYNC_STATE.whitelist);
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
