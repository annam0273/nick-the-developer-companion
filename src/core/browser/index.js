/**
 * Browser API Compatibility Layer
 * Isolates extension-specific APIs so the UI doesn't need to know if it's running on Chrome, Edge, or Firefox.
 */

// We can dynamically select the adapter or just use a common one if polyfilled.
// For now, we will use the chrome.* API as the base, which works on Edge.
// If Firefox requires browser.*, we could use the webextension-polyfill.
// Since we want to support Chrome/Edge/Firefox without forcing external dependencies immediately, 
// we'll implement a simple abstraction.

const _globalBrowser = typeof browser !== 'undefined' ? browser : (typeof chrome !== 'undefined' ? chrome : null);

export const browserAPI = {
  storage: {
    local: {
      get: (keys) => {
        return new Promise((resolve, reject) => {
          if (!_globalBrowser) { resolve({}); return; }
          _globalBrowser.storage.local.get(keys, (result) => {
            if (_globalBrowser.runtime.lastError) reject(_globalBrowser.runtime.lastError);
            else resolve(result || {});
          });
        });
      },
      set: (items) => {
        return new Promise((resolve, reject) => {
          if (!_globalBrowser) { resolve(); return; }
          _globalBrowser.storage.local.set(items, () => {
            if (_globalBrowser.runtime.lastError) reject(_globalBrowser.runtime.lastError);
            else resolve();
          });
        });
      },
      remove: (keys) => {
        return new Promise((resolve, reject) => {
          if (!_globalBrowser) { resolve(); return; }
          _globalBrowser.storage.local.remove(keys, () => {
            if (_globalBrowser.runtime.lastError) reject(_globalBrowser.runtime.lastError);
            else resolve();
          });
        });
      },
      // Keep support for onChange listeners
      onChanged: {
        addListener: (callback) => {
          if (_globalBrowser && _globalBrowser.storage) {
            _globalBrowser.storage.onChanged.addListener(callback);
          }
        },
        removeListener: (callback) => {
          if (_globalBrowser && _globalBrowser.storage) {
            _globalBrowser.storage.onChanged.removeListener(callback);
          }
        }
      }
    }
  },
  runtime: {
    sendMessage: (message) => {
      return new Promise((resolve, reject) => {
        if (!_globalBrowser) { resolve(null); return; }
        _globalBrowser.runtime.sendMessage(message, (response) => {
          if (_globalBrowser.runtime.lastError) reject(_globalBrowser.runtime.lastError);
          else resolve(response);
        });
      });
    }
  }
};
