/**
 * Duty Hours Cron Jobs
 * 
 * Automated tasks for Phase 2: Fatigue & Duty Control
 * 
 * Jobs:
 * 1. Daily Reset - Runs at midnight (00:00) every day
 * 2. Weekly Reset - Runs at midnight (00:00) every Monday
 * 3. Duty Status Update - Runs every hour
 * 4. Overwork Alerts - Runs every 30 minutes
 * 
 * Setup:
 * - Add to your main server.js file
 * - Or run as a separate process
 */

const cron = require('node-cron');
const SpareDriver = require('../models/SpareDriver');
const Notification = require('../models/Notification');

// ─── 1. DAILY RESET (Midnight) ───────────────────────────────────────

const dailyReset = cron.schedule('0 0 * * *', async () => {
    try {
        console.log('🌅 Running daily duty hours reset...');
        
        const drivers = await SpareDriver.find({});
        let resetCount = 0;
        
        for (const driver of drivers) {
            driver.resetDailyDutyHours();
            await driver.save();
            resetCount++;
        }
        
        console.log(`✅ Reset daily duty hours for ${resetCount} drivers`);
        
    } catch (error) {
        console.error('❌ Daily reset failed:', error);
    }
}, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Adjust to your timezone
});

// ─── 2. WEEKLY RESET (Monday Midnight) ───────────────────────────────

const weeklyReset = cron.schedule('0 0 * * 1', async () => {
    try {
        console.log('📅 Running weekly duty hours reset...');
        
        const drivers = await SpareDriver.find({});
        let resetCount = 0;
        
        for (const driver of drivers) {
            driver.resetWeeklyDutyHours();
            await driver.save();
            resetCount++;
        }
        
        console.log(`✅ Reset weekly duty hours for ${resetCount} drivers`);
        
    } catch (error) {
        console.error('❌ Weekly reset failed:', error);
    }
}, {
    scheduled: true,
    timezone: "Asia/Kolkata"
});

// ─── 3. DUTY STATUS UPDATE (Every Hour) ──────────────────────────────

const dutyStatusUpdate = cron.schedule('0 * * * *', async () => {
    try {
        console.log('🔄 Updating duty status for active drivers...');
        
        const drivers = await SpareDriver.find({ 
            status: 'ACTIVE',
            'onlineStatus.isOnline': true 
        });
        
        let updatedCount = 0;
        let blockedCount = 0;
        
        for (const driver of drivers) {
            const wasBlocked = !driver.dutyHours.status.canAcceptBookings;
            
            driver.updateDutyStatus();
            await driver.save();
            
            const isNowBlocked = !driver.dutyHours.status.canAcceptBookings;
            
            if (!wasBlocked && isNowBlocked) {
                blockedCount++;
            }
            
            updatedCount++;
        }
        
        console.log(`✅ Updated ${updatedCount} drivers (${blockedCount} newly blocked)`);
        
    } catch (error) {
        console.error('❌ Duty status update failed:', error);
    }
}, {
    scheduled: true,
    timezone: "Asia/Kolkata"
});

// ─── 4. OVERWORK ALERTS (Every 30 Minutes) ───────────────────────────

const overworkAlerts = cron.schedule('*/30 * * * *', async () => {
    try {
        console.log('⚠️  Checking for overworked drivers...');
        
        const drivers = await SpareDriver.find({
            status: 'ACTIVE',
            'onlineStatus.isOnline': true
        });
        
        let alertCount = 0;
        
        for (const driver of drivers) {
            const limits = driver.dutyHours.limits;
            const today = driver.dutyHours.today;
            
            // Check if approaching daily limit (80%)
            if (today.totalMinutes >= limits.dailyMaxMinutes * 0.8 && 
                today.totalMinutes < limits.dailyMaxMinutes) {
                
                // Check if alert already exists
                const existingAlert = driver.fatigueAlerts.find(alert => 
                    alert.type === 'OVERWORK_WARNING' &&
                    !alert.acknowledged &&
                    alert.triggeredAt > new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
                );
                
                if (!existingAlert) {
                    driver.addFatigueAlert(
                        'OVERWORK_WARNING',
                        today.totalMinutes,
                        `Approaching daily duty limit (${Math.floor(today.totalMinutes / 60)} hours worked)`
                    );
                    
                    await driver.save();
                    alertCount++;
                    
                    // Create admin notification
                    await Notification.create({
                        recipient: 'admin',
                        type: 'DRIVER_OVERWORK_WARNING',
                        title: 'Driver Overwork Warning',
                        message: `${driver.name} (${driver.driverId}) has worked ${Math.floor(today.totalMinutes / 60)} hours today`,
                        data: {
                            driverId: driver._id,
                            driverName: driver.name,
                            dutyMinutes: today.totalMinutes,
                            limitMinutes: limits.dailyMaxMinutes
                        }
                    });
                }
            }
        }
        
        if (alertCount > 0) {
            console.log(`⚠️  Created ${alertCount} overwork alerts`);
        } else {
            console.log('✅ No overwork alerts needed');
        }
        
    } catch (error) {
        console.error('❌ Overwork alerts check failed:', error);
    }
}, {
    scheduled: true,
    timezone: "Asia/Kolkata"
});

