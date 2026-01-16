// AppianBoost Content Script
// Runs on Appian pages to enhance the UI

(function() {
  'use strict';

  console.log('AppianBoost: Content script loaded');

  // Feature state
  let features = {
    darkMode: false,
    quickCopy: false,
    enhancedSearch: false
  };

  // Dark mode color mappings (light -> dark)
  const darkModeColors = {
    '--appian-container-background-color': '#1e1e1e',
    '--appian-modal-background-color': '#252526',
    '--appian-accent-color-faded': 'rgba(100, 149, 237, 0.15)',
    '--appian-pop-up-menu-color': '#2d2d30',
    '--appian-input-background-color': '#3c3c3c',
    '--appian-input-background-color-faded': 'rgba(60, 60, 60, 0.87)',
    '--appian-disabled-background-color': '#2d2d30',
    '--appian-disabled-select-background-color': '#3c3c3c',
    '--appian-background-color': '#3c3c3c',
    '--appian-progress-background-color': '#3c3c3c',
    '--appian-text-color': '#e0e0e0',
    '--appian-disabled-text-color': '#888',
    '--appian-placeholder-text-color': '#888',
    '--appian-secondary-text-color': '#aaa',
    '--appian-subtle-text-color': '#999',
    '--appian-input-border-color': '#555',
    '--appian-input-border-color-hc': '#666',
    '--appian-choice-border-color': '#666',
    '--appian-container-border-color': '#444',
    '--appian-divider-color-subtle-in-dark-bg': '#555',
    '--appian-container-border-color-subtle': '#333',
    '--appian-container-border-color-subtle-in-dark-bg': '#555',
    '--appian-disabled-inverted-accent-color': '#444'
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
  }

  // ==========================================
  // Dark Mode Feature
  // ==========================================
  function enableDarkMode() {
    console.log('AppianBoost: Enabling dark mode');

    // Add class to body for CSS-based styles
    document.body.classList.add('appianboost-dark');

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

  function disableDarkMode() {
    console.log('AppianBoost: Disabling dark mode');

    // Remove class from body
    document.body.classList.remove('appianboost-dark');

    // Stop watching for changes
    if (darkModeObserver) {
      darkModeObserver.disconnect();
      darkModeObserver = null;
    }

    // Restore original styles
    restoreOriginalStyles(document.body);
  }

  function applyDarkModeToElement(element) {
    // Check if element has inline style with appian variables
    if (element.style && element.getAttribute('style')) {
      const styleAttr = element.getAttribute('style');

      if (styleAttr.includes('--appian-')) {
        // Store original style if not already stored
        if (!originalStyles.has(element)) {
          originalStyles.set(element, styleAttr);
        }

        // Replace color values
        let newStyle = styleAttr;
        for (const [varName, darkValue] of Object.entries(darkModeColors)) {
          // Match the variable and its value
          const regex = new RegExp(`(${varName}:\\s*)([^;!]+)(\\s*!important)?`, 'g');
          newStyle = newStyle.replace(regex, `$1${darkValue}$3`);
        }

        // Also handle direct background-color on elements
        if (styleAttr.includes('background-color: rgb(244, 244, 244)') ||
            styleAttr.includes('background-color: rgb(255, 255, 255)') ||
            styleAttr.includes('background-color:#F4F4F4') ||
            styleAttr.includes('background-color:#fff')) {
          newStyle = newStyle.replace(/background-color:\s*(rgb\(244,\s*244,\s*244\)|rgb\(255,\s*255,\s*255\)|#F4F4F4|#fff)(\s*!important)?/gi, 'background-color: #1e1e1e$2');
        }

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

})();
