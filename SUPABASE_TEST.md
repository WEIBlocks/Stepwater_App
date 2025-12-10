# Supabase Connection Testing Guide

This guide explains how to test your Supabase connection and verify that everything is working correctly.

## Automatic Testing

The app **automatically tests the Supabase connection** when it starts:

1. **On App Startup**: Connection test runs automatically
2. **Console Logs**: Check your Expo console for detailed test results
3. **Error Handling**: Tests won't break the app if Supabase isn't configured

## Manual Testing

You can manually test the connection from the Settings screen:

### Quick Connection Test
1. Open the app
2. Go to **Settings** tab
3. Scroll to **"Supabase Connection"** section
4. Tap **"🔍 Test Connection"**
5. Check the alert for results
6. Check console for detailed logs

### Full API Test
1. Go to **Settings** tab
2. Tap **"🧪 Full API Test"**
3. This tests all CRUD operations on all tables
4. Check console for detailed results

## What Gets Tested

### Connection Test Checks:
- ✅ Credentials are configured (URL and Key)
- ✅ Can connect to Supabase server
- ✅ Each table exists and is accessible:
  - `day_summaries`
  - `water_logs`
  - `user_goals`
  - `reminders`

### Full API Test Checks:
- ✅ Connection works
- ✅ SELECT operations on all tables
- ✅ INSERT/UPSERT operations
- ✅ Error handling

## Understanding Test Results

### ✅ Success Messages:
- **"All tables are accessible!"** - Everything is working perfectly
- **"Connection works but some tables are missing"** - Supabase is connected but you need to create tables

### ⚠️ Warning Messages:
- **"Tables not created yet"** - Run the SQL from `SUPABASE_SETUP.md` in your Supabase SQL Editor
- **"Missing Supabase credentials"** - Check your `.env` file

### ❌ Error Messages:
- **Connection errors** - Check your internet connection and Supabase URL
- **Authentication errors** - Verify your anon key is correct

## Console Log Format

When tests run, you'll see detailed logs like:

```
🔧 Supabase Configuration Check:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 URL: https://xxxxx.supabase.co...
🔑 Key: eyJhbGciOiJIUzI1NiIs...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧪 Testing Supabase Connection...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Testing basic connection...
✅ Basic connection successful!

📊 Testing table access...
   ✅ day_summaries: Accessible
   ✅ water_logs: Accessible
   ✅ user_goals: Accessible
   ✅ reminders: Accessible

✅ All tables are accessible! Supabase is fully configured.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Troubleshooting

### If connection test fails:

1. **Check `.env` file exists** in project root
2. **Verify variable names** start with `EXPO_PUBLIC_`
3. **Restart Expo** after changing `.env` file
4. **Check Supabase dashboard** - is your project active?
5. **Verify credentials** in Supabase Settings → API

### If tables are missing:

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy SQL from `SUPABASE_SETUP.md`
5. Run the query
6. Test connection again

### If credentials aren't loading:

1. Make sure `.env` is in project root (same folder as `package.json`)
2. Variable names must be:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Restart Expo completely (Ctrl+C, then `npx expo start --clear`)

## Testing Workflow

Recommended testing order:

1. **Start App** → Check console for auto-test results
2. **Add Water** → Verify data saves locally
3. **Test Connection** → Verify Supabase sync works
4. **Check Supabase Dashboard** → Verify data appears in tables
5. **Full API Test** → Verify all operations work

## Notes

- Tests are **non-blocking** - app works even if Supabase isn't configured
- Tests run **asynchronously** - won't slow down app startup
- Errors are **gracefully handled** - won't crash the app
- Local storage **always works** - even without Supabase


