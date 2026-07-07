/*
  optimizer.js
  Pure prompt optimization logic. Runs in the content script context.
  Exports a single function: `optimizePrompt(text)` which returns an optimized string.
  The transform is conservative, deterministic, and on-device.
*/

// Normalize whitespace and basic punctuation.
function normalizeWhitespace(text) {
  return text.replace(/[\u00A0\s]+/g, ' ').trim();
}

// Capitalize first letter of the prompt if appropriate.
function capitalizeStart(text) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// Ensure prompt ends with punctuation suitable for instructions.
function ensureEndingPunctuation(text) {
  if (!text) return text;
  const last = text.slice(-1);
  if (['.', '!', '?'].includes(last)) return text;
  // Prefer a period for instructions
  return text + '.';
}

// Heuristic: detect if user already provided role/context
function hasRoleContext(text) {
  const patterns = [/^you are\b/i, /\bas an?\b/i, /^act as\b/i, /role[:\-]/i];
  return patterns.some((p) => p.test(text));
}

// Conservative context prefix when the prompt is ambiguous/underspecified
function maybeAddContext(text) {
  const MIN_LENGTH = 40; // short prompts may need context
  if (hasRoleContext(text)) return text;
  if (text.length < MIN_LENGTH) {
    // Prefix a minimal context sentence but preserve original
    return 'You are an expert assistant. ' + text;
  }
  return text;
}

// Make prompt more specific when vague verbs used.
function makeMoreSpecific(text) {
  // Example: "help me" -> "Provide a step-by-step guide to"
  let t = text;
  t = t.replace(/^help me\b/i, 'Provide a step-by-step guide to');
  t = t.replace(/\bsummarize\b/i, 'Summarize the following and provide a brief takeaway');
  return t;
}

// The main exported function.
function optimizePrompt(input) {
  if (typeof input !== 'string') return '';
  let s = input;
  s = normalizeWhitespace(s);
  s = capitalizeStart(s);
  s = maybeAddContext(s);
  s = makeMoreSpecific(s);
  s = ensureEndingPunctuation(s);
  return s;
}

// Expose in the content script global scope
window.optimizePrompt = optimizePrompt;

// Export for module users (if ever imported)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { optimizePrompt };
}
