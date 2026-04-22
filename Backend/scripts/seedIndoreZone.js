const mongoose = require('mongoose');
const ServiceZone = require('../models/ServiceZone');
require('dotenv').config();

/**
 * Seed Indore Zone for Testing
 * Creates comprehensive zone coverage for Indore city
 */

const INDORE_ZONES = [
    {
        name: 'indore-central',
        displayName: 'Central Indore',
        code: 'IND001',
        status: 'active',
        
        // Central Indore boundary (covers Rajwada, Sarafa, Khajrana area + expanded south)
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [75.8577, 22.7096], // Southwest (expanded south from 22.7196 to 22.7096)
                [75.8577, 22.7396], // Northwest  
                [75.8777, 22.7396], // Northeast
                [75.8777, 22.7096], // Southeast (expanded south)
                [75.8577, 22.7096]  // Close polygon
            ]]
        },
        
        // Center point (Rajwada area)
        center: {
            type: 'Point',
            coordinates: [75.8677, 22.7296]
        },
        
        services: {
            spareDriver: {
                enabled: true,
                minDrivers: 10,
                maxRadius: 15
            },
            carWash: {
                enabled: true,
                minCaptains: 5
            },
            apartmentWash: {
                enabled: true
            }
        },
        
        metadata: {
            city: 'Indore',
            state: 'Madhya Pradesh',
            country: 'India',
            population: 500000,
            area: 25,
            timezone: 'Asia/Kolkata'
        },
        
        operationalHours: {
            enabled: false // 24/7 service
        },
        
        pricing: {
            baseFareMultiplier: 1.0,
            surgeEnabled: true,
            maxSurgeMultiplier: 2.5
        },
        
        restrictions: {
            minBookingAmount: 99,
            maxBookingAmount: 5000,
            requiresKYC: false,
            allowCashPayment: true
        },
        
        features: {
            realTimeTracking: true,
            scheduledBookings: true,
            instantBookings: true,
            multipleStops: true
        },
        
        priority: 10,
        displayOrder: 1,
        
        notes: 'Main commercial and residential area of Indore. High demand zone.'
    },
    
    {
        name: 'indore-vijay-nagar',
        displayName: 'Vijay Nagar',
        code: 'IND002',
        status: 'active',
        
        // Vijay Nagar area boundary
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [75.8777, 22.7196], // Southwest
                [75.8777, 22.7396], // Northwest
                [75.8977, 22.7396], // Northeast
                [75.8977, 22.7196], // Southeast
                [75.8777, 22.7196]  // Close polygon
            ]]
        },
        
        center: {
            type: 'Point',
            coordinates: [75.8877, 22.7296]
        },
        
        services: {
            spareDriver: {
                enabled: true,
                minDrivers: 8,
                maxRadius: 12
            },
            carWash: {
                enabled: true,
                minCaptains: 4
            },
            apartmentWash: {
                enabled: true
            }
        },
        
        metadata: {
            city: 'Indore',
            state: 'Madhya Pradesh',
            country: 'India',
            population: 300000,
            area: 20,
            timezone: 'Asia/Kolkata'
        },
        
        operationalHours: {
            enabled: false
        },
        
        pricing: {
            baseFareMultiplier: 1.0,
            surgeEnabled: true,
            maxSurgeMultiplier: 2.0
        },
        
        restrictions: {
            minBookingAmount: 99,
            maxBookingAmount: 5000,
            requiresKYC: false,
            allowCashPayment: true
        },
        
        features: {
            realTimeTracking: true,
            scheduledBookings: true,
            instantBookings: true,
            multipleStops: false
        },
        
        priority: 8,
        displayOrder: 2,
        
        notes: 'Residential and commercial hub. Good connectivity.'
    },
    
    {
        name: 'indore-airport',
        displayName: 'Airport Area',
        code: 'IND003',
        status: 'active',
        
        // Airport area boundary
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [75.8000, 22.7000], // Southwest
                [75.8000, 22.7200], // Northwest
                [75.8300, 22.7200], // Northeast
                [75.8300, 22.7000], // Southeast
                [75.8000, 22.7000]  // Close polygon
            ]]
        },
        
        center: {
            type: 'Point',
            coordinates: [75.8150, 22.7100]
        },
        
        services: {
            spareDriver: {
                enabled: true,
                minDrivers: 5,
                maxRadius: 20 // Larger radius for airport
            },
            carWash: {
                enabled: false // Limited car wash near airport
            },
            apartmentWash: {
                enabled: false
            }
        },
        
        metadata: {
            city: 'Indore',
            state: 'Madhya Pradesh',
            country: 'India',
            population: 50000,
            area: 15,
            timezone: 'Asia/Kolkata'
        },
        
        operationalHours: {
            enabled: false // 24/7 for airport
        },
        
        pricing: {
            baseFareMultiplier: 1.2, // Higher rates for airport
            surgeEnabled: true,
            maxSurgeMultiplier: 3.0
        },
        
        restrictions: {
            minBookingAmount: 149,
            maxBookingAmount: 8000,
            requiresKYC: false,
            allowCashPayment: true
        },
        
        features: {
            realTimeTracking: true,
            scheduledBookings: true,
            instantBookings: true,
            multipleStops: true
        },
        
        priority: 9,
        displayOrder: 3,
        
        notes: 'Airport pickup/drop zone. Premium pricing. 24/7 service.'
    },
    
    {
        name: 'indore-south',
        displayName: 'South Indore',
        code: 'IND004',
        status: 'coming_soon',
        
        // South Indore boundary (future expansion)
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [75.8577, 22.6996], // Southwest
                [75.8577, 22.7196], // Northwest
                [75.8977, 22.7196], // Northeast
                [75.8977, 22.6996], // Southeast
                [75.8577, 22.6996]  // Close polygon
            ]]
        },
        
        center: {
            type: 'Point',
            coordinates: [75.8777, 22.7096]
        },
        
        services: {
            spareDriver: {
                enabled: false, // Coming soon
                minDrivers: 6,
                maxRadius: 15
            },
            carWash: {
                enabled: false
            },
            apartmentWash: {
                enabled: false
            }
        },
        
        metadata: {
            city: 'Indore',
            state: 'Madhya Pradesh',
            country: 'India',
            population: 200000,
            area: 30,
            timezone: 'Asia/Kolkata'
        },
        
        operationalHours: {
            enabled: false
        },
        
        pricing: {
            baseFareMultiplier: 1.0,
            surgeEnabled: true,
            maxSurgeMultiplier: 2.0
        },
        
        restrictions: {
            minBookingAmount: 99,
            maxBookingAmount: 5000,
            requiresKYC: false,
            allowCashPayment: true
        },
        
        features: {
            realTimeTracking: true,
            scheduledBookings: true,
            instantBookings: true,
            multipleStops: false
        },
        
        priority: 5,
        displayOrder: 4,
        
        notes: 'Expansion zone. Services launching soon.'
    },
    
    {
        name: 'indore-east',
        displayName: 'East Indore',
        code: 'IND005',
        status: 'active',
        
        // East Indore boundary (covers user's coordinates area)
        geometry: {
            type: 'Polygon',
            coordinates: [[
                [75.8677, 22.7000], // Southwest
                [75.8677, 22.7200], // Northwest
                [75.8877, 22.7200], // Northeast
                [75.8877, 22.7000], // Southeast
                [75.8677, 22.7000]  // Close polygon
            ]]
        },
        
        center: {
            type: 'Point',
            coordinates: [75.8777, 22.7100]
        },
        
        services: {
            spareDriver: {
                enabled: true,
                minDrivers: 6,
                maxRadius: 15
            },
            carWash: {
                enabled: true,
                minCaptains: 3
            },
            apartmentWash: {
                enabled: true
            }
        },
        
        metadata: {
            city: 'Indore',
            state: 'Madhya Pradesh',
            country: 'India',
            population: 250000,
            area: 18,
            timezone: 'Asia/Kolkata'
        },
        
        operationalHours: {
            enabled: false
        },
        
        pricing: {
            baseFareMultiplier: 1.0,
            surgeEnabled: true,
            maxSurgeMultiplier: 2.0
        },
        
        restrictions: {
            minBookingAmount: 99,
            maxBookingAmount: 5000,
            requiresKYC: false,
            allowCashPayment: true
        },
        
        features: {
            realTimeTracking: true,
            scheduledBookings: true,
            instantBookings: true,
            multipleStops: false
        },
        
        priority: 7,
        displayOrder: 5,
        
        notes: 'East Indore residential area. Good connectivity to central areas.'
    }
];

