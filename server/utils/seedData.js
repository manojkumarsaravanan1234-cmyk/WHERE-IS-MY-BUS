const mongoose = require('mongoose');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
require('dotenv').config();

/**
 * Seed database with sample routes and buses for testing
 * Run with: node utils/seedData.js
 */

const sampleRoutes = [
    {
        routeName: 'Chennai Central to Tambaram',
        routeNumber: '21G',
        source: {
            name: 'Chennai Central',
            coordinates: {
                type: 'Point',
                coordinates: [80.2707, 13.0827], // [lng, lat]
            },
        },
        destination: {
            name: 'Tambaram',
            coordinates: {
                type: 'Point',
                coordinates: [80.1275, 12.9249],
            },
        },
        stops: [
            {
                name: 'Egmore',
                coordinates: {
                    type: 'Point',
                    coordinates: [80.2609, 13.0732],
                },
                order: 0,
                estimatedTime: 5,
            },
            {
                name: 'T. Nagar',
                coordinates: {
                    type: 'Point',
                    coordinates: [80.2337, 13.0418],
                },
                order: 1,
                estimatedTime: 15,
            },
            {
                name: 'Saidapet',
                coordinates: {
                    type: 'Point',
                    coordinates: [80.2231, 13.0210],
                },
                order: 2,
                estimatedTime: 25,
            },
            {
                name: 'Guindy',
                coordinates: {
                    type: 'Point',
                    coordinates: [80.2206, 13.0067],
                },
                order: 3,
                estimatedTime: 35,
            },
        ],
        distance: 25,
        estimatedDuration: 60,
        isActive: true,
    },
    {
        routeName: 'Anna Nagar to Adyar',
        routeNumber: '27C',
        source: {
            name: 'Anna Nagar',
            coordinates: {
                type: 'Point',
                coordinates: [80.2090, 13.0878],
            },
        },
        destination: {
            name: 'Adyar',
            coordinates: {
                type: 'Point',
                coordinates: [80.2574, 13.0067],
            },
        },
        stops: [
            {
                name: 'Kilpauk',
                coordinates: {
                    type: 'Point',
                    coordinates: [80.2365, 13.0732],
                },
                order: 0,
                estimatedTime: 10,
            },
            {
                name: 'Kodambakkam',
                coordinates: {
                    type: 'Point',
                    coordinates: [80.2254, 13.0524],
                },
                order: 1,
                estimatedTime: 20,
            },
            {
                name: 'Nandanam',
                coordinates: {
                    type: 'Point',
                    coordinates: [80.2417, 13.0297],
                },
                order: 2,
                estimatedTime: 30,
            },
        ],
        distance: 18,
        estimatedDuration: 45,
        isActive: true,
    },
    {
        routeName: 'Koyambedu to OMR',
        routeNumber: '555',
        source: {
            name: 'Koyambedu',
            coordinates: {
                type: 'Point',
                coordinates: [80.1948, 13.0732],
            },
        },
        destination: {
            name: 'OMR Thoraipakkam',
            coordinates: {
                type: 'Point',
                coordinates: [80.2281, 12.9398],
            },
        },
        stops: [
            {
                name: 'Vadapalani',
                coordinates: {
                    type: 'Point',
                    coordinates: [80.2120, 13.0524],
                },
                order: 0,
                estimatedTime: 8,
            },
            {
                name: 'Ashok Nagar',
                coordinates: {
                    type: 'Point',
                    coordinates: [80.2093, 13.0358],
                },
                order: 1,
                estimatedTime: 15,
            },
            {
                name: 'Velachery',
                coordinates: {
                    type: 'Point',
                    coordinates: [80.2207, 12.9756],
                },
                order: 2,
                estimatedTime: 35,
            },
        ],
        distance: 22,
        estimatedDuration: 50,
        isActive: true,
    },
];

const sampleBuses = [
    {
        busNumber: 'TN21G1234',
        routeId: null, // Will be set after routes are created
        isActive: false,
    },
    {
        busNumber: 'TN27C5678',
        routeId: null,
        isActive: false,
    },
    {
        busNumber: 'TN5559876',
        routeId: null,
        isActive: false,
    },
];

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        await Route.deleteMany({});
        await Bus.deleteMany({});
        console.log('🧹 Cleared existing data');

        // Insert routes
        const createdRoutes = await Route.insertMany(sampleRoutes);
        console.log(`✅ Created ${createdRoutes.length} routes`);

        // Assign routes to buses
        sampleBuses[0].routeId = createdRoutes[0]._id;
        sampleBuses[1].routeId = createdRoutes[1]._id;
        sampleBuses[2].routeId = createdRoutes[2]._id;

        // Insert buses
        const createdBuses = await Bus.insertMany(sampleBuses);
        console.log(`✅ Created ${createdBuses.length} buses`);

        console.log('\n' + '='.repeat(50));
        console.log('📊 Database seeded successfully!');
        console.log('='.repeat(50));
        console.log('\n📍 Sample Routes:');
        createdRoutes.forEach((route) => {
            console.log(`  - ${route.routeNumber}: ${route.routeName}`);
        });
        console.log('\n🚌 Sample Buses:');
        createdBuses.forEach((bus) => {
            console.log(`  - ${bus.busNumber}`);
        });
        console.log('\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
