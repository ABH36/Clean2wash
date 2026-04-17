/**
 * Migration Script: Phase 2 - Fatigue & Duty Control
 * 
 * This script initializes Phase 2 fields for existing drivers:
 * - dutyHours (daily & weekly tracking)
 * - breaks (break management)
 * - fatigueAlerts (alert history)
 * 
 * Run this script ONCE after deploying Phase 2 changes.
 * 
 * Usage: node Backend/scripts/migratePhase2DutyControl.js
 */

require('dotenv').config({ path: './Backend/.env' });
const mongoose = require('mongoose');
const SpareDriver = require('../models/SpareDriver');

const migratePhase2 = async () => {
    try {
        console.log('🚀 Starting Phase 2 Migration: Fatigue & Duty Control\n');
        
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');
        
        // Find all drivers
        const drivers = await SpareDriver.find({});
        console.log(`📊 Found ${drivers.length} drivers to migrate\n`);
        
        let migratedCount = 0;
        let skippedCount = 0;
        
        for (const driver of drivers) {
            let needsUpdate = false;
            
            // Initialize duty hours
            if (!driver.dutyHours || !driver.dutyHours.today) {
                driver.dutyHours = {
                    today: {
                        totalMinutes: 0,
                        startTime: null,
                        endTime: null,
                        sessions: [],
                        lastReset: new Date()
                    },
                    weekly: {
                        totalMinutes: 0,
                        lastReset: new Date()
                    },
                    limits: {
                        dailyMaxMinutes: 600,      // 10 hours
                        weeklyMaxMinutes: 3600,    // 60 hours
                        mandatoryBreakAfterMinutes: 240,  // 4 hours
                        minimumBreakMinutes: 30    // 30 minutes
                    },
                    status: {
                        isOverworked: false,
                        needsBreak: false,
                        canAcceptBookings: true,
                        blockedReason: '',
                        blockedUntil: null
                    }
                };
                needsUpdate = true;
            }
            
            // Initialize breaks
            if (!driver.breaks || driver.breaks.totalBreaksToday === undefined) {
                driver.breaks = {
                    lastBreakTime: null,
                    lastBreakDuration: 0,
                    totalBreaksToday: 0,
                    currentContinuousWorkMinutes: 0
                };
                needsUpdate = true;
            }
            
            // Initialize fatigue alerts
            if (!driver.fatigueAlerts) {
                driver.fatigueAlerts = [];
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                await driver.save();
                migratedCount++;
                console.log(`✅ Migrated: ${driver.name} (${driver.driverId})`);
            } else {
                skippedCount++;
                console.log(`⏭️  Skipped: ${driver.name} (${driver.driverId}) - Already migrated`);
            }
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 MIGRATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Drivers: ${drivers.length}`);
        console.log(`✅ Migrated: ${migratedCount}`);
        console.log(`⏭️  Skipped: ${skippedCount}`);
        console.log('='.repeat(60));
        console.log('\n✨ Phase 2 Migration Complete!\n');
        
        // Verify migration
        console.log('🔍 Verifying migration...\n');
        
        const verifyDriver = await SpareDriver.findOne({}).select('name driverId dutyHours breaks fatigueAlerts');
        
        if (verifyDriver) {
            console.log('Sample Driver Data:');
            console.log('------------------');
            console.log(`Name: ${verifyDriver.name}`);
            console.log(`Driver ID: ${verifyDriver.driverId}`);
            console.log(`Duty Hours Initialized: ${!!verifyDriver.dutyHours}`);
            console.log(`Breaks Initialized: ${!!verifyDriver.breaks}`);
            console.log(`Fatigue Alerts Initialized: ${!!verifyDriver.fatigueAlerts}`);
            console.log(`Daily Limit: ${verifyDriver.dutyHours?.limits?.dailyMaxMinutes} minutes`);
            console.log(`Weekly Limit: ${verifyDriver.dutyHours?.limits?.weeklyMaxMinutes} minutes`);
            console.log('\n✅ Verification successful!\n');
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
};

// Run migration
migratePhase2();
