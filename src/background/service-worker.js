

chrome.runtime.onInstalled.addListener(() => {
  console.log('Mochi Developer Companion extension installed!');
  
  chrome.contextMenus.create({
    id: 'fox-root',
    title: 'Fox',
    contexts: ['page', 'selection', 'link']
  });

});

async function setupOffscreenDocument(path) {
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });

  if (existingContexts.length > 0) {
    return;
  }

  await chrome.offscreen.createDocument({
    url: path,
    reasons: ['WORKERS', 'USER_MEDIA'],
    justification: 'Encoding AVIF images and Speech Recognition'
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ENCODE_AVIF') {
    (async () => {
      try {
        await setupOffscreenDocument('src/background/offscreen.html');
        const response = await chrome.runtime.sendMessage({
          type: 'OFFSCREEN_ENCODE_AVIF',
          payload: message.payload
        });
        sendResponse(response);
      } catch (err) {
        console.error('Failed to encode via offscreen doc', err);
        sendResponse({ error: err.toString() });
      }
    })();
    return true; // Indicates we will send response asynchronously
  }

  if (message.type === 'PING_OFFSCREEN') {
    setupOffscreenDocument('src/background/offscreen.html')
      .then(() => sendResponse({ status: 'ok' }))
      .catch((err) => sendResponse({ error: err.toString() }));
    return true;
  }

  if (message.type === 'CAPTURE_SCREENSHOT') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ dataUrl });
      }
    });
    return true;
  }


});
