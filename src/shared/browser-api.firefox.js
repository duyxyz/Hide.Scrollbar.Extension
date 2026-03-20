(() => {
  const getActiveTab = async () => {
    // Use browser namespace for Firefox where possible
    const tabs = await (browser || chrome).tabs.query({ active: true, currentWindow: true });
    return tabs[0] || null;
  };

  const openPanelForCurrentTab = async () => {
    if (typeof browser !== 'undefined' && browser.sidebarAction && browser.sidebarAction.open) {
      await browser.sidebarAction.open();
      return true;
    }
    return false;
  };

  globalThis.ScrollHideBrowserApi = {
    getActiveTab,
    openPanelForCurrentTab,
  };
})();
