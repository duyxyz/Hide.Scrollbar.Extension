(() => {
  const getActiveTab = async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0] || null;
  };

  const openPanelForCurrentTab = async () => {
    const tab = await getActiveTab();
    if (!tab) return false;

    if (chrome.sidePanel && chrome.sidePanel.open) {
      await chrome.sidePanel.open({ tabId: tab.id });
      return true;
    }

    if (typeof browser !== 'undefined' && browser.sidebarAction && browser.sidebarAction.open) {
      await browser.sidebarAction.open();
      return true;
    }

    if (chrome.sidebarAction && chrome.sidebarAction.open) {
      await chrome.sidebarAction.open();
      return true;
    }

    return false;
  };

  globalThis.ScrollHideBrowserApi = {
    getActiveTab,
    openPanelForCurrentTab,
  };
})();
