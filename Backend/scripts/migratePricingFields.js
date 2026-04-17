const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const SpareDriver = require('../models/SpareDriver');
require('dotenv').config();

/**
 * PRICING FIELDS MIGRATION SCRIPT
 * 
 * This script migrates existing data to support new pricing engine fields:
 * 1. Adds missing pricing fields to bookings (subtotal, gstAmount, finalAmount, etc.)
 * 2. Adds wallet hold fields to spare drivers (holdAmount, availableBalance)
 * 3. Extracts GST from breakdown array to dedicated field
 */

async function migrate() {
    try {
        console.log('🔄 Starting pricing fields migration...\n');
        
        await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
        console.log('✅ Connected to database\n');
        
        // ─────────────────────────────────────────────────────────────
        // PART 1: Migrate Booking Pricing Fields
        // ─────────────────────────────────────────────────────────────
        
        console.log('📦 Migrating booking pricing fields...');
        
        const bookings = await Booking.find({});
        let bookingsUpdated = 0;
        let bookingsSkipped = 0;
        
        for (const booking of bookings) {
            let needsUpdate = false;
            
            // Add subtotal (same as totalAmount if missing)
            if (typeof booking.pricing.subtotal === 'undefined') {
                booking.pricing.subtotal = booking.pricing.totalAmount || 0;
                needsUpdate = true;
            }
            
            // Add finalAmount (same as totalAmount if missing)
            if (typeof booking.pricing.finalAmount === 'undefined') {
                booking.pricing.finalAmount = booking.pricing.totalAmount || 0;
                needsUpdate = true;
            }
            
            // Extract GST from breakdown if exists
            if (typeof booking.pricing.gstAmount === 'undefined' && booking.pricing.breakdown) {
                const gstItem = booking.pricing.breakdown.find(item => 
                    item.type === 'tax' || 
                    item.name?.toLowerCase().includes('gst') ||
                    item.description?.toLowerCase().includes('gst')
                );
                
                if (gstItem) {
                    booking.pricing.gstAmount = gstItem.amount || 0;
                    
                    // Try to extract GST percentage from name
                    const percentMatch = gstItem.name?.match(/(\d+)%/);
                    booking.pricing.gstPercent = percentMatch ? parseInt(percentMatch[1]) : 18;
                    
                    needsUpdate = true;
                } else {
                    // No GST found, set to 0
                    booking.pricing.gstAmount = 0;
                    booking.pricing.gstPercent = 0;
                    needsUpdate = true;
                }
            }
            
            // Add platformCommission (from payment if exists)
            if (typeof booking.pricing.platformCommission === 'undefined') {
                booking.pricing.platformCommission = booking.payment?.platformCommissionAmount || 0;
                needsUpdate = true;
            }
            
            // Add driverEarning (from payment if exists)
            if (typeof booking.pricing.driverEarning === 'undefined') {
                booking.pricing.driverEarning = booking.payment?.providerPayoutAmount || 0;
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                await booking.save();
                bookingsUpdated++;
                
                if (bookingsUpdated % 100 === 0) {
                    console.log(`   Processed ${bookingsUpdated} bookings...`);
                }
            } else {
                bookingsSkipped++;
            }
        }
        
        console.log(`✅ Bookings migration complete:`);
        console.log(`   - Updated: ${bookingsUpdated}`);
        console.log(`   - Skipped: ${bookingsSkipped}`);
        console.log(`   - Total: ${bookings.length}\n`);
        
        // ─────────────────────────────────────────────────────────────
        // PART 2: Migrate Spare Driver Wallet Fields
        // ─────────────────────────────────────────────────────────────
        
        console.log('👤 Migrating spare driver wallet fields...');
        
        const drivers = await SpareDriver.find({});
        let driversUpdated = 0;
        let driversSkipped = 0;
        
        for (const driver of drivers) {
            let needsUpdate = false;
            
            // Ensure wallet object exists
            if (!driver.wallet) {
                driver.wallet = {
                    balance: 0,
                    holdAmount: 0,
                    availableBalance: 0
                };
                needsUpdate = true;
            } else {
                // Add holdAmount if missing
                if (typeof driver.wallet.holdAmount === 'undefined') {
                    driver.wallet.holdAmount = 0;
                    needsUpdate = true;
                }
                
                // Add availableBalance if missing
                if (typeof driver.wallet.availableBalance === 'undefined') {
                    driver.wallet.availableBalance = driver.wallet.balance || 0;
                    needsUpdate = true;
                }
                
                // Recalculate availableBalance
                const currentBalance = driver.wallet.balance || 0;
                const currentHold = driver.wallet.holdAmount || 0;
                const calculatedAvailable = currentBalance - currentHold;
                
                if (driver.wallet.availableBalance !== calculatedAvailable) {
                    driver.wallet.availableBalance = calculatedAvailable;
                    needsUpdate = true;
                }
            }
            
            if (needsUpdate) {
                await driver.save();
                driversUpdated++;
            } else {
                driversSkipped++;
            }
        }
        
        console.log(`✅ Drivers migration complete:`);
        console.log(`   - Updated: ${driversUpdated}`);
        console.log(`   - Skipped: ${driversSkipped}`);
        console.log(`   - Total: ${drivers.length}\n`);
        
        // ─────────────────────────────────────────────────────────────
        // PART 3: Summary & Statistics
        // ─────────────────────────────────────────────────────────────
        
        console.log('📊 Migration Statistics:\n');
        
        // Count bookings with GST
        const bookingsWithGST = await Booking.countDocuments({ 
            'pricing.gstAmount': { $gt: 0 } 
        });
        console.log(`   Bookings with GST: ${bookingsWithGST}`);
        
        // Count spare driver bookings
        const spareDriverBookings = await Booking.countDocuments({ 
            'service.type': 'sparedriver' 
        });
        console.log(`   Spare Driver Bookings: ${spareDriverBookings}`);
        
        // Count drivers with wallet
        const driversWithWallet = await SpareDriver.countDocuments({ 
            'wallet.balance': { $exists: true } 
        });
        console.log(`   Drivers with Wallet: ${driversWithWallet}`);
        
        // Total wallet balance
        const walletStats = await SpareDriver.aggregate([
            { $match: { 'wallet.balance': { $exists: true } } },
            { 
                $group: { 
                    _id: null, 
                    totalBalance: { $sum: '$wallet.balance' },
                    totalHold: { $sum: '$wallet.holdAmount' },
                    avgBalance: { $avg: '$wallet.balance' }
                } 
            }
        ]);
        
        if (walletStats.length > 0) {
            console.log(`   Total Wallet Balance: ₹${walletStats[0].totalBalance.toFixed(2)}`);
            console.log(`   Total Hold Amount: ₹${walletStats[0].totalHold.toFixed(2)}`);
            console.log(`   Average Balance: ₹${walletStats[0].avgBalance.toFixed(2)}`);
        }
        
        console.log('\n✅ Migration completed successfully!');
        console.log('🎉 All pricing fields have been migrated.\n');
        
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        console.error('\nStack trace:', error.stack);
        process.exit(1);
    }
}

// Run migration
migrate();
