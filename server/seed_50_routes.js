process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Coordinates for some major places in Tamil Nadu
const locations = {
    'Chennai Central': [80.2707, 13.0827],
    'Coimbatore': [76.9616, 11.0168],
    'Madurai': [78.1460, 9.9252],
    'Trichy': [78.6928, 10.8050],
    'Salem': [78.1460, 11.6643],
    'Tirunelveli': [77.7345, 8.7139],
    'Erode': [77.7172, 11.3410],
    'Vellore': [79.1325, 12.9165],
    'Thoothukudi': [78.1348, 8.7642],
    'Dindigul': [77.9803, 10.3673],
    'Thanjavur': [79.1311, 10.7816],
    'Karur': [78.0776, 10.9601],
    'Hosur': [77.8253, 12.7409],
    'Nagercoil': [77.4323, 8.1833],
    'Kanchipuram': [79.7036, 12.8342],
    'Cuddalore': [79.7645, 11.7480],
    'Tiruvannamalai': [79.0664, 12.2253],
    'Namakkal': [78.1652, 11.2189],
    'Dharmapuri': [78.1578, 12.1211],
    'Krishnagiri': [78.2140, 12.5186],
    'Villupuram': [79.4861, 11.9401]
};

// Generate 50 manual-like routes
const routePairs = [
    ['Namakkal', 'Salem', 'NS-01', 'TN-28-AB-1001'],
    ['Salem', 'Namakkal', 'SN-02', 'TN-30-BC-2002'],
    ['Chennai Central', 'Coimbatore', 'CC-01', 'TN-01-CD-3003'],
    ['Coimbatore', 'Chennai Central', 'CC-02', 'TN-38-EF-4004'],
    ['Madurai', 'Trichy', 'MT-01', 'TN-59-GH-5005'],
    ['Trichy', 'Madurai', 'TM-02', 'TN-45-IJ-6006'],
    ['Salem', 'Erode', 'SE-01', 'TN-30-KL-7007'],
    ['Erode', 'Salem', 'ES-02', 'TN-33-MN-8008'],
    ['Chennai Central', 'Madurai', 'CM-01', 'TN-01-OP-9009'],
    ['Madurai', 'Chennai Central', 'MC-02', 'TN-59-QR-1010'],
    ['Trichy', 'Chennai Central', 'TC-01', 'TN-45-ST-1111'],
    ['Chennai Central', 'Trichy', 'CT-02', 'TN-01-UV-1212'],
    ['Tirunelveli', 'Madurai', 'TM-03', 'TN-72-WX-1313'],
    ['Madurai', 'Tirunelveli', 'MT-04', 'TN-59-YZ-1414'],
    ['Vellore', 'Chennai Central', 'VC-01', 'TN-23-AB-1515'],
    ['Chennai Central', 'Vellore', 'CV-02', 'TN-01-CD-1616'],
    ['Thoothukudi', 'Madurai', 'TM-05', 'TN-69-EF-1717'],
    ['Madurai', 'Thoothukudi', 'MT-06', 'TN-59-GH-1818'],
    ['Dindigul', 'Madurai', 'DM-01', 'TN-57-IJ-1919'],
    ['Madurai', 'Dindigul', 'MD-02', 'TN-59-KL-2020'],
    ['Thanjavur', 'Trichy', 'TT-01', 'TN-49-MN-2121'],
    ['Trichy', 'Thanjavur', 'TT-02', 'TN-45-OP-2222'],
    ['Karur', 'Trichy', 'KT-01', 'TN-47-QR-2323'],
    ['Trichy', 'Karur', 'TK-02', 'TN-45-ST-2424'],
    ['Hosur', 'Salem', 'HS-01', 'TN-70-UV-2525'],
    ['Salem', 'Hosur', 'SH-02', 'TN-30-WX-2626'],
    ['Nagercoil', 'Tirunelveli', 'NT-01', 'TN-74-YZ-2727'],
    ['Tirunelveli', 'Nagercoil', 'TN-02', 'TN-72-AB-2828'],
    ['Kanchipuram', 'Chennai Central', 'KC-01', 'TN-21-CD-2929'],
    ['Chennai Central', 'Kanchipuram', 'CK-02', 'TN-01-EF-3030'],
    ['Cuddalore', 'Villupuram', 'CV-03', 'TN-31-GH-3131'],
    ['Villupuram', 'Cuddalore', 'VC-04', 'TN-32-IJ-3232'],
    ['Tiruvannamalai', 'Vellore', 'TV-01', 'TN-25-KL-3333'],
    ['Vellore', 'Tiruvannamalai', 'VT-02', 'TN-23-MN-3434'],
    ['Dharmapuri', 'Salem', 'DS-01', 'TN-29-OP-3535'],
    ['Salem', 'Dharmapuri', 'SD-02', 'TN-30-QR-3636'],
    ['Krishnagiri', 'Hosur', 'KH-01', 'TN-24-ST-3737'],
    ['Hosur', 'Krishnagiri', 'HK-02', 'TN-70-UV-3838'],
    ['Namakkal', 'Karur', 'NK-01', 'TN-28-WX-3939'],
    ['Karur', 'Namakkal', 'KN-02', 'TN-47-YZ-4040'],
    ['Coimbatore', 'Salem', 'CS-01', 'TN-38-AB-4141'],
    ['Salem', 'Coimbatore', 'SC-02', 'TN-30-CD-4242'],
    ['Madurai', 'Coimbatore', 'MC-03', 'TN-59-EF-4343'],
    ['Coimbatore', 'Madurai', 'CM-04', 'TN-38-GH-4444'],
    ['Trichy', 'Coimbatore', 'TC-03', 'TN-45-IJ-4545'],
    ['Coimbatore', 'Trichy', 'CT-04', 'TN-38-KL-4646'],
    ['Salem', 'Trichy', 'ST-01', 'TN-30-MN-4747'],
    ['Trichy', 'Salem', 'TS-02', 'TN-45-OP-4848'],
    ['Chennai Central', 'Salem', 'CS-03', 'TN-01-QR-4949'],
    ['Salem', 'Chennai Central', 'SC-04', 'TN-30-ST-5050']
];

