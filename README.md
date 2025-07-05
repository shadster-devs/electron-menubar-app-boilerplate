# Electron Menubar App

A clean, modular Electron menubar application built with React and TypeScript.

## Features

- 🎯 **Menubar Integration**: Elegant tray-based application using `@max-mapper/menubar`
- ⚛️ **React + TypeScript**: Modern frontend with full type safety
- 🔧 **Modular Architecture**: Clean separation of concerns with dedicated managers
- ⌨️ **Global Shortcuts**: Customizable keyboard shortcuts for quick access
- ⚙️ **Settings Management**: Persistent settings with JSON storage
- 🎨 **Beautiful UI**: Modern interface with intuitive controls
- 🔒 **Secure**: Context isolation and proper IPC communication

## Project Structure

```
src/
├── main.ts                 # Main process entry point
├── preload.ts             # Secure IPC bridge
├── modules/               # Core modules
│   ├── index.ts          # Module exports
│   ├── settingsManager.ts # Settings persistence
│   ├── shortcutManager.ts # Global shortcuts
│   ├── contextMenuManager.ts # Tray context menu
│   ├── menuManager.ts    # Application menu
│   └── ipcManager.ts     # IPC communication
└── renderer/             # React app
    ├── index.tsx         # React entry point
    ├── App.tsx           # Main app component
    ├── App.css           # Styles
    └── components/       # React components
        ├── Header.tsx    # App header
        ├── HelloWorld.tsx # Welcome component
        ├── Settings.tsx  # Settings panel
        └── ShortcutRecorder.tsx # Shortcut recording
```

## Architecture

### Modular Design

The application follows a clean modular architecture where each manager handles a specific responsibility:

- **ContextMenuManager**: Handles tray icon context menu
- **MenuManager**: Manages application menu
- **IPCManager**: Handles all inter-process communication
- **SettingsManager**: Manages persistent settings
- **ShortcutManager**: Handles global keyboard shortcuts

### Main Process (`main.ts`)

The main process is now clean and focused, delegating responsibilities to specialized modules:

```typescript
class MenubarApp {
  private menubar: any;
  private settingsManager!: SettingsManager;
  private shortcutManager!: ShortcutManager;
  private contextMenuManager!: ContextMenuManager;
  private menuManager!: MenuManager;
  private ipcManager!: IPCManager;
  
  // Clean initialization and setup
}
```

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone or download the project
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run in development mode:
```bash
npm run dev
```

### Building

Build for production:
```bash
npm run build
```

### Running

After building, start the app:
```bash
npm start
```

## Usage

### Basic Operation

- **Show/Hide**: Click the menubar icon or use `Cmd+Shift+Space` (default shortcut)
- **Settings**: Click the gear icon (⚙️) in the header
- **Minimize**: Click the arrow icon (↗️) in the header
- **Context Menu**: Right-click the menubar icon for options

### Shortcuts

Default keyboard shortcuts:
- `Cmd+Shift+Space`: Toggle window visibility
- `Cmd+Q`: Quit application

### Recording Custom Shortcuts

1. Open Settings (gear icon)
2. Click on a shortcut field
3. Press your desired key combination
4. The shortcut will be recorded and saved automatically

### Settings

Settings are automatically saved to a JSON file and include:
- Custom keyboard shortcuts
- Window preferences
- Application state

## Development

### Adding New Modules

1. Create a new file in `src/modules/`
2. Export the module in `src/modules/index.ts`
3. Initialize in `main.ts` if needed

### Extending IPC

Add new IPC handlers in `IPCManager`:

```typescript
// In ipcManager.ts
ipcMain.handle('my-new-channel', async (event, data) => {
  // Handle the request
  return result;
});
```

### Custom Context Menu Items

```typescript
// Add custom items to context menu
menubarApp.updateContextMenu([
  {
    label: 'Custom Action',
    click: () => console.log('Custom action clicked')
  }
]);
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the modular architecture
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this as a starting point for your own menubar applications! 