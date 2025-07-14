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

# Test unsigned build
npm run package:mac-unsigned

# Build signed version (after setup)
./package-mac-signed.sh
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

## 🍎 Mac Signing and Notarization Setup

For distributing your app without security warnings, you'll need to sign and notarize it.

### Prerequisites

1. **Apple Developer Account**: You need an active Apple Developer Program subscription ($99/year)
2. **macOS**: Code signing must be done on macOS
3. **Xcode**: Install from the Mac App Store

### Step 1: Get Required Credentials

#### 1.1 App Specific Password
1. Visit https://account.apple.com/account/manage
2. Sign in to your Apple Account
3. Create a new App Specific Password and store it securely
4. The password looks like: `dsjg-zqet-rpzp-nfzy`

#### 1.2 Developer ID Application Certificate
1. Open Xcode → Settings → Account → "Manage Certificates"
2. Click "+" to create a "Developer ID Application Certificate"
3. Generate a random password (save this password securely)
4. Left-click the Certificate, export it:
   - Use the generated password
   - Name the file "certificate"
   - Save "certificate.p12" in your project root directory

#### 1.3 Team ID
1. Visit https://developer.apple.com/account
2. Scroll to the "Membership details" section
3. Copy the "Team ID" (looks like: `AB8Y7TRS2P`)

### Step 2: Local Setup

#### 2.1 Install Dependencies
Dependencies are already included in the project:
```bash
npm install --save-dev electron-builder@latest @electron/notarize@latest
```

#### 2.2 Configure Signing Script
1. Edit the `package-mac-signed.sh` file in your project root
2. Replace the placeholder values with your actual credentials:
   ```bash
   export APPLE_ID="your-apple-id@gmail.com"
export APPLE_APP_SPECIFIC_PASSWORD="your-app-specific-password"
export APPLE_TEAM_ID="YOUR_TEAM_ID"
   export CSC_LINK="./certificate.p12"
export CSC_KEY_PASSWORD="your-certificate-password"
```

#### 2.3 Make Script Executable
```bash
chmod +x package-mac-signed.sh
```

#### 2.4 Place Certificate
Place your `certificate.p12` file in the project root directory.

### Step 3: Build and Sign

#### 3.1 Test Build (Unsigned)
```bash
npm run package:mac-unsigned
```

#### 3.2 Build and Sign
```bash
./package-mac-signed.sh
```

**Important Notes:**
- First-time notarization can take 8-12 hours
- Subsequent notarizations typically take 5-10 minutes
- The process will show "notarization successful" when complete
- The signed `.dmg` will be in the `release/` folder

### Step 4: GitHub Actions Automation

#### 4.1 Add GitHub Secrets
In your GitHub repository, go to Settings → Secrets and variables → Actions, and add:

```
APPLE_ID                     # Your Apple ID email
APPLE_APP_SPECIFIC_PASSWORD  # Your App Specific Password
APPLE_TEAM_ID                # Your Team ID
CSC_LINK                     # Base64 encoded certificate (see below)
CSC_KEY_PASSWORD             # Your certificate password
```

#### 4.2 Encode Certificate for GitHub
```bash
base64 -i certificate.p12
```
Copy the output and paste it as the `CSC_LINK` secret.

#### 4.3 Create Release
To trigger a signed release:
```bash
git tag v1.0.0
git push origin v1.0.0
```

The GitHub Actions workflow will:
- Build for macOS (signed)
- Create a GitHub release with all artifacts
- Enable auto-updates for your users

### Step 5: Auto-Updates

Your app already includes auto-update functionality using `electron-updater`. When you release a new version:

1. Update the version in `package.json`
2. Create a new git tag: `git tag v1.0.1`
3. Push the tag: `git push origin v1.0.1`
4. GitHub Actions will build and publish the new version
5. Existing users will automatically receive the update

## 🔧 Build Commands

- `npm run package` - Build for current platform (no signing)
- `npm run package:mac-unsigned` - Build for macOS without signing
- `npm run package:publish` - Build and publish to GitHub releases
- `./package-mac-signed.sh` - Build signed version locally

## 🛠️ Troubleshooting

### Common Issues

1. **Notarization timeout** - First-time notarization is slow; be patient
2. **Certificate issues** - Ensure your certificate is valid and not expired
3. **Network issues** - Notarization requires internet connection
4. **"No identity found"** - Make sure your certificate is properly installed

### Build Logs

Check the build output for detailed error messages. Common issues:
- Invalid credentials
- Expired certificates
- Network connectivity problems
- App entitlements issues

## 🔒 Security Notes

- Never commit `certificate.p12` or `package-mac-signed.sh` to version control
- These files are already added to `.gitignore`
- Store your credentials securely
- Rotate your App Specific Password periodically

## 🚀 Next Steps

1. Test the unsigned build first
2. Set up your Apple Developer credentials
3. Try a local signed build
4. Configure GitHub Actions for automated releases
5. Test the auto-update functionality

For more details, refer to the [Apple Developer Documentation](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution) and [Electron Builder Documentation](https://www.electron.build/code-signing). 