const sampleRoutes = routePairs.map(([sourceName, destName, routeNumber], index) => {
    return {
        route_name: `${sourceName} to ${destName}`,
        route_number: routeNumber,
        source: {
            name: `${sourceName} Bus Stand`,
            coordinates: locations[sourceName],
        },
        destination: {
            name: `${destName} Bus Stand`,
            coordinates: locations[destName],
        },
        stops: [], // Empty for now, as admin will add it manually later
        distance: Math.floor(Math.random() * 200) + 50, // Mock distance
        is_active: true,
    };
});

const sampleBuses = routePairs.map(([, , , busNumber]) => {
    return {
        bus_number: busNumber,
        is_active: false,
        driver_info: { name: 'Admin Generated', phone: '9999999999' }
    };
});

async function seedSupabase() {
    try {
        console.log('🚀 Starting 50 Default Routes Seeding...');

        // 1. (Skipped) Clear existing data
        // We won't delete existing data to simulate an admin just adding new places manually
        // const { error: delBusesErr } = await supabase.from('buses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        // const { error: delRoutesErr } = await supabase.from('routes').delete().neq('id', '00000000-0000-0000-0000-000000000000');


        // if (delBusesErr) console.warn('Note: Could not clear buses:', delBusesErr.message);
        // if (delRoutesErr) console.warn('Note: Could not clear routes:', delRoutesErr.message);

        // 2. Insert routes
        const { data: createdRoutes, error: routesErr } = await supabase
            .from('routes')
            .insert(sampleRoutes)
            .select();

        if (routesErr) throw routesErr;
        console.log(`✅ Seeded ${createdRoutes.length} routes.`);

        // 3. Insert buses and link to routes
        const busesToInsert = sampleBuses.map((bus, index) => ({
            ...bus,
            route_id: createdRoutes[index].id
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