// ─── 5. BREAK REMINDER (Every 15 Minutes) ────────────────────────────

const breakReminder = cron.schedule('*/15 * * * *', async () => {
    try {
        console.log('☕ Checking for drivers needing breaks...');
        
        const drivers = await SpareDriver.find({
            status: 'ACTIVE',
            'onlineStatus.isOnline': true,
            'dutyHours.status.needsBreak': true
        });
        
        let reminderCount = 0;
        
        for (const driver of drivers) {
            // Create notification if not already sent recently
            const recentNotification = await Notification.findOne({
                recipient: driver._id,
                type: 'BREAK_REQUIRED',
                createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) }
            });
            
            if (!recentNotification) {
                await Notification.create({
                    recipient: driver._id,
                    recipientModel: 'SpareDriver',
                    type: 'BREAK_REQUIRED',
                    title: 'Mandatory Break Required',
                    message: `You have worked ${Math.floor(driver.breaks.currentContinuousWorkMinutes / 60)} hours continuously. Please take a ${driver.dutyHours.limits.minimumBreakMinutes} minute break.`,
                    priority: 'high'
                });
                
                reminderCount++;
            }
        }
        
        if (reminderCount > 0) {
            console.log(`☕ Sent ${reminderCount} break reminders`);
        }
        
    } catch (error) {
        console.error('❌ Break reminder check failed:', error);
    }
}, {
    scheduled: true,
    timezone: "Asia/Kolkata"
});

// ─── EXPORT CRON JOBS ────────────────────────────────────────────────

module.exports = {
    dailyReset,
    weeklyReset,
    dutyStatusUpdate,
    overworkAlerts,
    breakReminder,
    
    // Start all jobs
    startAll: () => {
        console.log('🚀 Starting all duty hours cron jobs...\n');
        
        dailyReset.start();
        console.log('✅ Daily Reset: Scheduled for 00:00 every day');
        
        weeklyReset.start();
        console.log('✅ Weekly Reset: Scheduled for 00:00 every Monday');
        
        dutyStatusUpdate.start();
        console.log('✅ Duty Status Update: Scheduled every hour');
        
        overworkAlerts.start();
        console.log('✅ Overwork Alerts: Scheduled every 30 minutes');
        
        breakReminder.start();
        console.log('✅ Break Reminders: Scheduled every 15 minutes');
        
        console.log('\n✨ All cron jobs started successfully!\n');
    },
    
    // Stop all jobs
    stopAll: () => {
        dailyReset.stop();
        weeklyReset.stop();
        dutyStatusUpdate.stop();
        overworkAlerts.stop();
        breakReminder.stop();
        console.log('🛑 All cron jobs stopped');
    }
};

// ─── AUTO-START IF RUN DIRECTLY ──────────────────────────────────────

if (require.main === module) {
    require('dotenv').config({ path: './Backend/.env' });
    const mongoose = require('mongoose');
    
    mongoose.connect(process.env.MONGO_URI)
        .then(() => {
            console.log('✅ Connected to MongoDB\n');
            module.exports.startAll();
        })
        .catch(err => {
            console.error('❌ MongoDB connection failed:', err);
            process.exit(1);
        });
}
