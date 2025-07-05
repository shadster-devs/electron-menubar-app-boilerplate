# Setup Instructions

## Quick Start

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run in Development Mode:**
   ```bash
   npm run dev
   ```

3. **Build for Production:**
   ```bash
   npm run build
   npm start
   ```

## What's Included

Your Electron menubar app includes:

- ✅ **Menubar Integration** - App runs in system menubar using the `menubar` library
- ✅ **React + TypeScript** - Modern React development with full TypeScript support
- ✅ **Modular Architecture** - Well-organized code structure
- ✅ **Global Shortcuts** - `Cmd+Shift+Space` to toggle window, `Cmd+Q` to quit
- ✅ **Settings Management** - Persistent settings with UI
- ✅ **Hello World Screen** - Welcome screen showing app features
- ✅ **Header Navigation** - Tab-based navigation between Home and Settings
- ✅ **Modern UI** - Clean, responsive design

## Project Structure

```
src/
├── main.ts                 # Main Electron process
├── preload.ts             # Secure IPC bridge
├── modules/
│   ├── shortcutManager.ts  # Global keyboard shortcuts
│   └── settingsManager.ts  # Settings persistence
└── renderer/
    ├── index.tsx          # React app entry
    ├── App.tsx            # Main app component
    ├── App.css            # Global styles
    ├── global.d.ts        # TypeScript definitions
    └── components/
        ├── Header.tsx     # Navigation header
        ├── HelloWorld.tsx # Welcome screen
        └── Settings.tsx   # Settings panel
```

## Usage

- **Toggle Window**: `Cmd+Shift+Space` (macOS) or `Ctrl+Shift+Space` (Windows/Linux)
- **Quit App**: `Cmd+Q` (macOS) or `Ctrl+Q` (Windows/Linux)
- **Settings**: Click the Settings tab to configure theme, shortcuts, and behavior

## Development

The app uses:
- **Electron** for cross-platform desktop functionality
- **React** for the user interface
- **TypeScript** for type safety
- **Webpack** for bundling
- **CSS** for styling

## Note on Linter Errors

The TypeScript linter may show errors before installing dependencies. These will resolve after running `npm install`.

## Next Steps

1. Run `npm install` to install dependencies
2. Run `npm run dev` to start development
3. Customize the app by modifying components in `src/renderer/components/`
4. Add new features by creating modules in `src/modules/`

Happy coding! 🚀 