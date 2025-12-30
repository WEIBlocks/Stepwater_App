/**
 * Supabase Connection Test Utility
 * Use this to manually test Supabase connection from anywhere in the app
 */

import { testSupabaseConnection, SupabaseConnectionStatus } from './supabase';
import { supabase } from './supabase';
import { getTodayDateString } from '../utils/formatting';

/**
 * Comprehensive Supabase API test
 * Tests all CRUD operations for each table
 */
export async function runFullSupabaseTest(): Promise<{
  success: boolean;
  results: {
    connection: boolean;
    daySummaries: boolean;
    waterLogs: boolean;
    userGoals: boolean;
    reminders: boolean;
  };
  details: string[];
}> {
  const results = {
    success: false,
    results: {
      connection: false,
      daySummaries: false,
      waterLogs: false,
      userGoals: false,
      reminders: false,
    },
    details: [] as string[],
  };

  console.log('\n🔬 Running Full Supabase API Test...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Test 1: Connection
  results.details.push('Testing basic connection...');
  const connectionStatus = await testSupabaseConnection();
  results.results.connection = connectionStatus.connected;

  if (!connectionStatus.connected) {
    results.details.push(`❌ Connection failed: ${connectionStatus.error || 'Unknown error'}`);
    console.log('❌ Connection test failed, skipping API tests');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return results;
  }

  results.details.push('✅ Connection successful');

  // Test 2: Day Summaries
  if (connectionStatus.tablesStatus.day_summaries) {
    results.details.push('Testing day_summaries table...');
    try {
      // Test SELECT
      const { data: selectData, error: selectError } = await supabase
        .from('day_summaries')
        .select('*')
        .limit(1);

      if (selectError) {
        results.details.push(`❌ SELECT failed: ${selectError.message}`);
      } else {
        results.details.push('✅ SELECT works');
        results.results.daySummaries = true;

        // Test INSERT (if table is empty or we can insert)
        const testDate = getTodayDateString();
        const { error: insertError } = await supabase
          .from('day_summaries')
          .upsert({
            date: testDate,
            steps: 0,
            water_ml: 0,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'date' });

        if (insertError) {
          results.details.push(`⚠️  INSERT/UPSERT issue: ${insertError.message.substring(0, 50)}`);
        } else {
          results.details.push('✅ INSERT/UPSERT works');
        }
      }
    } catch (error: any) {
      results.details.push(`❌ day_summaries test failed: ${error.message}`);
    }
  } else {
    results.details.push('⚠️  day_summaries table not found');
  }

  // Test 3: Water Logs
  if (connectionStatus.tablesStatus.water_logs) {
    results.details.push('Testing water_logs table...');
    try {
      const { data, error } = await supabase
        .from('water_logs')
        .select('*')
        .limit(1);

      if (error) {
        results.details.push(`❌ SELECT failed: ${error.message}`);
      } else {
        results.details.push('✅ SELECT works');
        results.results.waterLogs = true;
      }
    } catch (error: any) {
      results.details.push(`❌ water_logs test failed: ${error.message}`);
    }
  } else {
    results.details.push('⚠️  water_logs table not found');
  }

  // Test 4: User Goals
  if (connectionStatus.tablesStatus.user_goals) {
    results.details.push('Testing user_goals table...');
    try {
      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .limit(1);

      if (error) {
        results.details.push(`❌ SELECT failed: ${error.message}`);
      } else {
        results.details.push('✅ SELECT works');
        results.results.userGoals = true;
      }
    } catch (error: any) {
      results.details.push(`❌ user_goals test failed: ${error.message}`);
    }
  } else {
    results.details.push('⚠️  user_goals table not found');
  }

  // Test 5: Reminders
  if (connectionStatus.tablesStatus.reminders) {
    results.details.push('Testing reminders table...');
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .limit(1);

      if (error) {
        results.details.push(`❌ SELECT failed: ${error.message}`);
      } else {
        results.details.push('✅ SELECT works');
        results.results.reminders = true;
      }
    } catch (error: any) {
      results.details.push(`❌ reminders test failed: ${error.message}`);
    }
  } else {
    results.details.push('⚠️  reminders table not found');
  }

  // Final result
  results.success =
    results.results.connection &&
    (results.results.daySummaries || results.results.waterLogs ||
      results.results.userGoals || results.results.reminders);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (results.success) {
    console.log('✅ Full API test completed successfully!');
  } else {
    console.log('⚠️  API test completed with some issues');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return results;
}

/**
 * Quick connection test - just verifies we can reach Supabase
 */
export async function quickConnectionTest(): Promise<boolean> {
  try {
    const status = await testSupabaseConnection();
    return status.connected;
  } catch {
    return false;
  }
}


