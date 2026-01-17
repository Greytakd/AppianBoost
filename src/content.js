// AppianBoost Content Script
// Runs on Appian pages to enhance the UI

(function() {
  'use strict';

  console.log('AppianBoost: Content script loaded');

  // Feature state
  let features = {
    darkMode: false,
    quickCopy: false,
    enhancedSearch: false,
    ideMode: false,
    autoSave: false
  };

  // Dark mode color mappings (light -> dark)
  const darkModeColors = {
    // Container backgrounds
    '--appian-container-background-color': '#1e1e1e',
    '--appian-modal-background-color': '#252526',
    '--appian-pop-up-menu-color': '#2d2d30',
    '--appian-background-color': '#3c3c3c',

    // Input backgrounds
    '--appian-input-background-color': '#3c3c3c',
    '--appian-input-background-color-faded': 'rgba(60, 60, 60, 0.87)',
    '--appian-disabled-background-color': '#2d2d30',
    '--appian-disabled-select-background-color': '#3c3c3c',
    '--appian-progress-background-color': '#3c3c3c',

    // Header colors
    '--appian-header-color': '#1e1e1e',
    '--appian-header-hover-color': '#2d2d30',
    '--appian-header-active-tab-color': '#252526',
    '--appian-header-tab-text-color': '#b0b0b0',
    '--appian-header-active-tab-text-color': '#e0e0e0',
    '--appian-header-active-mercury-tab-text-color': '#e0e0e0',

    // Sidebar colors
    '--appian-sidebar-collapse-button-and-divider-color': '#444',
    '--appian-sidebar-scroll-thumb-color': '#555',
    '--appian-sidebar-scroll-thumb-color-hover': '#666',

    // Text colors
    '--appian-text-color': '#e0e0e0',
    '--appian-disabled-text-color': '#888',
    '--appian-placeholder-text-color': '#888',
    '--appian-secondary-text-color': '#aaa',
    '--appian-secondary-text-color-on-accent': '#e0e0e0',
    '--appian-subtle-text-color': '#999',

    // Border colors
    '--appian-input-border-color': '#555',
    '--appian-input-border-color-hc': '#666',
    '--appian-choice-border-color': '#666',
    '--appian-container-border-color': '#444',
    '--appian-divider-color-subtle-in-dark-bg': '#555',
    '--appian-container-border-color-subtle': '#333',
    '--appian-container-border-color-subtle-in-dark-bg': '#555',

    // Accent colors (adjusted for dark mode)
    '--appian-accent-color-faded': 'rgba(100, 149, 237, 0.15)',
    '--appian-accent-color-inverted-faded': 'rgba(100, 149, 237, 0.2)',
    '--appian-inverted-accent-color': '#e0e0e0',
    '--appian-disabled-inverted-accent-color': '#444',
    '--appian-icon-widget-color-faded': '#888'
  };

  // Store original styles for restoration
  const originalStyles = new WeakMap();
  let darkModeObserver = null;

  // Initialize features from storage
  chrome.storage.sync.get(Object.keys(features), (settings) => {
    features = { ...features, ...settings };
    applyFeatures();
  });

  // Listen for feature toggle messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'FEATURE_TOGGLE') {
      features[message.feature] = message.enabled;
      applyFeatures();
    }
  });

  // Apply all enabled features
  function applyFeatures() {
    if (features.darkMode) {
      enableDarkMode();
    } else {
      disableDarkMode();
    }

    if (features.quickCopy) {
      enableQuickCopy();
    } else {
      disableQuickCopy();
    }

    if (features.enhancedSearch) {
      enableEnhancedSearch();
    } else {
      disableEnhancedSearch();
    }

    if (features.ideMode) {
      enableIdeMode();
    } else {
      disableIdeMode();
    }

    if (features.autoSave) {
      enableAutoSave();
    } else {
      disableAutoSave();
    }
  }

  // ==========================================
  // Dark Mode Feature
  // ==========================================
  function enableDarkMode() {
    console.log('AppianBoost: Enabling dark mode');

    // Add class to body for CSS-based styles
    document.body.classList.add('appianboost-dark');

    // Inject root-level CSS variable overrides
    injectDarkModeStyles();

    // Apply dark mode to existing elements
    applyDarkModeToElement(document.body);

    // Watch for new elements being added
    darkModeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            applyDarkModeToElement(node);
          }
        });
      });
    });

    darkModeObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function injectDarkModeStyles() {
    // Remove existing injected styles if any
    const existing = document.getElementById('appianboost-dark-vars');
    if (existing) existing.remove();

    // Build CSS variable overrides
    const cssVars = Object.entries(darkModeColors)
      .map(([varName, value]) => `${varName}: ${value} !important;`)
      .join('\n    ');

    const styleEl = document.createElement('style');
    styleEl.id = 'appianboost-dark-vars';
    styleEl.textContent = `
      :root, body, .appian-context-root {
        ${cssVars}
      }

      /* Force dark backgrounds on key elements */
      .appianboost-dark [class*="ApplicationHeaderLayout---header"],
      .appianboost-dark [class*="ApplicationHeaderLayout---designer"] {
        background: #1e1e1e !important;
        background-image: none !important;
      }

      /* Top banner gradient - dark blue to black */
      .appianboost-dark nav.ApplicationHeaderLayout---header.ApplicationHeaderLayout---designer {
        background: linear-gradient(90deg, #0a1628 0%, #1a2744 40%, #0a1628 75%) !important;
        border-bottom: 1px solid #333 !important;
      }

      /* Override any inline white/light backgrounds */
      .appianboost-dark [style*="background-color: rgb(255, 255, 255)"],
      .appianboost-dark [style*="background-color: rgb(244, 244, 244)"],
      .appianboost-dark [style*="background-color: rgb(240, 240, 240)"],
      .appianboost-dark [style*="background-color:#fff"],
      .appianboost-dark [style*="background-color: white"] {
        background-color: #1e1e1e !important;
      }

      /* Force text colors */
      .appianboost-dark [class*="ParagraphText---"],
      .appianboost-dark [class*="TitleText---"] {
        color: #e0e0e0 !important;
      }
    `;
    document.head.appendChild(styleEl);
  }

  function removeDarkModeStyles() {
    const styleEl = document.getElementById('appianboost-dark-vars');
    if (styleEl) styleEl.remove();
  }

  function disableDarkMode() {
    console.log('AppianBoost: Disabling dark mode');

    // Remove class from body
    document.body.classList.remove('appianboost-dark');

    // Remove injected styles
    removeDarkModeStyles();

    // Stop watching for changes
    if (darkModeObserver) {
      darkModeObserver.disconnect();
      darkModeObserver = null;
    }

    // Restore original styles
    restoreOriginalStyles(document.body);
  }

  // Light colors to replace with dark equivalents
  const lightColorReplacements = [
    // Background colors (light grays and whites)
    { pattern: /background-color:\s*rgb\(244,\s*244,\s*244\)/gi, replacement: 'background-color: #1e1e1e' },
    { pattern: /background-color:\s*rgb\(255,\s*255,\s*255\)/gi, replacement: 'background-color: #1e1e1e' },
    { pattern: /background-color:\s*rgb\(240,\s*240,\s*240\)/gi, replacement: 'background-color: #1e1e1e' },
    { pattern: /background-color:\s*rgb\(250,\s*250,\s*250\)/gi, replacement: 'background-color: #252526' },
    { pattern: /background-color:\s*rgb\(248,\s*248,\s*248\)/gi, replacement: 'background-color: #252526' },
    { pattern: /background-color:\s*#f[0-9a-f]{5}/gi, replacement: 'background-color: #1e1e1e' },
    { pattern: /background-color:\s*#fff(?![0-9a-f])/gi, replacement: 'background-color: #1e1e1e' },
    { pattern: /background-color:\s*white/gi, replacement: 'background-color: #1e1e1e' },

    // Border colors
    { pattern: /border-color:\s*rgb\(244,\s*244,\s*244\)/gi, replacement: 'border-color: #444' },
    { pattern: /border-color:\s*rgb\(255,\s*255,\s*255\)/gi, replacement: 'border-color: #444' },
    { pattern: /border-color:\s*rgb\(240,\s*240,\s*240\)/gi, replacement: 'border-color: #444' },
    { pattern: /border-color:\s*rgb\(230,\s*230,\s*230\)/gi, replacement: 'border-color: #444' },
    { pattern: /border-color:\s*rgb\(220,\s*220,\s*220\)/gi, replacement: 'border-color: #555' },
    { pattern: /border-color:\s*#e[0-9a-f]{5}/gi, replacement: 'border-color: #444' },
    { pattern: /border-color:\s*#d[0-9a-f]{5}/gi, replacement: 'border-color: #555' },

    // Text colors (dark text to light)
    { pattern: /(?<!background-)color:\s*rgb\(51,\s*51,\s*51\)/gi, replacement: 'color: #e0e0e0' },
    { pattern: /(?<!background-)color:\s*rgb\(0,\s*0,\s*0\)/gi, replacement: 'color: #e0e0e0' },
    { pattern: /(?<!background-)color:\s*rgb\(33,\s*33,\s*33\)/gi, replacement: 'color: #e0e0e0' },
    { pattern: /(?<!background-)color:\s*rgb\(66,\s*66,\s*66\)/gi, replacement: 'color: #d0d0d0' },
    { pattern: /(?<!background-)color:\s*#333(?![0-9a-f])/gi, replacement: 'color: #e0e0e0' },
    { pattern: /(?<!background-)color:\s*#000(?![0-9a-f])/gi, replacement: 'color: #e0e0e0' },

    // Linear gradients with white/light colors
    { pattern: /linear-gradient\([^)]*rgba?\(255,\s*255,\s*255[^)]*\)[^)]*\)/gi, replacement: 'linear-gradient(180deg, #1e1e1e 0%, #252526 100%)' },
  ];

  function applyDarkModeToElement(element) {
    // Check if element has inline style
    if (element.style && element.getAttribute('style')) {
      const styleAttr = element.getAttribute('style');

      // Store original style if not already stored
      if (!originalStyles.has(element)) {
        originalStyles.set(element, styleAttr);
      }

      let newStyle = styleAttr;
      let modified = false;

      // Replace CSS variable values
      if (styleAttr.includes('--appian-')) {
        for (const [varName, darkValue] of Object.entries(darkModeColors)) {
          const regex = new RegExp(`(${varName}:\\s*)([^;!]+)(\\s*!important)?`, 'g');
          const before = newStyle;
          newStyle = newStyle.replace(regex, `$1${darkValue}$3`);
          if (before !== newStyle) modified = true;
        }
      }

      // Replace direct color values
      for (const { pattern, replacement } of lightColorReplacements) {
        const before = newStyle;
        newStyle = newStyle.replace(pattern, replacement);
        if (before !== newStyle) modified = true;
      }

      if (modified) {
        element.setAttribute('style', newStyle);
      }
    }

    // Process children
    if (element.children) {
      Array.from(element.children).forEach(child => {
        applyDarkModeToElement(child);
      });
    }
  }

  function restoreOriginalStyles(element) {
    // Restore original style if we have it
    if (originalStyles.has(element)) {
      element.setAttribute('style', originalStyles.get(element));
      originalStyles.delete(element);
    }

    // Process children
    if (element.children) {
      Array.from(element.children).forEach(child => {
        restoreOriginalStyles(child);
      });
    }
  }

  // ==========================================
  // Quick Copy Feature
  // ==========================================
  let quickCopyEnabled = false;

  function enableQuickCopy() {
    if (quickCopyEnabled) return;
    quickCopyEnabled = true;

    document.addEventListener('click', handleQuickCopy);
  }

  function disableQuickCopy() {
    quickCopyEnabled = false;
    document.removeEventListener('click', handleQuickCopy);
  }

  function handleQuickCopy(e) {
    // Check if clicking on a UUID or expression-like text
    const target = e.target;
    const text = target.textContent?.trim();

    // UUID pattern
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (text && uuidPattern.test(text) && e.altKey) {
      e.preventDefault();
      navigator.clipboard.writeText(text).then(() => {
        showCopyNotification('UUID copied!');
      });
    }
  }

  function showCopyNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'appianboost-notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  // ==========================================
  // Enhanced Search Feature
  // ==========================================
  function enableEnhancedSearch() {
    console.log('AppianBoost: Enhanced search enabled');
  }

  function disableEnhancedSearch() {
    console.log('AppianBoost: Enhanced search disabled');
  }

  // ==========================================
  // IDE Mode - Hide Test Panel for Full-Width Editor
  // ==========================================
  let ideModeObserver = null;
  let originalPaneWidth = null;
  let originalContentsWidth = null;

  function enableIdeMode() {
    console.log('AppianBoost: Enabling IDE Mode');

    // Store original widths before changing
    const firstPane = document.querySelector('[id$="-split-pane-layout-outer_firstPane"]');
    if (firstPane && !originalPaneWidth) {
      originalPaneWidth = firstPane.style.width || firstPane.offsetWidth + 'px';
      const contents = firstPane.querySelector(':scope > .SplitPaneLayout---contents');
      if (contents) {
        originalContentsWidth = contents.style.width || contents.offsetWidth + 'px';
      }
    }

    // Apply immediately
    applyIdeMode();

    // Watch for the panel to appear (it loads dynamically)
    ideModeObserver = new MutationObserver(() => {
      applyIdeMode();
    });
    ideModeObserver.observe(document.body, { childList: true, subtree: true });
  }

  function disableIdeMode() {
    console.log('AppianBoost: Disabling IDE Mode');

    // Stop watching
    if (ideModeObserver) {
      ideModeObserver.disconnect();
      ideModeObserver = null;
    }

    // Restore panel and separator
    const panel = document.querySelector('[id$="-split-pane-layout-outer_secondPane"]');
    const separator = panel?.previousElementSibling;
    const firstPane = document.querySelector('[id$="-split-pane-layout-outer_firstPane"]');

    if (panel) {
      panel.style.removeProperty('display');
    }
    if (separator?.classList.contains('SplitPaneLayout---separator')) {
      separator.style.removeProperty('display');
    }
    // Restore original width
    if (firstPane) {
      if (originalPaneWidth) {
        firstPane.style.setProperty('width', originalPaneWidth, 'important');
      }
      const contents = firstPane.querySelector(':scope > .SplitPaneLayout---contents');
      if (contents && originalContentsWidth) {
        contents.style.setProperty('width', originalContentsWidth, 'important');
      }
    }

    // Clear stored widths so they're recaptured next time
    originalPaneWidth = null;
    originalContentsWidth = null;
  }

  function applyIdeMode() {
    const panel = document.querySelector('[id$="-split-pane-layout-outer_secondPane"]');
    const separator = panel?.previousElementSibling;
    const firstPane = document.querySelector('[id$="-split-pane-layout-outer_firstPane"]');

    // Store original width if not already stored
    if (firstPane && !originalPaneWidth) {
      originalPaneWidth = firstPane.style.width || firstPane.offsetWidth + 'px';
      const contents = firstPane.querySelector(':scope > .SplitPaneLayout---contents');
      if (contents) {
        originalContentsWidth = contents.style.width || contents.offsetWidth + 'px';
      }
    }

    if (panel && panel.style.display !== 'none') {
      panel.style.setProperty('display', 'none', 'important');
    }
    if (separator?.classList.contains('SplitPaneLayout---separator') && separator.style.display !== 'none') {
      separator.style.setProperty('display', 'none', 'important');
    }
    if (firstPane) {
      firstPane.style.setProperty('width', '100%', 'important');
      const contents = firstPane.querySelector(':scope > .SplitPaneLayout---contents');
      if (contents) {
        contents.style.setProperty('width', '100%', 'important');
      }
    }
  }

  // ==========================================
  // Auto-Save Feature
  // ==========================================
  let autoSaveInterval = null;
  const AUTO_SAVE_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

  function enableAutoSave() {
    console.log('AppianBoost: Enabling Auto-Save');

    // Save immediately on enable
    saveExpressionBackup();

    // Set up interval
    if (!autoSaveInterval) {
      autoSaveInterval = setInterval(saveExpressionBackup, AUTO_SAVE_INTERVAL_MS);
    }
  }

  function disableAutoSave() {
    console.log('AppianBoost: Disabling Auto-Save');

    if (autoSaveInterval) {
      clearInterval(autoSaveInterval);
      autoSaveInterval = null;
    }
  }

  function getRuleName() {
    // Try to find the rule name in the page header
    const header = document.querySelector('h1.TitleText---page_header');
    if (header) {
      return header.textContent.trim();
    }
    // Fallback: try to get from URL or return unknown
    const urlMatch = window.location.pathname.match(/\/rules\/([^\/]+)/);
    if (urlMatch) {
      return urlMatch[1];
    }
    return 'Unknown Rule';
  }

  function getEditorCode() {
    // Find the CodeMirror editor
    const codeMirror = document.querySelector('.CodeMirror');
    if (!codeMirror) return null;

    // Try to get CodeMirror instance and use its API
    if (codeMirror.CodeMirror) {
      return codeMirror.CodeMirror.getValue();
    }

    // Fallback: extract text from the rendered lines
    const lines = codeMirror.querySelectorAll('.CodeMirror-line');
    if (lines.length === 0) return null;

    const code = Array.from(lines).map(line => {
      // Get text content, preserving structure
      return line.textContent;
    }).join('\n');

    return code;
  }

  async function saveExpressionBackup() {
    const ruleName = getRuleName();
    const code = getEditorCode();

    if (!code || code.trim() === '') {
      console.log('AppianBoost: No code to save');
      return;
    }

    // Create a unique key based on rule name
    const key = ruleName.replace(/[^a-zA-Z0-9_-]/g, '_');

    // Get existing backups
    const { expressionBackups = {} } = await chrome.storage.local.get('expressionBackups');

    // Save the backup (overwrite if same rule name exists)
    expressionBackups[key] = {
      ruleName: ruleName,
      code: code,
      timestamp: Date.now(),
      url: window.location.href
    };

    // Keep only the last 20 backups
    const entries = Object.entries(expressionBackups);
    if (entries.length > 20) {
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      const toKeep = entries.slice(0, 20);
      const newBackups = Object.fromEntries(toKeep);
      await chrome.storage.local.set({ expressionBackups: newBackups });
    } else {
      await chrome.storage.local.set({ expressionBackups });
    }

    console.log(`AppianBoost: Auto-saved "${ruleName}"`);
  }

})();
