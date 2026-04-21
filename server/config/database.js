const { createClient } = require('@supabase/supabase-js');

/**
 * Initialize Supabase clients
 * - supabase: Public client with ANON_KEY (subject to RLS)
 * - supabaseAdmin: Admin client with SERVICE_ROLE_KEY (bypasses RLS)
 */
if (process.env.NODE_ENV === 'development') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Admin client for bypass RLS on server-side ops
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY // Fallback to anon if secret role not provided
);

const connectDB = async () => {
    try {
        const { data, error } = await supabase.from('_health').select('*').limit(1);
        console.log(`✅ Supabase Clients initialized for: ${process.env.SUPABASE_URL}`);
        return { supabase, supabaseAdmin };
    } catch (error) {
        console.error(`❌ Supabase Connection Error: ${error.message}`);
    }
};

module.exports = { connectDB, supabase, supabaseAdmin };
