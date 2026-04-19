const cron = require('node-cron');
const DriverPayout = require('../models/DriverPayout');
const SpareDriver = require('../models/SpareDriver');
const Booking = require('../models/Booking');
const Penalty = require('../models/Penalty');
const { sendSpareDriverNotification: sendNotification, sendAdminNotification } = require('../utils/notificationService');

/**
 * PAYOUT AUTOMATION SERVICE
 * Automatically generates and processes weekly payouts for drivers
 */

class PayoutAutomationService {
    
    /**
     * Initialize cron jobs for payout automation
     */
    static initialize() {
        // Run every Monday at 00:00 (midnight)
        cron.schedule('0 0 * * 1', async () => {
            console.log('🔄 [Payout Automation] Starting weekly payout generation...');
            await this.generateWeeklyPayouts();
        });
        
        // Run every day at 10:00 AM to send payout reminders
        cron.schedule('0 10 * * *', async () => {
            console.log('🔔 [Payout Automation] Sending payout reminders...');
            await this.sendPayoutReminders();
        });
        
        console.log('✅ [Payout Automation] Cron jobs initialized');
    }
    
    /**
     * Generate weekly payouts for all active drivers
     */
    static async generateWeeklyPayouts() {
        try {
            // Get last week's date range
            const today = new Date();
            const lastMonday = new Date(today);
            lastMonday.setDate(today.getDate() - 7);
            lastMonday.setHours(0, 0, 0, 0);
            
            const lastSunday = new Date(lastMonday);
            lastSunday.setDate(lastMonday.getDate() + 6);
            lastSunday.setHours(23, 59, 59, 999);
            
            console.log(`📅 Generating payouts for: ${lastMonday.toDateString()} to ${lastSunday.toDateString()}`);
            
            // Get all active drivers
            const drivers = await SpareDriver.find({
                status: 'ACTIVE',
                verificationStatus: 'APPROVED'
            }).select('_id name phone');
            
            console.log(`👥 Found ${drivers.length} active drivers`);
            
            const results = {
                success: [],
                failed: [],
                skipped: []
            };
            
            for (const driver of drivers) {
                try {
                    // Check if payout already exists for this period
                    const existingPayout = await DriverPayout.findOne({
                        driver: driver._id,
                        'payoutPeriod.start': lastMonday,
                        'payoutPeriod.end': lastSunday
                    });
                    
                    if (existingPayout) {
                        console.log(`⏭️  Skipping ${driver.name} - Payout already exists`);
                        results.skipped.push({
                            driverId: driver._id,
                            name: driver.name,
                            reason: 'Payout already exists'
                        });
                        continue;
                    }
                    
                    // Get completed bookings for the period
                    const bookings = await Booking.find({
                        'provider.id': driver._id,
                        'service.type': 'sparedriver',
                        status: 'completed',
                        completedAt: {
                            $gte: lastMonday,
                            $lte: lastSunday
                        }
                    });
                    
                    // Skip if no bookings
                    if (bookings.length === 0) {
                        console.log(`⏭️  Skipping ${driver.name} - No completed bookings`);
                        results.skipped.push({
                            driverId: driver._id,
                            name: driver.name,
                            reason: 'No completed bookings'
                        });
                        continue;
                    }
                    
                    // Generate payout
                    const payout = await DriverPayout.generateWeeklyPayout(
                        driver._id,
                        lastMonday,
                        lastSunday
                    );
                    
                    console.log(`✅ Generated payout for ${driver.name}: ₹${payout.payoutAmount}`);
                    
                    // Send notification to driver
                    await sendNotification(driver._id, {
                        title: '💰 Weekly Payout Generated',
                        message: `Your payout of ₹${payout.payoutAmount.toFixed(2)} for ${bookings.length} trips has been generated. Payment will be processed within 24-48 hours.`,
                        type: 'payout',
                        data: {
                            payoutId: payout._id,
                            amount: payout.payoutAmount,
                            trips: bookings.length
                        }
                    });
                    
                    results.success.push({
                        driverId: driver._id,
                        name: driver.name,
                        payoutId: payout._id,
                        amount: payout.payoutAmount,
                        trips: bookings.length
                    });
                    
                } catch (error) {
                    console.error(`❌ Failed to generate payout for ${driver.name}:`, error.message);
                    results.failed.push({
                        driverId: driver._id,
                        name: driver.name,
                        error: error.message
                    });
                }
            }
            
            // Log summary
            console.log('\n📊 Payout Generation Summary:');
            console.log(`✅ Success: ${results.success.length}`);
            console.log(`❌ Failed: ${results.failed.length}`);
            console.log(`⏭️  Skipped: ${results.skipped.length}`);
            
            // Send admin notification
            await this.sendAdminSummary(results, lastMonday, lastSunday);
            
            return results;
            
        } catch (error) {
            console.error('❌ [Payout Automation] Failed to generate weekly payouts:', error);
            throw error;
        }
    }
    
