# 🚀 Setup Guide - Make This Boilerplate Yours

This guide will help you customize the macOS menu bar app boilerplate for your own project.

## 📋 Quick Setup Checklist

### 1. Project Identity (`package.json`)

Edit these fields in `package.json`:

```json
{
  "name": "your-app-name",
  "version": "1.0.0", 
  "description": "Your app description",
  "author": "Your Name <your.email@example.com>",
  "homepage": "https://github.com/yourusername/your-repo"
}
```

### 2. App Configuration (`package.json` build section)

Update the build configuration:

```json
{
  "build": {
    "appId": "com.yourcompany.yourapp",
    "productName": "Your App Name",
    "copyright": "Copyright © 2025 Your Company",
    "publish": {
      "provider": "github",
      "owner": "yourusername", 
      "repo": "your-repo-name"
    }
  }
}
```

### 3. Repository Information (`package.json`)

Set your repository:

```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/your-repo-name"
  }
}
```

### 4. App Icons

Replace these icon files with your own:

- `src/assets/icons/app-icon.png` - Main app icon (512x512px recommended)
- `src/assets/icons/menubar-icon.png` - Menubar tray icon (16x16px or 22x22px)
- `src/assets/icons/menubar-icon@2x.png` - Retina menubar icon (32x32px or 44x44px)

### 5. App Display Name

Update the window tooltip in `src/main.ts`:

```typescript
this.menubar = menubar({
  // ... other options
  tooltip: 'Your App Name', // Change this
});
```

### 6. Default Settings

Edit `src/shared/constants.ts` to change default shortcuts and settings:

```typescript
export const DEFAULT_SETTINGS: AppSettings = {
  // Update default shortcuts
  shortcuts: {
    toggleWindow: 'CommandOrControl+Shift+Space', // Your preferred shortcut
    quit: 'CommandOrControl+Q',
  },
  // Update default window size
  window: {
    width: 400,  // Your preferred width
    height: 500, // Your preferred height
  },
  // Other defaults...
};
```

### 7. App Content

Replace the default content in `src/renderer/components/HelloWorld.tsx` with your app's main functionality.

### 8. GitHub Actions (Optional)

If using GitHub Actions for releases, update `.github/workflows/ci.yml`:

- Set the correct repository secrets
- Update the `GH_TOKEN` secret in your GitHub repository settings

### 9. README

Update `README.md` with:
- Your app's name and description
- Installation instructions specific to your app
- Features and usage information

## 🔧 Development Commands

After customization:

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Build for production
npm run build

# Package for macOS
npm run dist:mac
```

## 📝 Important Notes

### App ID Format
- Use reverse domain notation: `com.yourcompany.yourapp`
- Only lowercase letters, numbers, dots, and hyphens
- Must be unique (used for macOS app identification)

### Icon Requirements
- **App Icon**: 512x512px PNG (used for DMG and app bundle)
- **Menubar Icon**: 16x16px or 22x22px PNG (template image, should be black/transparent)
- **Menubar Icon @2x**: 32x32px or 44x44px PNG (retina version)

### Code Signing (For Distribution)
If you plan to distribute your app:
1. Get an Apple Developer account
2. Create certificates in Xcode
3. Update entitlements in `src/assets/entitlements.mac.plist`
4. Set environment variables for code signing

## 🎯 Quick Start Commands

```bash
# 1. Clone this repo
git clone <this-repo-url> your-app-name
cd your-app-name

# 2. Update package.json with your details
# Edit: name, description, author, homepage, repository, build.appId, build.productName

# 3. Replace icons in src/assets/icons/

# 4. Update app name in src/main.ts (tooltip)

# 5. Start development
npm install
npm run dev
```

## 🚀 Ready to Build

Once you've made these changes:

1. Test your app: `npm run dev`
2. Build for production: `npm run build`
3. Package for distribution: `npm run dist:mac`
4. Create a GitHub release to test auto-updates

That's it! Your menubar app is ready to go. 🎉 