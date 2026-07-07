// Background service worker: minimal routing and logging.
// For this single-feature extension we keep the background worker lightweight.
chrome.runtime.onInstalled.addListener(() => {
  console.log('Prompt Optimizer installed');
});

// Keep an explicit message listener so content/background can coordinate if needed.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'PING') {
    sendResponse({ status: 'pong' });
  }
  // return true if we will respond asynchronously
});
