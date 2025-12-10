-- ============================================================================
-- Complete Supabase Database Setup Script
-- ============================================================================
-- This script creates all tables, indexes, and RLS policies for the Step & Water app
-- Run this in your Supabase SQL Editor (one complete script)
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Tables
-- ============================================================================

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

-- ============================================================================
-- STEP 2: Create Indexes for Better Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_day_summaries_date ON day_summaries(date);
CREATE INDEX IF NOT EXISTS idx_day_summaries_user_id ON day_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_water_logs_date ON water_logs(date);
CREATE INDEX IF NOT EXISTS idx_water_logs_user_id ON water_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);

-- ============================================================================
-- STEP 3: Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE day_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Drop Existing Policies (if any) to Avoid Conflicts
-- ============================================================================

DROP POLICY IF EXISTS "Allow all operations for day_summaries" ON day_summaries;
DROP POLICY IF EXISTS "Allow all operations for water_logs" ON water_logs;
DROP POLICY IF EXISTS "Allow all operations for user_goals" ON user_goals;
DROP POLICY IF EXISTS "Allow all operations for reminders" ON reminders;

-- ============================================================================
-- STEP 5: Create RLS Policies for Anonymous Access
-- ============================================================================
-- These policies allow all operations (SELECT, INSERT, UPDATE, DELETE) for anonymous users
-- This is for development/testing - in production, you should restrict based on user_id
-- ============================================================================

-- Day Summaries Policy
CREATE POLICY "Allow all operations for day_summaries" 
  ON day_summaries
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Water Logs Policy
CREATE POLICY "Allow all operations for water_logs" 
  ON water_logs
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- User Goals Policy
CREATE POLICY "Allow all operations for user_goals" 
  ON user_goals
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Reminders Policy
CREATE POLICY "Allow all operations for reminders" 
  ON reminders
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- ============================================================================
-- STEP 6: Verify Setup
-- ============================================================================

-- Check that all tables were created
SELECT 
  'Tables Created' as status,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('day_summaries', 'water_logs', 'user_goals', 'reminders')
ORDER BY table_name;

-- Check that RLS is enabled
SELECT 
  'RLS Status' as status,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('day_summaries', 'water_logs', 'user_goals', 'reminders')
ORDER BY tablename;

-- Check that policies were created
SELECT 
  'Policies Created' as status,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('day_summaries', 'water_logs', 'user_goals', 'reminders')
ORDER BY tablename, policyname;

-- ============================================================================
-- Setup Complete!
-- ============================================================================
-- Your database is now ready. You can:
-- 1. Run: node verify-supabase.js (to test the connection)
-- 2. Use your app - data will automatically sync to Supabase
-- 3. Check Supabase Table Editor to see data appearing
-- ============================================================================

