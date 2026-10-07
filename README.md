# 🦊 Nick - The Developer Companion

A beautifully animated, fully autonomous 2D SVG companion built as a Chrome Extension (Manifest V3) specifically for web developers. Nick hangs out in the corner of your screen, peeks out while you work, falls asleep when you're inactive, and comes packed with powerful offline web development tools.

## ✨ Features

- 🦊 **Autonomous Animation System**: Nick wanders, peeks, and sleeps autonomously. Built using a highly optimized CSS transition state-machine that safely handles browser background-tab throttling via `requestAnimationFrame` chaining.
- 🎤 **Push-To-Talk Voice**: Hold `Alt + V` to dictate text directly to Nick using the native Web Speech API.
- 🗜️ **Offline AVIF Compressor**: Compress images to `.avif` directly in your browser. Powered completely offline by WebAssembly (`@jsquash/avif`) using an offscreen document to prevent UI freezing.
- 🔍 **The Forager**: Automatically sniffs out and extracts color palettes, front-end frameworks (React, Vue, Next.js, etc.), and cleanly sanitizes/extracts inline SVGs from any webpage you visit.
- 📸 **Sketcher**: Take full-page screenshots of your active tab and annotate/sketch directly over them.
- 📝 **Scribe**: A built-in scratchpad for quick note-taking that syncs locally.
- ⌨️ **Quick Call**: Press `Alt + B` or `Alt + C` at any time to instantly call Nick back to his den in the bottom corner of your screen.

## 🛠️ Technology Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Extension Architecture**: Chrome Manifest V3 (MV3)
- **Styling**: Vanilla CSS (Scoped to prevent conflicts with host pages)
- **WebAssembly**: Emscripten-compiled C++ codecs for local image compression.

## 🚀 Installation & Setup

Because this is a developer prototype, it is not listed on the Chrome Web Store. You will need to load it manually as an "Unpacked Extension".

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/mochi-browser-companion.git
cd mochi-browser-companion
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build the Extension
This project uses Vite to bundle the React application into vanilla JavaScript that Chrome can inject into webpages.
```bash
npm run build
```
*This will generate a `dist` folder containing the compiled extension.*

### 4. Load into Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** using the toggle switch in the top right corner.
3. Click the **Load unpacked** button in the top left.
4. Select the `dist` folder that was just generated in your project directory.
5. **Done!** Open any webpage (like google.com) and Nick should appear in the bottom right corner.

## 🔄 Development & Reloading
If you make changes to the source code:
1. Run `npm run build` again.
2. Go back to `chrome://extensions/` and click the circular **Reload** arrow icon on the Nick extension card.
3. Refresh the webpage you are testing on to inject the newly compiled content script.

## 🔒 Security & Privacy
This extension was built with strict privacy constraints:
- **100% Offline**: There are no remote API calls, telemetry, or external server dependencies. Image compression runs locally via WASM. 
- **Sanitized Extraction**: The Forager tool explicitly sanitizes all scraped SVG DOM nodes (stripping `<script>` and `on*` attributes) to prevent reflection XSS vulnerabilities.
- **Microphone Access**: The voice feature uses the browser's native `SpeechRecognition` API.

## 🤝 Contributing
Feel free to open issues or submit Pull Requests if you'd like to add new tools to Nick's arsenal or improve his animation logic!
