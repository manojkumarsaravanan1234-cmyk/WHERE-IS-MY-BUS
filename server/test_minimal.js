process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function testMinimalInsert() {
    console.log('--- Testing Minimal Insert into routes ---');

    const testRoute = {
        route_name: 'Minimal Route',
        route_number: 'MIN-' + Math.floor(Math.random() * 1000),
        source: { name: 'S', coordinates: [0, 0] },
        destination: { name: 'D', coordinates: [0, 0] },
        stops: [],
        distance: 0,
        is_active: true
    };

    const { data, error } = await supabase
        .from('routes')
        .insert([testRoute])
        .select();

    if (error) {
        console.error('❌ Insert Failed:', error.message);
        console.error('Code:', error.code);
    } else {
        console.log('✅ Insert Successful!');
        console.log('Inserted Data:', data);
    }
}

testMinimalInsert();
