process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function checkRoutes() {
    try {
        console.log('🔍 Checking routes...');
        const { data, error } = await supabase
            .from('routes')
            .select('*');

        if (error) {
            console.error('❌ Error:', error.message);
        } else {
            console.log(`✅ Found ${data.length} routes.`);
            data.forEach(r => {
                console.log(`Route: ${r.route_name} (${r.route_number}), Stops: ${JSON.stringify(r.stops)}`);
            });
        }
    } catch (err) {
        console.error('💥 Error:', err.message);
    }
}

checkRoutes();
