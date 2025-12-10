# Android SDK Setup Guide

## Error Fixed: Android SDK Not Found

The build failed because the Android SDK path wasn't configured. Here's how to fix it:

## Quick Fix (If Android Studio is Installed)

### Step 1: Find Your Android SDK Location

The SDK is usually located at:
- **Windows**: `C:\Users\YourUsername\AppData\Local\Android\Sdk`
- Or check in Android Studio: **File → Settings → Appearance & Behavior → System Settings → Android SDK**

### Step 2: Set Environment Variables

**Option A: Using PowerShell (Temporary - Current Session Only)**
```powershell
$env:ANDROID_HOME = "C:\Users\YourUsername\AppData\Local\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\tools"
```

**Option B: Set Permanently (Recommended)**

1. Press `Win + R`, type `sysdm.cpl`, press Enter
2. Go to **Advanced** tab → **Environment Variables**
3. Under **User variables**, click **New**:
   - Variable name: `ANDROID_HOME`
   - Variable value: `C:\Users\YourUsername\AppData\Local\Android\Sdk`
4. Find **Path** variable → Click **Edit** → Add these:
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\tools`
   - `%ANDROID_HOME%\tools\bin`
5. Click **OK** on all dialogs
6. **Restart your terminal/PowerShell** for changes to take effect

### Step 3: Verify Setup

```powershell
# Check ANDROID_HOME
echo $env:ANDROID_HOME

# Check adb
adb version

# Check devices
adb devices
```

## If Android Studio is NOT Installed

### Install Android Studio

1. **Download Android Studio**: https://developer.android.com/studio
2. **Install it** (this will also install the Android SDK)
3. **Open Android Studio** → **More Actions** → **SDK Manager**
4. Install:
   - Android SDK Platform (API 33 or 34)
   - Android SDK Build-Tools
   - Android SDK Platform-Tools
5. **Note the SDK location** (usually `C:\Users\YourUsername\AppData\Local\Android\Sdk`)
6. **Set environment variables** as described above

## Alternative: Use EAS Build (Cloud Build)

If you don't want to install Android Studio locally, you can use cloud builds:

```bash
# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build in the cloud
eas build --platform android --profile development
```

This builds in the cloud and you just download the APK.

## After Setting Up

Once ANDROID_HOME is configured:

1. **Close and reopen your terminal**
2. **Verify setup**:
   ```bash
   adb devices
   ```
3. **Run the build again**:
   ```bash
   npx expo run:android
   ```

## Quick Test Script

Run this in PowerShell to check your setup:

```powershell
# Check if SDK exists
$sdkPath = "$env:LOCALAPPDATA\Android\Sdk"
if (Test-Path $sdkPath) {
    Write-Host "✅ SDK found at: $sdkPath"
    
    # Set ANDROID_HOME
    $env:ANDROID_HOME = $sdkPath
    [System.Environment]::SetEnvironmentVariable('ANDROID_HOME', $sdkPath, 'User')
    Write-Host "✅ ANDROID_HOME set"
    
    # Add to PATH
    $platformTools = Join-Path $sdkPath "platform-tools"
    if (Test-Path $platformTools) {
        $currentPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
        if ($currentPath -notlike "*$platformTools*") {
            [System.Environment]::SetEnvironmentVariable('Path', "$currentPath;$platformTools", 'User')
            Write-Host "✅ Added platform-tools to PATH"
        }
    }
    
    Write-Host "✅ Setup complete! Restart your terminal and try again."
} else {
    Write-Host "❌ Android SDK not found. Please install Android Studio first."
    Write-Host "Download: https://developer.android.com/studio"
}
```

---

**After setting up, restart your terminal and run `npx expo run:android` again!**

