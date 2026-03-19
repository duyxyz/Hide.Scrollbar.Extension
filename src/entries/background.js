if (typeof importScripts === 'function') {
  importScripts(
    '../shared/constants.js',
    '../shared/storage.js',
    '../features/whitelist/whitelist-service.js'
  );
}

const { BADGE_ACTIVE_COLOR, BADGE_INACTIVE_COLOR } = globalThis.ScrollHideConstants;
const { getSyncState, syncLocalCache } = globalThis.ScrollHideStorage;
const { isRestrictedUrl, isWhitelisted } = globalThis.ScrollHideWhitelist;

const updateBadge = async (tabId, scrollbarHidden, whitelist) => {
  let restricted = false;
  let whitelisted = false;

  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab.url) {
      restricted = isRestrictedUrl(tab.url);
      if (!restricted) {
        whitelisted = isWhitelisted(new URL(tab.url).hostname, whitelist);
      }
    }
  } catch (_) {
    restricted = true;
  }

  if (restricted) {
    chrome.action.setBadgeText({ text: '', tabId });
    return;
  }

  const active = scrollbarHidden && !whitelisted;
  chrome.action.setBadgeText({ text: active ? 'ON' : 'OFF', tabId });
  chrome.action.setBadgeBackgroundColor({
    color: active ? BADGE_ACTIVE_COLOR : BADGE_INACTIVE_COLOR,
    tabId,
  });
};

const updateBadgeForTab = async (tabId) => {
  const { scrollbarHidden, whitelist } = await getSyncState();
  await updateBadge(tabId, scrollbarHidden, whitelist);
};

const updateAllTabs = async () => {
  const { scrollbarHidden, whitelist } = await getSyncState();
  await syncLocalCache({ scrollbarHidden, whitelist });

  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => updateBadge(tab.id, scrollbarHidden, whitelist));
  });
};

chrome.tabs.onActivated.addListener(({ tabId }) => updateBadgeForTab(tabId));

chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status === 'loading' || info.status === 'complete' || info.url) {
    updateBadgeForTab(tabId);
  }
});

chrome.storage.onChanged.addListener((_, namespace) => {
  if (namespace === 'sync') updateAllTabs();
});

chrome.runtime.onStartup.addListener(updateAllTabs);
chrome.runtime.onInstalled.addListener(updateAllTabs);

updateAllTabs().catch(() => {});