    /**
     * Send payout reminders to drivers with pending payouts
     */
    static async sendPayoutReminders() {
        try {
            // Get pending payouts older than 24 hours
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            const pendingPayouts = await DriverPayout.find({
                status: 'PENDING',
                createdAt: { $lte: yesterday }
            }).populate('driver', 'name phone');
            
            console.log(`📬 Found ${pendingPayouts.length} pending payouts to remind`);
            
            for (const payout of pendingPayouts) {
                try {
                    await sendNotification(payout.driver._id, {
                        title: '⏰ Payout Processing',
                        message: `Your payout of ₹${payout.payoutAmount.toFixed(2)} is being processed. You'll receive payment within 24 hours.`,
                        type: 'payout',
                        data: {
                            payoutId: payout._id,
                            amount: payout.payoutAmount
                        }
                    });
                    
                    console.log(`✅ Sent reminder to ${payout.driver.name}`);
                } catch (error) {
                    console.error(`❌ Failed to send reminder to ${payout.driver.name}:`, error.message);
                }
            }
            
        } catch (error) {
            console.error('❌ [Payout Automation] Failed to send reminders:', error);
        }
    }
    
    /**
     * Send admin summary of payout generation
     */
    static async sendAdminSummary(results, startDate, endDate) {
        try {
            const totalAmount = results.success.reduce((sum, r) => sum + r.amount, 0);
            const totalTrips = results.success.reduce((sum, r) => sum + r.trips, 0);
            
            const summary = {
                title: '📊 Weekly Payout Generation Complete',
                message: `Generated ${results.success.length} payouts for period ${startDate.toDateString()} to ${endDate.toDateString()}`,
                details: {
                    totalPayouts: results.success.length,
                    totalAmount: `₹${totalAmount.toFixed(2)}`,
                    totalTrips,
                    failed: results.failed.length,
                    skipped: results.skipped.length
                },
                timestamp: new Date()
            };
            
            // In production, send this to admin notification system
            console.log('\n📧 Admin Summary:', JSON.stringify(summary, null, 2));
            
        } catch (error) {
            console.error('❌ Failed to send admin summary:', error);
        }
    }
    
    /**
     * Manually trigger payout generation (for testing or manual runs)
     */
    static async manualPayoutGeneration(startDate, endDate) {
        try {
            console.log('🔄 [Manual] Starting payout generation...');
            
            const drivers = await SpareDriver.find({
                status: 'ACTIVE',
                verificationStatus: 'APPROVED'
            }).select('_id name');
            
            const results = {
                success: [],
                failed: []
            };
            
            for (const driver of drivers) {
                try {
                    const payout = await DriverPayout.generateWeeklyPayout(
                        driver._id,
                        new Date(startDate),
                        new Date(endDate)
                    );
                    
                    results.success.push({
                        driverId: driver._id,
                        name: driver.name,
                        amount: payout.payoutAmount
                    });
                    
                } catch (error) {
                    results.failed.push({
                        driverId: driver._id,
                        name: driver.name,
                        error: error.message
                    });
                }
            }
            
            console.log(`✅ Manual generation complete: ${results.success.length} success, ${results.failed.length} failed`);
            
            return results;
            
        } catch (error) {
            console.error('❌ [Manual] Failed to generate payouts:', error);
            throw error;
        }
    }
    
    /**
     * Get payout generation status
     */
    static async getPayoutStatus() {
        try {
            const today = new Date();
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay() + 1);
            weekStart.setHours(0, 0, 0, 0);
            
            const pendingPayouts = await DriverPayout.countDocuments({
                status: 'PENDING',
                createdAt: { $gte: weekStart }
            });
            
            const processingPayouts = await DriverPayout.countDocuments({
                status: 'PROCESSING',
                createdAt: { $gte: weekStart }
            });
            
            const completedPayouts = await DriverPayout.countDocuments({
                status: 'COMPLETED',
                createdAt: { $gte: weekStart }
            });
            
            return {
                currentWeek: {
                    pending: pendingPayouts,
                    processing: processingPayouts,
                    completed: completedPayouts,
                    total: pendingPayouts + processingPayouts + completedPayouts
                },
                nextPayoutDate: this.getNextPayoutDate(),
                lastPayoutDate: this.getLastPayoutDate()
            };
            
        } catch (error) {
            console.error('❌ Failed to get payout status:', error);
            throw error;
        }
    }
    
    /**
     * Get next payout date (next Monday)
     */
    static getNextPayoutDate() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
        
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + daysUntilMonday);
        nextMonday.setHours(0, 0, 0, 0);
        
        return nextMonday;
    }
    
    /**
     * Get last payout date (last Monday)
     */
    static getLastPayoutDate() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        
        const lastMonday = new Date(today);
        lastMonday.setDate(today.getDate() - daysSinceMonday - 7);
        lastMonday.setHours(0, 0, 0, 0);
        
        return lastMonday;
    }
}

module.exports = PayoutAutomationService;