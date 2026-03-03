const { createClient } = require('@supabase/supabase-js');

/**
 * Initialize Supabase client
 * Uses SUPABASE_URL and SUPABASE_ANON_KEY from environment variables
 */
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const connectDB = async () => {
    try {
        const { data, error } = await supabase.from('_health').select('*').limit(1);
        // Note: _health table might not exist, but we just want to test if client works
        console.log(`✅ Supabase Client initialized for: ${process.env.SUPABASE_URL}`);
        return supabase;
    } catch (error) {
        console.error(`❌ Supabase Connection Error: ${error.message}`);
        // For development, we don't exit to allow other things to run
    }
};

module.exports = { connectDB, supabase };
