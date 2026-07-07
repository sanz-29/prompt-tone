// Popup UI logic: single-button one-click flow.
const optimizeBtn = document.getElementById('optimizeBtn');
const statusEl = document.getElementById('status');

function setStatus(msg, timeout = 3000) {
  statusEl.textContent = msg;
  if (timeout) setTimeout(() => { statusEl.textContent = ''; }, timeout);
}

// Send a message to the active tab's content script to optimize the prompt.
optimizeBtn.addEventListener('click', async () => {
  setStatus('Optimizing...');
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs || tabs.length === 0) throw new Error('No active tab');
    const tabId = tabs[0].id;
    // Tell content script to optimize the prompt.
    chrome.tabs.sendMessage(tabId, { type: 'OPTIMIZE_REQUEST' }, (response) => {
      if (chrome.runtime.lastError) {
        // Content script not present or other error
        setStatus('Failed: ' + chrome.runtime.lastError.message);
        return;
      }
      if (!response) {
        setStatus('No response from page');
        return;
      }
      if (response.status === 'ok') setStatus('Prompt optimized');
      else setStatus('Error: ' + (response.message || 'unknown'));
    });
  } catch (err) {
    setStatus('Error: ' + (err.message || err));
  }
});
