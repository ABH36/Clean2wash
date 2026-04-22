const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const ServiceZone = require('../models/ServiceZone');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function seedZone() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Create a large zone covering Delhi area
        const delhiZone = {
            name: 'Delhi NCR Master Zone',
            displayName: 'Delhi NCR',
            code: 'DL01',
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [76.8, 28.4],
                    [77.3, 28.4],
                    [77.3, 28.8],
                    [76.8, 28.8],
                    [76.8, 28.4]
                ]]
            },
            center: {
                type: 'Point',
                coordinates: [77.2090, 28.6139]
            },
            status: 'active',
            services: {
                spareDriver: { enabled: true, minDrivers: 0, maxRadius: 50 },
                carWash: { enabled: true, minCaptains: 0 },
                apartmentWash: { enabled: true }
            },
            operationalHours: {
                enabled: false
            }
        };

        const existing = await ServiceZone.findOne({ code: 'DL01' });
        if (existing) {
            console.log('⚠️ Zone DL01 already exists. Updating...');
            await ServiceZone.updateOne({ code: 'DL01' }, delhiZone);
        } else {
            await ServiceZone.create(delhiZone);
            console.log('✅ Delhi Master Zone created');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

seedZone();
