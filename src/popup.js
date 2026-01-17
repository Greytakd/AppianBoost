// Feature toggle IDs
const FEATURES = ['darkMode', 'quickCopy', 'enhancedSearch', 'ideMode', 'autoSave'];

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

  // Load and display backups
  loadBackups();
});

// Load backups from storage and display them
async function loadBackups() {
  const { expressionBackups = {} } = await chrome.storage.local.get('expressionBackups');
  const container = document.getElementById('backups-container');

  const backupEntries = Object.entries(expressionBackups).sort((a, b) => b[1].timestamp - a[1].timestamp);

  if (backupEntries.length === 0) {
    container.innerHTML = '<div class="no-backups">No backups yet</div>';
    return;
  }

  container.innerHTML = backupEntries.map(([key, backup]) => {
    const date = new Date(backup.timestamp);
    const timeStr = date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    return `
      <div class="backup-item" data-key="${key}">
        <div>
          <div class="backup-name" title="${backup.ruleName}">${backup.ruleName}</div>
          <div class="backup-time">${timeStr}</div>
        </div>
        <div class="backup-actions">
          <button class="backup-btn copy-btn" data-key="${key}">Copy</button>
          <button class="backup-btn delete" data-key="${key}">×</button>
        </div>
      </div>
    `;
  }).join('');

  // Add event listeners
  container.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const key = e.target.dataset.key;
      const { expressionBackups = {} } = await chrome.storage.local.get('expressionBackups');
      const backup = expressionBackups[key];
      if (backup) {
        await navigator.clipboard.writeText(backup.code);
        e.target.textContent = '✓';
        e.target.classList.add('copy-success');
        setTimeout(() => {
          e.target.textContent = 'Copy';
          e.target.classList.remove('copy-success');
        }, 1500);
      }
    });
  });

  container.querySelectorAll('.delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const key = e.target.dataset.key;
      const { expressionBackups = {} } = await chrome.storage.local.get('expressionBackups');
      delete expressionBackups[key];
      await chrome.storage.local.set({ expressionBackups });
      loadBackups();
    });
  });
}
