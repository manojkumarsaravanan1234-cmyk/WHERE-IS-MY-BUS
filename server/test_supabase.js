process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function checkSupabase() {
    console.log('--- Testing Supabase Connection ---');
    console.log('URL:', process.env.SUPABASE_URL);

    try {
        // 1. Check if we can reach Supabase
        const { data: routesData, error: routesError } = await supabase.from('routes').select('*').limit(1);
        if (routesError) {
            console.error('❌ Error selecting from routes table:', routesError.message);
            console.error('Error Code:', routesError.code);
            console.error('Error Details:', routesError.details);
            console.error('Error Hint:', routesError.hint);
        } else {
            console.log('✅ Successfully reached "routes" table.');
            console.log('Sample Row:', routesData);
        }

        const { data: busesData, error: busesError } = await supabase.from('buses').select('*').limit(1);
        if (busesError) {
            console.error('❌ Error selecting from buses table:', busesError.message);
        } else {
            console.log('✅ Successfully reached "buses" table.');
        }

        // 2. Try to describe the routes table structure (if possible via schema info or dummy insert)
        console.log('\n--- Attempting Test Insert into routes ---');
        const testRoute = {
            route_name: 'Test Route',
            route_number: 'TEST-' + Date.now(),
            source: { name: 'Source', coordinates: [0, 0] },
            destination: { name: 'Dest', coordinates: [1, 1] },
            stops: [],
            distance: 10,
            is_active: true
        };

        const { data: insertData, error: insertError } = await supabase
            .from('routes')
            .insert([testRoute])
            .select();

        if (insertError) {
            console.error('❌ Test Insert Failed:', insertError.message);
            console.error('Error Code:', insertError.code);
            console.error('Error Details:', insertError.details);
        } else {
            console.log('✅ Test Insert Successful!');
            console.log('Inserted Data:', insertData);

            // Cleanup
            const { error: deleteError } = await supabase.from('routes').delete().eq('id', insertData[0].id);
            if (deleteError) console.error('Error cleaning up test route:', deleteError.message);
        }

    } catch (err) {
        console.error('💥 Unexpected Error:', err);
    }
}

checkSupabase();
