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

### Code Signing & Notarization (For Distribution)
If you plan to distribute your app:

#### Prerequisites
1. Get an Apple Developer account ($99/year)
2. Create certificates in Xcode or Apple Developer portal
3. Update entitlements in `src/assets/entitlements.mac.plist` if needed

#### Notarization Setup
Your app is already configured for notarization. You need to set these environment variables:

```bash
# Required for notarization
export APPLE_ID="your-apple-id@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="your-app-specific-password"
export APPLE_TEAM_ID="YOUR_TEAM_ID"

# For code signing (choose one approach):
# Option A: Auto-discovery (for local development)
export CSC_IDENTITY_AUTO_DISCOVERY="true"

# Option B: Certificate file (for GitHub Actions)
export CSC_LINK="base64-encoded-p12-certificate"
export CSC_KEY_PASSWORD="your-certificate-password"
```

#### Getting Your Credentials

1. **Apple ID**: Your Apple Developer account email
2. **App-Specific Password**: 
   - Go to https://appleid.apple.com
   - Sign in with your Apple ID
   - Generate an app-specific password for notarization
3. **Team ID**: 
   - Go to https://developer.apple.com/account
   - Look for "Team ID" in your account details
4. **GitHub Token** (for automated releases):
   - Go to GitHub → Settings → Developer settings → Personal access tokens
   - Generate a new token with `repo` and `write:packages` permissions
   - Use this for the `GH_TOKEN` secret

5. **Code Signing Certificate** (for GitHub Actions):
   - Open **Keychain Access** on macOS
   - Find your "Developer ID Application: Your Name (TEAM_ID)" certificate
   - Right-click → Export "Developer ID Application..."
   - Save as `.p12` file with a password
   - Convert to base64: `base64 -i certificate.p12 | pbcopy`
   - Use the base64 string for `CSC_LINK` secret
   - Use the certificate password for `CSC_KEY_PASSWORD` secret

#### Setting Up Environment Variables

**Option 1: GitHub Secrets (recommended for CI/CD)**
For automated builds and releases, set these as GitHub repository secrets:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add these secrets:

```
APPLE_ID = your-apple-id@example.com
APPLE_ID_PASSWORD = your-app-specific-password
APPLE_TEAM_ID = YOUR_TEAM_ID
GH_TOKEN = your-github-personal-access-token
CSC_LINK = base64-encoded-p12-certificate
CSC_KEY_PASSWORD = your-certificate-password
```

*Note: You'll still name the GitHub secret `APPLE_ID_PASSWORD` but electron-builder will read it as `APPLE_APP_SPECIFIC_PASSWORD`*

**Option 2: Local `.env` file (for development)**
```bash
# Create .env file in your project root
echo "APPLE_ID=your-apple-id@example.com" > .env
echo "APPLE_APP_SPECIFIC_PASSWORD=your-app-specific-password" >> .env
echo "APPLE_TEAM_ID=YOUR_TEAM_ID" >> .env
echo "CSC_IDENTITY_AUTO_DISCOVERY=true" >> .env
```

*Note: For local development, you can use `CSC_IDENTITY_AUTO_DISCOVERY=true` to automatically find certificates in your keychain instead of using CSC_LINK/CSC_KEY_PASSWORD.*

**Option 3: Export in your shell profile**
```bash
# Add to ~/.zshrc or ~/.bashrc
export APPLE_ID="your-apple-id@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="your-app-specific-password"
export APPLE_TEAM_ID="YOUR_TEAM_ID"
export CSC_IDENTITY_AUTO_DISCOVERY="true"
```

#### Building with Notarization
```bash
# Build and notarize
npm run dist:mac
```

The notarization process will:
1. Build your app
2. Sign it with your Developer ID certificate
3. Upload to Apple for notarization
4. Staple the notarization ticket to your app
5. Create the final DMG/ZIP files

**Note**: First-time notarization may take 5-15 minutes. Subsequent builds are usually faster.

#### Automated Releases with GitHub Actions

Once you've set up the GitHub secrets, your app will automatically:

1. **On every push to `main`**: Run tests and build (without publishing)
2. **On tagged releases**: Build, notarize, and publish to GitHub Releases

**To create a release:**
```bash
# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0
```

The GitHub Action will:
- ✅ Run tests and linting
- ✅ Build and notarize your app
- ✅ Create a GitHub release with DMG and ZIP files
- ✅ Generate `latest-mac.yml` for auto-updater

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