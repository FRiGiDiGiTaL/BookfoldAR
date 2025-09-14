// test-supabase.js
const fetch = require('node-fetch');
global.fetch = fetch;
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing connection to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test basic connection
    console.log('🔍 Testing Supabase connection...');
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }
    
    console.log('✅ Connection successful!');
    console.log('📊 Users table exists and is accessible');
    console.log('📝 Data:', data);
    
    // Test all tables exist
    const tables = ['users', 'subscriptions', 'payments'];
    for (const table of tables) {
      const { error: tableError } = await supabase
        .from(table)
        .select('*')
        .limit(1);
        
      if (tableError) {
        console.error(`❌ Table '${table}' error:`, tableError.message);
      } else {
        console.log(`✅ Table '${table}' is accessible`);
      }
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testConnection();