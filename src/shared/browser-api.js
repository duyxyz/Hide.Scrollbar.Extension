(() => {
  const getActiveTab = async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0] || null;
  };

  const openPanelForCurrentTab = async () => {
    if (typeof browser !== 'undefined' && browser.sidebarAction && browser.sidebarAction.open) {
      await browser.sidebarAction.open();
      return true;
    }

    if (chrome.sidebarAction && chrome.sidebarAction.open) {
      await chrome.sidebarAction.open();
      return true;
    }

    if (chrome.sidePanel && chrome.sidePanel.open) {
      const tab = await getActiveTab();
      if (!tab) return false;
      await chrome.sidePanel.open({ tabId: tab.id });
      return true;
    }

    return false;
  };

  globalThis.ScrollHideBrowserApi = {
    getActiveTab,
    openPanelForCurrentTab,
  };
})();
