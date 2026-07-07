# Prompt Optimizer

One-click Firefox extension to optimize prompts on ChatGPT, Gemini, and Claude.

Testing locally:
1. Open `about:debugging#/runtime/this-firefox` in Firefox.
2. Click "Load Temporary Add-on" and select the `manifest.json` file inside the `prompt-optimizer` folder.
3. Open one of the supported sites, type a prompt, open the extension popup, and click "Optimize Prompt".

Packaging:
1. Zip the `prompt-optimizer` folder contents (manifest at root) and upload to https://addons.mozilla.org/ for review.
