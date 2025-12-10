# How to Check Console Logs in Expo

## Method 1: Terminal/Command Prompt (Easiest) ⭐

**Where:** The terminal window where you ran `npm start` or `expo start`

**Steps:**
1. Open your terminal/command prompt
2. Navigate to your project: `cd "E:\Weiblock\step counter\step-count"`
3. Run: `npm start` or `expo start`
4. **All console logs will appear here!**

**What you'll see:**
```
LOG  Checking pedometer availability...
LOG  Pedometer available: true
LOG  Setting up pedometer watch...
LOG  ✅ Android pedometer watchStepCount started successfully
LOG  📊 Sending initial step count update: 0
LOG  Android pedometer callback received - currentSteps: 5
```

---

## Method 2: Expo Go App Developer Menu

**On Your Phone:**
1. Shake your device (or press volume buttons on Android)
2. Tap "Debug Remote JS" 
3. Logs will appear in your terminal

**On Emulator:**
- **Android:** Press `Ctrl+M` or `Cmd+M`
- **iOS:** Press `Cmd+D`

---

## Method 3: Chrome DevTools (Advanced)

1. In terminal, press `j` to open in Chrome
2. Or shake device → "Debug Remote JS"
3. Open Chrome → Press F12
4. Go to "Console" tab
5. All logs appear here

---

## Method 4: Android Logcat (For Android Devices)

**If using Android Studio:**
1. Open Android Studio
2. Connect your device
3. Go to: **View → Tool Windows → Logcat**
4. Filter by: `ReactNativeJS` or `Expo`

**Or use ADB command:**
```bash
adb logcat | grep -i "reactnativejs\|expo\|pedometer"
```

---

## Quick Test - See Logs Right Now

1. **Open your terminal** (where you ran `expo start`)
2. **Look for these messages:**
   - `Checking pedometer availability...`
   - `Pedometer available: true/false`
   - `Setting up pedometer watch...`
   - `✅ Android pedometer watchStepCount started successfully`

3. **Walk a few steps** and watch for:
   - `Android pedometer callback received - currentSteps: X`

---

## Common Log Messages to Look For

### ✅ Good Signs:
- `Pedometer available: true`
- `✅ Android pedometer watchStepCount started successfully`
- `Android pedometer callback received`

### ❌ Problems:
- `Pedometer is not available on this device`
- `Failed to create Android pedometer subscription`
- `Error initializing pedometer`

---

## Tips

1. **Keep terminal open** - This is where all logs appear
2. **Scroll up** - Older logs are above
3. **Look for emojis** - I added ✅ and 📊 to make important logs easy to spot
4. **Filter logs** - In terminal, you can search for "pedometer" to filter

---

## Still Not Seeing Logs?

1. Make sure `expo start` is running
2. Check if app is connected (should show "Connected" in terminal)
3. Try reloading app: Press `r` in terminal or shake device → "Reload"
4. Check if you're looking at the right terminal window