const seedIndoreZones = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spare-driver-app');
        console.log('✅ Connected to MongoDB');

        // Clear existing Indore zones
        const deleteResult = await ServiceZone.deleteMany({
            'metadata.city': 'Indore'
        });
        console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing Indore zones`);

        // Insert new zones
        const insertedZones = await ServiceZone.insertMany(INDORE_ZONES);
        console.log(`✅ Created ${insertedZones.length} Indore zones:`);

        insertedZones.forEach(zone => {
            console.log(`   📍 ${zone.displayName} (${zone.code}) - ${zone.status}`);
        });

        // Create 2dsphere indexes if not exists
        await ServiceZone.collection.createIndex({ geometry: '2dsphere' });
        await ServiceZone.collection.createIndex({ center: '2dsphere' });
        console.log('✅ Geospatial indexes created');

        // Test zone detection for sample coordinates
        console.log('\n🧪 Testing zone detection:');
        
        const testPoints = [
            { name: 'Rajwada', lat: 22.7296, lng: 75.8677 },
            { name: 'Vijay Nagar', lat: 22.7296, lng: 75.8877 },
            { name: 'Airport', lat: 22.7100, lng: 75.8150 },
            { name: 'User Location', lat: 22.710810446128537, lng: 75.87098950251686 },
            { name: 'Outside Indore', lat: 22.8000, lng: 75.9000 }
        ];

        for (const point of testPoints) {
            const zone = await ServiceZone.findZoneByPoint(point.lng, point.lat);
            if (zone) {
                console.log(`   📍 ${point.name} → ${zone.displayName} (${zone.code})`);
            } else {
                console.log(`   ❌ ${point.name} → No zone found`);
            }
        }

        console.log('\n🎉 Indore zones seeded successfully!');
        console.log('\n📋 Zone Summary:');
        console.log('   • IND001 - Central Indore (Active) - All services');
        console.log('   • IND002 - Vijay Nagar (Active) - All services');
        console.log('   • IND003 - Airport Area (Active) - Spare Driver only');
        console.log('   • IND004 - South Indore (Coming Soon) - Future expansion');
        
        console.log('\n🔧 Admin Panel:');
        console.log('   • Go to Admin → Zone Management to view/edit zones');
        console.log('   • Test bookings in Central Indore area (22.7296, 75.8677)');
        console.log('   • Test driver location updates in these zones');

    } catch (error) {
        console.error('❌ Error seeding Indore zones:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
};

// Run the seeder
if (require.main === module) {
    seedIndoreZones();
}

module.exports = { seedIndoreZones, INDORE_ZONES };