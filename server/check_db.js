process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function checkUsersTable() {
    try {
        console.log('🔍 Checking for users table...');
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .limit(1);

        if (error) {
            console.error('❌ Error accessing users table:', error.message);
            console.error('Error Code:', error.code);
            console.log('Attempting to check if table existence is the issue...');

            if (error.code === '42P01') {
                console.log('❗ TABLE DOES NOT EXIST: The "users" table is missing in Supabase.');
            }
        } else {
            console.log('✅ Users table exists and is accessible.');
            console.log('Sample data:', data);
        }
    } catch (err) {
        console.error('💥 Unexpected error:', err.message);
    }
}

checkUsersTable();
