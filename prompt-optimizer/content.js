/*
  content.js
  Content script responsible for locating the prompt input on supported sites,
  extracting the prompt, calling `optimizePrompt`, and replacing the text while
  dispatching appropriate events so the site recognizes the change.
*/

// Utility: check element visibility
function isVisible(el) {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden';
}

// Use native setter for React-controlled inputs when available
function setNativeValue(element, value) {
  const valueSetter = Object.getOwnPropertyDescriptor(element.__proto__, 'value')?.set;
  if (valueSetter) {
    valueSetter.call(element, value);
  } else {
    element.value = value;
  }
  element.dispatchEvent(new Event('input', { bubbles: true }));
}

// Set contenteditable text and dispatch events
function setContentEditable(el, text) {
  el.focus();
  // Replace textContent (keeps it simple & safe)
  el.textContent = text;
  el.dispatchEvent(new InputEvent('input', { bubbles: true, data: text, inputType: 'insertText' }));
}

// Find candidate inputs using heuristics and per-site hints
function findPromptElement() {
  // 1. Visible textareas
  const textareas = Array.from(document.querySelectorAll('textarea')).filter(isVisible);
  if (textareas.length) return textareas[0];

  // 2. Visible input[type=text]
  const inputs = Array.from(document.querySelectorAll('input[type="text"]')).filter(isVisible);
  if (inputs.length) return inputs[0];

  // 3. contenteditable elements
  const edits = Array.from(document.querySelectorAll('[contenteditable="true"][role="textbox"], [contenteditable="true"]')).filter(isVisible);
  if (edits.length) return edits[0];

  // 4. site-specific heuristics: chat.openai
  const openai = document.querySelector('textarea[placeholder*="Send a message"], textarea[aria-label*="Send"]');
  if (openai && isVisible(openai)) return openai;

  // 5. gemini: contenteditable focus area
  const gem = Array.from(document.querySelectorAll('div[contenteditable]')).filter(isVisible)[0];
  if (gem) return gem;

  return null;
}

// Copy to clipboard helper for fallback
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    console.warn('Clipboard write failed', e);
    return false;
  }
}

// Main action: extract, optimize, replace, and notify
async function optimizeAndReplace() {
  try {
    const el = findPromptElement();
    if (!el) {
      return { status: 'error', message: 'Input element not found' };
    }

    // Extract raw text
    let raw = '';
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') raw = el.value || el.textContent || '';
    else raw = el.textContent || '';

    if (!raw || raw.trim().length === 0) {
      return { status: 'error', message: 'No prompt text found' };
    }

    // Call optimizer (provided in optimizer.js)
    const optimized = (typeof window.optimizePrompt === 'function') ? window.optimizePrompt(raw) : raw;

    // Replace using React-friendly setter or contenteditable flow
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      setNativeValue(el, optimized);
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      setContentEditable(el, optimized);
    }

    // Some sites require an extra InputEvent sequence — send one more for compatibility
    el.dispatchEvent(new InputEvent('input', { bubbles: true }));

    return { status: 'ok' };
  } catch (err) {
    console.error('Optimization failed', err);
    // Fallback: copy optimized prompt to clipboard so user can paste it manually
    try {
      const fallback = typeof window.optimizePrompt === 'function' ? window.optimizePrompt('') : '';
      await copyToClipboard(fallback);
    } catch (e) {
      // ignore
    }
    return { status: 'error', message: err.message || String(err) };
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'OPTIMIZE_REQUEST') {
    optimizeAndReplace().then(sendResponse).catch((err) => sendResponse({ status: 'error', message: err && err.message }));
    // Return true to indicate we'll call sendResponse asynchronously
    return true;
  }
});

// Also support direct message from popup via chrome.tabs.sendMessage callback style
// No additional bootstrapping required; content script is always ready once injected.
