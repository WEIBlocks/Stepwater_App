# How to Verify Supabase is Working

## ⚠️ Important: About Users

**You won't see users in the `auth.users` table** because:
- The app doesn't have authentication implemented yet
- Data is saved anonymously (without user accounts)
- This is normal and expected!

**Instead, check your data tables:**
- `day_summaries` - Your daily step/water summaries
- `water_logs` - Individual water intake entries
- `user_goals` - Step and water goals
- `reminders` - Water reminders

## Step 1: Verify Environment Variables

Your `.env` file must have `EXPO_PUBLIC_` prefix:

```env
EXPO_PUBLIC_SUPABASE_URL=https://lkgpzngnbemjyasaaqul.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**If your variables don't have the prefix, fix them and restart Expo!**

## Step 2: Verify Database Tables Exist

1. Go to your Supabase dashboard
2. Click on **Table Editor** in the left sidebar
3. You should see these tables:
   - `day_summaries`
   - `water_logs`
   - `user_goals`
   - `reminders`

If tables don't exist, run the SQL from `SUPABASE_SETUP.md` Step 5.

## Step 3: Test the Connection

1. **Restart Expo** (important after changing .env):
   ```bash
   npm start
   ```

2. **Use the app** - Add some water or update your step goal

3. **Check Supabase dashboard**:
   - Go to **Table Editor**
   - Click on `water_logs` table
   - You should see new entries appear!

## Step 4: Check Logs for Errors

In your Expo terminal or React Native debugger, look for:
- ✅ "Supabase connected" messages
- ❌ "Supabase sync failed" warnings
- ❌ "Supabase URL and Anon Key are required" warnings

## Step 5: Verify Data is Syncing

### Option A: Check in Supabase Dashboard
1. Open Supabase dashboard → Table Editor
2. Click on `day_summaries` table
3. Add water in your app
4. Refresh the table - you should see new rows appear!

### Option B: Check API Logs
1. Go to Supabase dashboard → **Logs** → **API Logs**
2. You should see POST/GET requests when data syncs

## Troubleshooting

### "No data in tables"
- ✅ Make sure you've used the app (added water, updated goals, etc.)
- ✅ Check that `.env` has `EXPO_PUBLIC_` prefix
- ✅ Restart Expo after changing `.env`
- ✅ Verify tables exist in Supabase

### "Supabase sync failed" warnings
- Check RLS (Row Level Security) policies
- Verify your API keys are correct
- Check Supabase dashboard → Logs for detailed errors

### Still not working?
1. Check console logs in Expo terminal
2. Check Supabase dashboard → Logs → API Logs
3. Verify your Supabase project is active (not paused)
4. Make sure tables were created successfully

## Expected Behavior

When working correctly:
1. ✅ App saves to local storage immediately (works offline)
2. ✅ App syncs to Supabase in background (when online)
3. ✅ Data appears in Supabase tables within seconds
4. ✅ No errors in console logs

## Next: Add User Authentication (Optional)

If you want to see users in the `auth.users` table:
1. Implement authentication in your app
2. Users sign up/login
3. Then you'll see users in `auth.users`
4. Update RLS policies to use `auth.uid()`

For now, the app works great without authentication - data is just stored anonymously!


