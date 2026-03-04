process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function testInsert() {
    console.log('--- Testing Insert into routes ---');

    // The schema expected by routeController.js:
    // route_name, route_number, source { name, coordinates }, destination { name, coordinates }, stops, distance, estimated_duration

    const testRoute = {
        route_name: 'Salem to Rasipuram',
        route_number: 'R' + Math.floor(Math.random() * 1000),
        source: {
            name: 'Salem',
            coordinates: [78.1460, 11.6643] // [lng, lat]
        },
        destination: {
            name: 'Rasipuram',
            coordinates: [78.1884, 11.4647]
        },
        stops: [
            { name: 'Mallur', coordinates: [78.1633, 11.5361], order: 1 }
        ],
        distance: 25.5,
        is_active: true
    };

    const { data, error } = await supabase
        .from('routes')
        .insert([testRoute])
        .select();

    if (error) {
        console.error('❌ Insert Failed:', error.message);
        console.error('Code:', error.code);
        console.error('Details:', error.details);
        console.error('Hint:', error.hint);
    } else {
        console.log('✅ Insert Successful!');
        console.log('Inserted Data:', data);
    }
}

testInsert();
