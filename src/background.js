// AppianBoost Background Service Worker

// Initialize default settings on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.sync.set({
      darkMode: false,
      quickCopy: true,
      enhancedSearch: false
    });
    console.log('AppianBoost: Installed with default settings');
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SETTINGS') {
    chrome.storage.sync.get(null, (settings) => {
      sendResponse(settings);
    });
    return true; // Keep channel open for async response
  }
});
