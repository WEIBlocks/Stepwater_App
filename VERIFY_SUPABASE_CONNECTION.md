# Supabase Connection Verification Guide

## Current Status

Based on the verification script, here's what we found:

✅ **Connection**: Working - Can connect to Supabase
✅ **Tables**: All 4 tables exist (day_summaries, water_logs, user_goals, reminders)
✅ **Read Operations**: SELECT queries work
❌ **Write Operations**: INSERT/UPSERT operations are failing due to RLS policies

## The Problem

Your Supabase database has Row Level Security (RLS) enabled, but the policies are not configured correctly to allow write operations. This is why:
- You can see the tables exist (SELECT works)
- But you can't insert/update data (INSERT/UPSERT fails)

## Solution

### Step 1: Fix RLS Policies

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the contents of `fix-supabase-rls.sql` file
6. Click **Run** (or press Ctrl+Enter)

This will:
- Enable RLS on all tables
- Create policies that allow all operations for anonymous users
- Fix the write permission issues

### Step 2: Verify the Fix

After running the SQL, run the verification script again:

```bash
node verify-supabase.js
```

You should now see:
- ✅ All INSERT/UPSERT operations succeed
- ✅ Data can be saved and retrieved

### Step 3: Test in Your App

1. Restart your Expo development server:
   ```bash
   npm start
   ```

2. In your app, try:
   - Adding water (should save to Supabase)
   - Adding steps (should save to Supabase)
   - Changing goals (should save to Supabase)

3. Check Supabase Dashboard:
   - Go to **Table Editor**
   - Select any table (e.g., `day_summaries`)
   - You should see data appearing as you use the app

## How to Check if Data is Being Saved

### Method 1: Supabase Dashboard
1. Go to https://app.supabase.com
2. Select your project
3. Go to **Table Editor**
4. Click on `day_summaries`, `water_logs`, etc.
5. You should see rows appearing as you use the app

### Method 2: Run Verification Script
```bash
node verify-supabase.js
```

This will:
- Test connection
- Test all CRUD operations
- Show existing data counts
- Display sample data

### Method 3: Check App Logs
When you run your app, check the console for:
- `✅ Supabase credentials found! Initializing client...`
- `🚀 Supabase ready! Cloud sync is enabled.`
- Any error messages about Supabase

## Troubleshooting

### Issue: "Could not find the table in the schema cache"
**Solution**: This is an RLS policy issue. Run the `fix-supabase-rls.sql` script.

### Issue: Tables don't exist
**Solution**: Run the SQL from `SUPABASE_SETUP.md` to create the tables.

### Issue: Data not appearing in Supabase
**Possible causes**:
1. RLS policies blocking writes - Run `fix-supabase-rls.sql`
2. App not using Supabase - Check that `.env` file has correct credentials
3. Expo not loading env vars - Restart Expo server after changing `.env`

### Issue: Environment variables not loading
**Solution**:
1. Make sure `.env` file is in `step-count/` directory (not parent directory)
2. Variables must start with `EXPO_PUBLIC_`
3. Restart Expo server completely after changing `.env`
4. Check `app.config.js` is reading from `process.env`

## Current Configuration

Your `.env` file has:
- ✅ `EXPO_PUBLIC_SUPABASE_URL` - Correct
- ✅ `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Correct

Your app is configured to:
- ✅ Use Supabase for cloud sync
- ✅ Fall back to local storage if Supabase fails
- ✅ Log connection status on startup

## Next Steps

1. ✅ Fix RLS policies (run `fix-supabase-rls.sql`)
2. ✅ Verify connection (run `node verify-supabase.js`)
3. ✅ Test in app (add water/steps and check Supabase dashboard)
4. ✅ Monitor data sync (check tables regularly)

Once RLS policies are fixed, your app will be fully dynamic and all data will sync to Supabase!

