const cron = require('node-cron');
const DriverPayout = require('../models/DriverPayout');
const SpareDriver = require('../models/SpareDriver');
const Booking = require('../models/Booking');
const Penalty = require('../models/Penalty');
const { sendSpareDriverNotification: sendNotification, sendAdminNotification } = require('../utils/notificationService');

/**
 * WEEKLY PAYOUT AUTOMATION
 * Runs every Monday at 12:00 AM to generate payouts for the previous week
 */

class WeeklyPayoutJob {
    
    /**
     * Initialize the cron job
     */
    static init() {
        // Run every Monday at 12:00 AM (0 0 * * 1)
        cron.schedule('0 0 * * 1', async () => {
            console.log('🔄 Starting weekly payout generation...');
            await this.generateWeeklyPayouts();
        });
        
        console.log('✅ Weekly payout job initialized (runs every Monday at 12:00 AM)');
    }
    
    /**
     * Generate payouts for all active drivers
     */
    static async generateWeeklyPayouts() {
        try {
            // Calculate previous week dates
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
            
            // Generate payout for each driver
            for (const driver of drivers) {
                try {
                    // Check if payout already exists for this period
                    const existingPayout = await DriverPayout.findOne({
                        driver: driver._id,
                        'payoutPeriod.start': lastMonday,
                        'payoutPeriod.end': lastSunday
                    });
                    
                    if (existingPayout) {
                        console.log(`⏭️  Skipping ${driver.name} - payout already exists`);
                        results.skipped.push({
                            driverId: driver._id,
                            name: driver.name,
                            reason: 'Payout already exists'
                        });
                        continue;
                    }
                    
                    // Get completed bookings for the week
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
                        console.log(`⏭️  Skipping ${driver.name} - no completed bookings`);
                        results.skipped.push({
                            driverId: driver._id,
                            name: driver.name,
                            reason: 'No completed bookings'
                        });
                        continue;
                    }
                    
                    // Get penalties for the week
                    const penalties = await Penalty.find({
                        driver: driver._id,
                        status: 'APPLIED',
                        deductionSource: 'PAYOUT',
                        appliedAt: {
                            $gte: lastMonday,
                            $lte: lastSunday
                        }
                    });
                    
                    // Create payout
                    const payout = new DriverPayout({
                        driver: driver._id,
                        payoutPeriod: {
                            start: lastMonday,
                            end: lastSunday
                        },
                        trips: bookings.map(booking => ({
                            booking: booking._id,
                            amount: booking.pricing?.finalAmount || 0,
                            commission: booking.pricing?.platformCommission || 0,
                            earning: booking.pricing?.driverEarning || 0,
                            completedAt: booking.completedAt
                        })),
                        penalties: penalties.map(penalty => ({
                            penalty: penalty._id,
                            amount: penalty.amount,
                            reason: penalty.reason
                        })),
                        bankDetails: driver.bankDetails,
                        upiId: driver.upiId
                    });
                    
                    // Calculate payout amount
                    payout.calculatePayout();
                    await payout.save();
                    
                    console.log(`✅ Generated payout for ${driver.name}: ₹${payout.payoutAmount}`);
                    
                    results.success.push({
                        driverId: driver._id,
                        name: driver.name,
                        payoutId: payout._id,
                        amount: payout.payoutAmount,
                        trips: bookings.length
                    });
                    
                    // Send notification to driver
                    try {
                        await sendNotification(driver._id, {
                            title: '💰 Weekly Payout Generated',
                            message: `Your payout of ₹${payout.payoutAmount} for ${bookings.length} trips has been generated. It will be processed within 24-48 hours.`,
                            type: 'payout',
                            data: {
                                payoutId: payout._id,
                                amount: payout.payoutAmount,
                                trips: bookings.length
                            }
                        });
                    } catch (notifError) {
                        console.error(`Failed to send notification to ${driver.name}:`, notifError.message);
                    }
                    
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
            console.log('\n📊 WEEKLY PAYOUT GENERATION SUMMARY:');
            console.log(`✅ Success: ${results.success.length}`);
            console.log(`⏭️  Skipped: ${results.skipped.length}`);
            console.log(`❌ Failed: ${results.failed.length}`);
            
            // Send admin notification
            try {
                await this.sendAdminSummary(results, lastMonday, lastSunday);
            } catch (error) {
                console.error('Failed to send admin summary:', error.message);
            }
            
            return results;
            
        } catch (error) {
            console.error('❌ Weekly payout generation failed:', error);
            throw error;
        }
    }
    
    /**
     * Send summary notification to admins
     */
    static async sendAdminSummary(results, startDate, endDate) {
        const totalAmount = results.success.reduce((sum, r) => sum + r.amount, 0);
        const totalTrips = results.success.reduce((sum, r) => sum + r.trips, 0);
        
        const message = `
Weekly Payout Generation Complete

Period: ${startDate.toDateString()} - ${endDate.toDateString()}

✅ Successful: ${results.success.length} drivers
💰 Total Amount: ₹${totalAmount.toLocaleString()}
🚗 Total Trips: ${totalTrips}

⏭️  Skipped: ${results.skipped.length}
❌ Failed: ${results.failed.length}

${results.failed.length > 0 ? '\n⚠️ Failed Drivers:\n' + results.failed.map(f => `- ${f.name}: ${f.error}`).join('\n') : ''}
        `.trim();
        
        console.log('\n' + message);
        
        // TODO: Send to admin notification system
        // await sendAdminNotification({
        //     title: '💰 Weekly Payout Generation Complete',
        //     message,
        //     type: 'payout_summary',
        //     priority: 'high'
        // });
    }
    
    /**
     * Manual trigger for testing (can be called from admin panel)
     */
    static async manualTrigger(startDate, endDate) {
        console.log('🔄 Manual payout generation triggered...');
        
        if (!startDate || !endDate) {
            throw new Error('Start date and end date are required for manual trigger');
        }
        
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        // Get all active drivers
        const drivers = await SpareDriver.find({
            status: 'ACTIVE',
            verificationStatus: 'APPROVED'
        }).select('_id');
        
        const results = [];
        
        for (const driver of drivers) {
            try {
                const payout = await DriverPayout.generateWeeklyPayout(
                    driver._id,
                    start,
                    end
                );
                
                results.push({
                    driverId: driver._id,
                    status: 'success',
                    payoutId: payout._id,
                    amount: payout.payoutAmount
                });
            } catch (error) {
                results.push({
                    driverId: driver._id,
                    status: 'error',
                    error: error.message
                });
            }
        }
        
        return results;
    }
}

module.exports = WeeklyPayoutJob;