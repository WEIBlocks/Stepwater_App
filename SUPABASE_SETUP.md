# Supabase Setup Guide

This guide will help you set up Supabase for your Step & Water app.

## Step 1: Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in your project details:
   - **Name**: Step & Water (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
   - Click "Create new project"

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")

## Step 3: Configure Environment Variables

1. Open the `.env` file in the root of your project
2. Add your Supabase credentials:

```env
SUPABASE_URL=https://lkgpzngnbemjyasaaqul.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrZ3B6bmduYmVtanlhc2FhcXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDk4OTksImV4cCI6MjA4MDMyNTg5OX0.bpiOq3O7iQRv3n9GBhZvg2boiVbpVz8uYmIkTaAqAuA
```

3. **Important**: Make sure `.env` is in your `.gitignore` (it already is)

## Step 4: Update app.config.js

The app.config.js is already configured to read environment variables. If you need to adjust, check the `extra` section.

## Step 5: Create Database Tables

Run these SQL commands in your Supabase SQL Editor:

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **New Query**
3. Paste and run the following SQL:

```sql
-- Day Summaries Table
CREATE TABLE IF NOT EXISTS day_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL UNIQUE,
  steps INTEGER NOT NULL DEFAULT 0,
  step_distance_meters DECIMAL(10, 2),
  calories INTEGER,
  water_ml INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Water Logs Table
CREATE TABLE IF NOT EXISTS water_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIMESTAMP WITH TIME ZONE NOT NULL,
  amount_ml INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Goals Table
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_steps INTEGER NOT NULL DEFAULT 10000,
  daily_water_ml INTEGER NOT NULL DEFAULT 2000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Reminders Table
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  time TIME NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  days_of_week INTEGER[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_day_summaries_date ON day_summaries(date);
CREATE INDEX IF NOT EXISTS idx_day_summaries_user_id ON day_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_water_logs_date ON water_logs(date);
CREATE INDEX IF NOT EXISTS idx_water_logs_user_id ON water_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE day_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (for now, we'll allow all)
-- In production, you should restrict these based on user_id
CREATE POLICY "Allow all operations for day_summaries" ON day_summaries
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for water_logs" ON water_logs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for user_goals" ON user_goals
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for reminders" ON reminders
  FOR ALL USING (true) WITH CHECK (true);
```

## Step 6: Install Dependencies

Run:
```bash
npm install
```

This will install:
- `@supabase/supabase-js` - Supabase client library
- `react-native-url-polyfill` - Required for Supabase to work in React Native

## Step 7: Restart Expo

After configuring everything:

```bash
npm start
```

Then scan the QR code with Expo Go again.

## Step 8: Test the Connection

The app will automatically try to sync with Supabase if configured. Check the console logs for any errors.

## How It Works

The app uses a **hybrid storage approach**:

1. **Local Storage (AsyncStorage)**: Always used for immediate access and offline support
2. **Supabase**: Used for cloud sync when configured

The `StorageService` continues to work with AsyncStorage, while `SupabaseStorageService` handles cloud sync. You can integrate both in your store if needed.

## Optional: User Authentication

If you want to add user authentication later:

1. Enable authentication in Supabase dashboard
2. Add authentication UI to your app
3. Update RLS policies to use `auth.uid()`
4. Update the storage service to include `user_id` in queries

## Troubleshooting

### "Supabase URL and Anon Key are required" warning

- Make sure your `.env` file has the correct values
- Restart Expo after changing `.env`
- Check that variable names start with `EXPO_PUBLIC_` or are in `app.config.js`

### Database connection errors

- Verify your Supabase URL and key are correct
- Check that your Supabase project is active
- Ensure tables are created in the SQL Editor
- Check RLS policies allow the operations you need

### Data not syncing

- Check browser console or React Native debugger for errors
- Verify network connection
- Check Supabase dashboard logs for API errors

## Next Steps

1. ✅ Set up Supabase project
2. ✅ Configure environment variables
3. ✅ Create database tables
4. ✅ Install dependencies
5. 🔄 Test data sync
6. 🔄 (Optional) Add user authentication
7. 🔄 (Optional) Implement offline sync strategy


