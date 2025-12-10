/**
 * Supabase Verification Script
 * This script verifies that your Supabase connection is working
 * and that data can be saved and retrieved from the database.
 * 
 * Run with: node verify-supabase.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get credentials from environment
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n🔍 Supabase Verification Script');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Step 1: Check if credentials are loaded
console.log('📋 Step 1: Checking Environment Variables');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (!supabaseUrl) {
  console.error('❌ EXPO_PUBLIC_SUPABASE_URL is not set in .env file');
  process.exit(1);
}
if (!supabaseAnonKey) {
  console.error('❌ EXPO_PUBLIC_SUPABASE_ANON_KEY is not set in .env file');
  process.exit(1);
}
console.log('✅ URL:', supabaseUrl.substring(0, 30) + '...');
console.log('✅ Key:', supabaseAnonKey.substring(0, 20) + '...\n');

// Step 2: Create Supabase client
console.log('📡 Step 2: Creating Supabase Client');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('✅ Supabase client created\n');

// Step 3: Test connection and check tables
async function verifyConnection() {
  console.log('🧪 Step 3: Testing Database Connection');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const tables = ['day_summaries', 'water_logs', 'user_goals', 'reminders'];
  const tableStatus = {};
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
          console.log(`❌ ${table}: Table does not exist`);
          tableStatus[table] = false;
        } else {
          console.log(`⚠️  ${table}: Error - ${error.message.substring(0, 60)}`);
          tableStatus[table] = false;
        }
      } else {
        console.log(`✅ ${table}: Table exists and is accessible`);
        tableStatus[table] = true;
      }
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`);
      tableStatus[table] = false;
    }
  }
  
  console.log('');
  return tableStatus;
}

// Step 4: Test data insertion and retrieval
async function testDataOperations(tableStatus) {
  console.log('💾 Step 4: Testing Data Operations');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const today = new Date().toISOString().split('T')[0];
  const testResults = {};
  
  // Test day_summaries
  if (tableStatus.day_summaries) {
    try {
      console.log('Testing day_summaries...');
      
      // Insert/Update test data
      const { data: insertData, error: insertError } = await supabase
        .from('day_summaries')
        .upsert({
          date: today,
          steps: 5000,
          water_ml: 1500,
          step_distance_meters: 3810,
          calories: 200,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'date',
        });
      
      if (insertError) {
        console.log(`  ❌ Insert failed: ${insertError.message}`);
        testResults.day_summaries = false;
      } else {
        console.log('  ✅ Insert/Update successful');
        
        // Retrieve test data
        const { data: selectData, error: selectError } = await supabase
          .from('day_summaries')
          .select('*')
          .eq('date', today)
          .single();
        
        if (selectError) {
          console.log(`  ❌ Select failed: ${selectError.message}`);
          testResults.day_summaries = false;
        } else {
          console.log(`  ✅ Select successful - Found: ${selectData.steps} steps, ${selectData.water_ml}ml water`);
          testResults.day_summaries = true;
        }
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      testResults.day_summaries = false;
    }
  } else {
    console.log('⚠️  day_summaries table not available - skipping test');
    testResults.day_summaries = false;
  }
  
  // Test water_logs
  if (tableStatus.water_logs) {
    try {
      console.log('\nTesting water_logs...');
      
      const testId = 'test-' + Date.now();
      const { error: insertError } = await supabase
        .from('water_logs')
        .insert({
          id: testId,
          date: today,
          time: new Date().toISOString(),
          amount_ml: 250,
        });
      
      if (insertError) {
        console.log(`  ❌ Insert failed: ${insertError.message}`);
        testResults.water_logs = false;
      } else {
        console.log('  ✅ Insert successful');
        
        // Retrieve and delete test data
        const { data: selectData, error: selectError } = await supabase
          .from('water_logs')
          .select('*')
          .eq('id', testId)
          .single();
        
        if (selectError) {
          console.log(`  ❌ Select failed: ${selectError.message}`);
          testResults.water_logs = false;
        } else {
          console.log(`  ✅ Select successful - Found: ${selectData.amount_ml}ml`);
          
          // Clean up test data
          await supabase.from('water_logs').delete().eq('id', testId);
          console.log('  ✅ Test data cleaned up');
          testResults.water_logs = true;
        }
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      testResults.water_logs = false;
    }
  } else {
    console.log('\n⚠️  water_logs table not available - skipping test');
    testResults.water_logs = false;
  }
  
  // Test user_goals
  if (tableStatus.user_goals) {
    try {
      console.log('\nTesting user_goals...');
      
      const { error: upsertError } = await supabase
        .from('user_goals')
        .upsert({
          daily_steps: 10000,
          daily_water_ml: 2000,
          updated_at: new Date().toISOString(),
        });
      
      if (upsertError) {
        console.log(`  ❌ Upsert failed: ${upsertError.message}`);
        testResults.user_goals = false;
      } else {
        console.log('  ✅ Upsert successful');
        
        const { data: selectData, error: selectError } = await supabase
          .from('user_goals')
          .select('*')
          .limit(1)
          .single();
        
        if (selectError) {
          console.log(`  ❌ Select failed: ${selectError.message}`);
          testResults.user_goals = false;
        } else {
          console.log(`  ✅ Select successful - Goals: ${selectData.daily_steps} steps, ${selectData.daily_water_ml}ml`);
          testResults.user_goals = true;
        }
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      testResults.user_goals = false;
    }
  } else {
    console.log('\n⚠️  user_goals table not available - skipping test');
    testResults.user_goals = false;
  }
  
  console.log('');
  return testResults;
}

// Step 5: Check existing data
async function checkExistingData() {
  console.log('📊 Step 5: Checking Existing Data in Database');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const tables = ['day_summaries', 'water_logs', 'user_goals', 'reminders'];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        if (error.code === 'PGRST205') {
          console.log(`⚠️  ${table}: Table does not exist`);
        } else {
          console.log(`⚠️  ${table}: ${error.message.substring(0, 50)}`);
        }
      } else {
        console.log(`📋 ${table}: ${count || 0} records`);
        
        // Show sample data if available
        if (count > 0) {
          const { data, error: dataError } = await supabase
            .from(table)
            .select('*')
            .limit(3);
          
          if (!dataError && data && data.length > 0) {
            console.log(`   Sample data:`, JSON.stringify(data[0], null, 2).substring(0, 200) + '...');
          }
        }
      }
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`);
    }
  }
  
  console.log('');
}

// Main execution
async function main() {
  try {
    const tableStatus = await verifyConnection();
    const testResults = await testDataOperations(tableStatus);
    await checkExistingData();
    
    // Final summary
    console.log('📋 Final Summary');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const allTablesExist = Object.values(tableStatus).every(v => v);
    const allTestsPass = Object.values(testResults).every(v => v);
    
    if (allTablesExist && allTestsPass) {
      console.log('✅ SUCCESS: Supabase is fully configured and working!');
      console.log('   Your app should be able to save and retrieve data.');
    } else if (allTablesExist) {
      console.log('⚠️  PARTIAL: Tables exist but some operations failed.');
      console.log('   Check the error messages above for details.');
    } else {
      console.log('❌ ISSUES FOUND:');
      console.log('   1. Some tables are missing - run the SQL from SUPABASE_SETUP.md');
      console.log('   2. Check RLS policies if tables exist but operations fail');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();

