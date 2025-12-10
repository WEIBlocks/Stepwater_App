# Build Options - Fix Android SDK Error

## ❌ Problem
Android SDK is not installed on your system. You have two options:

---

## ✅ Option 1: EAS Build (Cloud) - RECOMMENDED ⭐

**No Android Studio needed!** Builds in the cloud.

### Steps:

1. **Login to Expo** (if not already):
   ```bash
   eas login
   ```
   (Create account at expo.dev if needed)

2. **Configure EAS**:
   ```bash
   eas build:configure
   ```

3. **Build for Android**:
   ```bash
   eas build --platform android --profile development
   ```

4. **Wait for build** (10-15 minutes, first time)

5. **Install on device**:
   - Scan QR code when build completes
   - Or download APK and install manually

**Pros:**
- ✅ No Android Studio needed
- ✅ No local setup
- ✅ Works on any OS
- ✅ Faster setup

**Cons:**
- ⏱️ Takes 10-15 minutes per build
- 🌐 Requires internet

---

## ✅ Option 2: Install Android Studio (Local Build)

**For faster rebuilds after initial setup.**

### Steps:

1. **Download Android Studio**:
   - https://developer.android.com/studio
   - Install it (includes Android SDK)

2. **Open Android Studio** → **More Actions** → **SDK Manager**

3. **Install**:
   - ✅ Android SDK Platform (API 33 or 34)
   - ✅ Android SDK Build-Tools
   - ✅ Android SDK Platform-Tools

4. **Set Environment Variables**:
   
   **Windows:**
   - Press `Win + R` → type `sysdm.cpl` → Enter
   - **Advanced** → **Environment Variables**
   - **New User Variable**:
     - Name: `ANDROID_HOME`
     - Value: `C:\Users\YourUsername\AppData\Local\Android\Sdk`
   - Edit **Path** variable → Add:
     - `%ANDROID_HOME%\platform-tools`
     - `%ANDROID_HOME%\tools`

5. **Restart terminal** and verify:
   ```bash
   adb version
   ```

6. **Build**:
   ```bash
   npx expo run:android
   ```

**Pros:**
- ✅ Faster rebuilds
- ✅ Works offline
- ✅ Full control

**Cons:**
- ⏱️ Large download (~1GB)
- ⏱️ Takes 30+ minutes to install
- 💾 Requires disk space

---

## 🚀 Quick Start (EAS Build)

I recommend **Option 1 (EAS Build)** for now. Run these commands:

```bash
cd step-count

# Login (first time only)
eas login

# Configure
eas build:configure

# Build
eas build --platform android --profile development
```

Then wait for the build to complete and install the APK on your device!

---

## Which Should You Choose?

- **Want to build now?** → Use **EAS Build (Option 1)**
- **Want faster rebuilds later?** → Install **Android Studio (Option 2)**
- **Just testing?** → Use **EAS Build** - it's simpler!

---

**Let's go with EAS Build!** It's the fastest way to get your app running with the pedometer working! 🚀

