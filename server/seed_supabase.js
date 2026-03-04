process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const sampleRoutes = [
    {
        route_name: 'Salem to Rasipuram',
        route_number: 'SR-01',
        source: {
            name: 'Salem Junction',
            coordinates: [78.1352, 11.6669],
        },
        destination: {
            name: 'Rasipuram Bus Stand',
            coordinates: [78.1785, 11.4537],
        },
        stops: [
            { name: 'Seelanaickenpatti', coordinates: [78.1634, 11.6241], order: 1 },
            { name: 'Mallur', coordinates: [78.1724, 11.5367], order: 2 }
        ],
        distance: 28.5,
        is_active: true,
    },
    {
        route_name: 'Chennai Central to Tambaram',
        route_number: '21G',
        source: {
            name: 'Chennai Central',
            coordinates: [80.2707, 13.0827],
        },
        destination: {
            name: 'Tambaram',
            coordinates: [80.1275, 12.9249],
        },
        stops: [
            { name: 'Egmore', coordinates: [80.2609, 13.0732], order: 1 },
            { name: 'T. Nagar', coordinates: [80.2337, 13.0418], order: 2 }
        ],
        distance: 25,
        is_active: true,
    }
];

const sampleBuses = [
    {
        bus_number: 'TN-30-AB-1234',
        is_active: false,
        driver_info: { name: 'Manoj', phone: '9876543210' }
    },
    {
        bus_number: 'TN-01-XY-5678',
        is_active: false,
        driver_info: { name: 'Kumar', phone: '9876543211' }
    }
];

async function seedSupabase() {
    try {
        console.log('🚀 Starting Supabase Seeding...');

        // 1. Clear existing data (optional, but good for a fresh start)
        // Wait, we should probably not delete everything if they have real data
        // But for "seed", usually we do.
        const { error: delBusesErr } = await supabase.from('buses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { error: delRoutesErr } = await supabase.from('routes').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        if (delBusesErr) console.warn('Note: Could not clear buses:', delBusesErr.message);
        if (delRoutesErr) console.warn('Note: Could not clear routes:', delRoutesErr.message);

        // 2. Insert routes
        const { data: createdRoutes, error: routesErr } = await supabase
            .from('routes')
            .insert(sampleRoutes)
            .select();

        if (routesErr) throw routesErr;
        console.log(`✅ Seeded ${createdRoutes.length} routes.`);

        // 3. Insert buses and link some
        const busesToInsert = sampleBuses.map((bus, index) => ({
            ...bus,
            route_id: createdRoutes[index % createdRoutes.length].id
        }));

        const { data: createdBuses, error: busesErr } = await supabase
            .from('buses')
            .insert(busesToInsert)
            .select();

        if (busesErr) throw busesErr;
        console.log(`✅ Seeded ${createdBuses.length} buses.`);

        console.log('\n✨ Supabase Seeding Complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
}

seedSupabase();
