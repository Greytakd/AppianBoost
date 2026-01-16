// Feature toggle IDs
const FEATURES = ['darkMode', 'quickCopy', 'enhancedSearch'];

// Load saved settings when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  const settings = await chrome.storage.sync.get(FEATURES);

  FEATURES.forEach(feature => {
    const toggle = document.getElementById(feature);
    if (toggle) {
      toggle.checked = settings[feature] || false;

      // Add change listener
      toggle.addEventListener('change', async (e) => {
        await chrome.storage.sync.set({ [feature]: e.target.checked });

        // Notify content script of change
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'FEATURE_TOGGLE',
            feature: feature,
            enabled: e.target.checked
          });
        }
      });
    }
  });
});
