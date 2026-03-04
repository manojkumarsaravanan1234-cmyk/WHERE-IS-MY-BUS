process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function checkSupabase() {
    console.log('--- Testing Supabase Connection (SSL Disabled) ---');
    console.log('URL:', process.env.SUPABASE_URL);

    try {
        const { data, error } = await supabase.from('routes').select('*').limit(1);
        if (error) {
            console.error('❌ Error selecting from routes table:', error.message);
            console.error('Error Code:', error.code);
        } else {
            console.log('✅ Successfully reached "routes" table.');
            console.log('Sample Row:', data);
        }

        const { data: bData, error: bError } = await supabase.from('buses').select('*').limit(1);
        if (bError) {
            console.error('❌ Error selecting from buses table:', bError.message);
        } else {
            console.log('✅ Successfully reached "buses" table.');
        }

    } catch (err) {
        console.error('💥 Unexpected Error:', err);
    }
}

checkSupabase();
