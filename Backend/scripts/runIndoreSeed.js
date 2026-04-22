#!/usr/bin/env node

/**
 * Indore Zone Seeder Runner
 * Run with: npm run seed:indore
 */

const { seedIndoreZones } = require('./seedIndoreZone');

console.log('🚀 Starting Indore Zone Seeder...\n');

seedIndoreZones()
    .then(() => {
        console.log('\n✅ Seeding completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Seeding failed:', error);
        process.exit(1);
    });