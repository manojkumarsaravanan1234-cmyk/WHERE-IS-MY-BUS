process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function findColumns() {
    const routeCols = [
        'estimated_duration',
        'estimatedDuration',
        'estimated_time',
        'estimatedTime',
        'duration',
        'route_name',
        'routeName',
        'route_number',
        'routeNumber',
        'is_active',
        'isActive',
        'distance',
        'source',
        'destination',
        'stops'
    ];

    console.log(`Checking columns for table: routes`);
    for (const col of routeCols) {
        const { error } = await supabase.from('routes').select(col).limit(1);
        if (error) {
            console.log(`❌ ${col}: ${error.message} (${error.code})`);
        } else {
            console.log(`✅ ${col}: Exists`);
        }
    }

    const busCols = [
        'bus_number',
        'route_id',
        'is_active',
        'current_location',
        'speed',
        'heading',
        'last_updated',
        'driver_info'
    ];

    console.log(`\nChecking columns for table: buses`);
    for (const col of busCols) {
        const { error } = await supabase.from('buses').select(col).limit(1);
        if (error) {
            console.log(`❌ ${col}: ${error.message} (${error.code})`);
        } else {
            console.log(`✅ ${col}: Exists`);
        }
    }
}

findColumns();
