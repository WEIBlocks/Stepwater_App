import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Get environment variables from multiple sources (Expo supports different ways)
const getEnvVar = (key: string): string => {
  // Try Constants first (from app.config.js)
  const fromConstants = Constants.expoConfig?.extra?.[key.replace('EXPO_PUBLIC_', '')];
  if (fromConstants) return fromConstants;
  
  // Try process.env (from .env file)
  const fromProcess = process.env[key];
  if (fromProcess) return fromProcess;
  
  return '';
};

const supabaseUrl = getEnvVar('EXPO_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY');

// Log configuration status
console.log('🔧 Supabase Configuration Check:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '❌ NOT SET');
console.log('🔑 Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : '❌ NOT SET');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase not fully configured. The app will work with local storage only.\n' +
    'To enable Supabase cloud sync:\n' +
    '1. Create a .env file in the project root\n' +
    '2. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY\n' +
    '3. Restart Expo server completely\n' +
    'See SUPABASE_SETUP.md for detailed instructions.'
  );
} else {
  console.log('✅ Supabase credentials found! Initializing client...');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    storage: undefined, // We'll use AsyncStorage instead
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Connection test function
export interface SupabaseConnectionStatus {
  connected: boolean;
  urlValid: boolean;
  keyValid: boolean;
  tablesStatus: {
    day_summaries: boolean;
    water_logs: boolean;
    user_goals: boolean;
    reminders: boolean;
  };
  error?: string;
}

/**
 * Test Supabase connection and verify all tables exist
 * This function can be called on app startup to verify connectivity
 */
export async function testSupabaseConnection(): Promise<SupabaseConnectionStatus> {
  const status: SupabaseConnectionStatus = {
    connected: false,
    urlValid: !!supabaseUrl && supabaseUrl.length > 0,
    keyValid: !!supabaseAnonKey && supabaseAnonKey.length > 0,
    tablesStatus: {
      day_summaries: false,
      water_logs: false,
      user_goals: false,
      reminders: false,
    },
  };

  console.log('\n🧪 Testing Supabase Connection...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Check if credentials are set
  if (!status.urlValid || !status.keyValid) {
    status.error = 'Missing Supabase credentials';
    console.log('❌ Connection Test Failed: Missing credentials');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return status;
  }

  try {
    // Test 1: Check if we can reach Supabase (test with a simple query)
    console.log('📡 Testing basic connection...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('day_summaries')
      .select('count', { count: 'exact', head: true });

    if (healthError) {
      // Check if it's a table missing error or connection error
      const errorCode = healthError.code || '';
      const errorMessage = healthError.message || '';
      
      if (errorCode === 'PGRST205' || errorMessage.includes('Could not find the table')) {
        status.error = 'Tables not created yet';
        console.log('⚠️  Connection works, but tables need to be created');
        console.log('💡 Run the SQL from SUPABASE_SETUP.md in your Supabase SQL Editor');
      } else {
        status.error = `Connection error: ${errorMessage}`;
        console.log('❌ Connection failed:', errorMessage);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      return status;
    }

    status.connected = true;
    console.log('✅ Basic connection successful!');

    // Test 2: Check each table individually
    console.log('\n📊 Testing table access...');
    
    const tables = [
      { name: 'day_summaries', key: 'day_summaries' as const },
      { name: 'water_logs', key: 'water_logs' as const },
      { name: 'user_goals', key: 'user_goals' as const },
      { name: 'reminders', key: 'reminders' as const },
    ];

    for (const table of tables) {
      try {
        const { error: tableError } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true });

        if (tableError) {
          const errorCode = tableError.code || '';
          const errorMessage = tableError.message || '';
          
          if (errorCode === 'PGRST205' || errorMessage.includes('Could not find the table')) {
            console.log(`   ❌ ${table.name}: Table not found`);
            status.tablesStatus[table.key] = false;
          } else {
            console.log(`   ⚠️  ${table.name}: Error - ${errorMessage.substring(0, 50)}`);
            status.tablesStatus[table.key] = false;
          }
        } else {
          console.log(`   ✅ ${table.name}: Accessible`);
          status.tablesStatus[table.key] = true;
        }
      } catch (error: any) {
        console.log(`   ❌ ${table.name}: ${error.message || 'Unknown error'}`);
        status.tablesStatus[table.key] = false;
      }
    }

    // Summary
    const tablesOk = Object.values(status.tablesStatus).every(v => v);
    if (tablesOk) {
      console.log('\n✅ All tables are accessible! Supabase is fully configured.');
      status.connected = true;
    } else {
      console.log('\n⚠️  Some tables are missing. Cloud sync will work partially.');
      console.log('💡 Create missing tables using SQL from SUPABASE_SETUP.md');
      status.connected = true; // Connection works, just tables missing
    }

  } catch (error: any) {
    status.error = error.message || 'Unknown error';
    console.log('❌ Connection test failed:', error.message);
    status.connected = false;
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  return status;
}

// Auto-test connection on module load (only if credentials are set)
if (supabaseUrl && supabaseAnonKey) {
  // Test connection asynchronously (don't block app startup)
  testSupabaseConnection().then((status) => {
    if (status.connected && Object.values(status.tablesStatus).every(v => v)) {
      console.log('🚀 Supabase ready! Cloud sync is enabled.');
    } else if (status.connected) {
      console.log('⚠️  Supabase connected but some tables are missing.');
      console.log('   App will work with local storage + partial cloud sync.');
    }
  }).catch(() => {
    // Silently fail - connection test shouldn't break the app
  });
}

// Database types (update these based on your Supabase schema)
export interface Database {
  public: {
    Tables: {
      day_summaries: {
        Row: {
          id: string;
          user_id?: string;
          date: string;
          steps: number;
          step_distance_meters?: number;
          calories?: number;
          water_ml: number;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          date: string;
          steps: number;
          step_distance_meters?: number;
          calories?: number;
          water_ml: number;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          steps?: number;
          step_distance_meters?: number;
          calories?: number;
          water_ml?: number;
          notes?: string;
          updated_at?: string;
        };
      };
      water_logs: {
        Row: {
          id: string;
          user_id?: string;
          date: string;
          time: string;
          amount_ml: number;
          created_at?: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          date: string;
          time: string;
          amount_ml: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          time?: string;
          amount_ml?: number;
        };
      };
      user_goals: {
        Row: {
          id: string;
          user_id?: string;
          daily_steps: number;
          daily_water_ml: number;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          daily_steps: number;
          daily_water_ml: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          daily_steps?: number;
          daily_water_ml?: number;
          updated_at?: string;
        };
      };
      reminders: {
        Row: {
          id: string;
          user_id?: string;
          time: string;
          enabled: boolean;
          days_of_week: number[];
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          time: string;
          enabled: boolean;
          days_of_week: number[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          time?: string;
          enabled?: boolean;
          days_of_week?: number[];
          updated_at?: string;
        };
      };
    };
  };
}

