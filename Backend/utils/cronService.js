const cron = require('node-cron');
const Subscription = require('../models/Subscription');
const Booking = require('../models/Booking');
const Hub = require('../models/Hub');
const { sendNotification, sendCaptainNotification, sendVendorNotification } = require('./notificationService');

const Captain = require('../models/Captain');

/**
 * Apartment Wash Subscription Job Generator
 * Runs daily to convert active subscriptions into actionable bookings.
 * Implements staff load balancing and intelligent assignment.
 */
const generateDailySubscriptionJobs = async () => {
    console.log('[Cron] 🕒 Starting Daily Subscription Job Generation...');
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Find all ACTIVE subscriptions that have a vehicle and hub assigned
        const activeSubscriptions = await Subscription.find({
            status: 'active',
            endDate: { $gte: today },
            vehicle: { $exists: true, $ne: null },
            hub: { $exists: true, $ne: null }
        }).populate('user hub vehicle');

        console.log(`[Cron] Found ${activeSubscriptions.length} valid subscriptions with vehicles to process.`);

        // Group subscriptions by Hub to optimize staff lookup
        const hubMap = {};
        for (const sub of activeSubscriptions) {
            const hubId = sub.hub?._id?.toString();
            if (!hubId) continue;
            if (!hubMap[hubId]) hubMap[hubId] = { hub: sub.hub, subscriptions: [] };
            hubMap[hubId].subscriptions.push(sub);
        }

        let jobsCreated = 0;
        for (const hubId in hubMap) {
            const { hub, subscriptions } = hubMap[hubId];

            // Sort subscriptions by parking hierarchy for efficient crew routing
            subscriptions.sort((a, b) => {
                const basementA = a.parkingDetails?.basement || '';
                const basementB = b.parkingDetails?.basement || '';
                if (basementA !== basementB) return basementA.localeCompare(basementB);
                
                const blockA = a.parkingDetails?.block || '';
                const blockB = b.parkingDetails?.block || '';
                if (blockA !== blockB) return blockA.localeCompare(blockB);
                
                const pillarA = a.parkingDetails?.pillar || '';
                const pillarB = b.parkingDetails?.pillar || '';
                return pillarA.localeCompare(pillarB);
            });

            // 2. Fetch apartment captains mapped to this hub
            const specialists = await Captain.find({
                isActive: true,
                isVerified: true,
                'profile.hub': hub.name
            });

            console.log(`[Cron] Hub ${hub.name}: Found ${specialists.length} captains for ${subscriptions.length} jobs.`);

            const staffLoadCount = {}; // { captainId: count }
            let staffIndex = 0;
            
            for (const sub of subscriptions) {
                const shouldSkipToday = Array.isArray(sub.skipDates) && sub.skipDates.some((skipDate) => {
                    const normalized = new Date(skipDate);
                    normalized.setHours(0, 0, 0, 0);
                    return normalized.getTime() === today.getTime();
                });

                if (shouldSkipToday) {
                    console.log(`[Cron] ⏭️ Skipping subscription ${sub._id} for today due to user skip request.`);
                    continue;
                }

                // Secondary safety check
                if (!sub.vehicle) {
                    console.warn(`[Cron] ⚠️ Skipping subscription ${sub._id} - Vehicle data lost during population.`);
                    continue;
                }

                // Check if a booking already exists for this subscription today
                const existingBooking = await Booking.findOne({
                    subscriptionId: sub._id,
                    'schedule.date': {
                        $gte: today,
                        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                    }
                });

                if (existingBooking) continue;

                // 3. Assign Specialist (Round-robin load balancing with CAP)
                let assignedStaff = null;
                if (specialists.length > 0) {
                    // Try to find an available captain within the 10 car limit
                    let attempts = 0;
                    while (attempts < specialists.length) {
                        const potentialStaff = specialists[staffIndex % specialists.length];
                        const staffId = potentialStaff._id.toString();
                        
                        if ((staffLoadCount[staffId] || 0) < 10) {
                            assignedStaff = potentialStaff;
                            staffLoadCount[staffId] = (staffLoadCount[staffId] || 0) + 1;
                            staffIndex++;
                            break;
                        }
                        
                        staffIndex++; // Move to next specialist
                        attempts++;
                    }
                }

                if (!assignedStaff && specialists.length > 0) {
                    console.warn(`[Cron] 🚩 CAPACITY ALERT: All captains for Hub ${hub.name} have reached the 10-car limit.`);
                    continue;
                }

                if (!assignedStaff) {
                    console.warn(`[Cron] 🚩 ASSIGNMENT ALERT: No verified captains mapped to apartment hub ${hub.name}.`);
                    continue; 
                }

                const bookingData = {
                    consumer: sub.user?._id,
                    vehicle: sub.vehicle?._id,
                    subscriptionId: sub._id,
                    service: {
                        id: sub.service?.id || 'apartment-wash',
                        key: sub.service?.key || 'APARTMENT_WASH',
                        name: 'Apartment Dry Wash', // Explicitly following SOP
                        category: 'Apartment',
                        type: 'captain'
                    },
                    location: {
                        type: 'Apartment',
                        hubId: sub.hub?._id,
                        address: {
                            street: sub.hub?.name || 'Apartment Complex',
                            city: sub.hub?.city || 'City',
                            coordinates: sub.hub?.location?.coordinates || { lat: 0, lng: 0 }
                        },
                        parkingDetails: {
                            basement: sub.parkingDetails?.basement,
                            block: sub.parkingDetails?.block,
                            pillar: sub.parkingDetails?.pillar,
                            slotNumber: sub.parkingDetails?.slotNumber,
                            area: `Apartment: ${sub.hub?.name}`
                        }
                    },
                    pricing: {
                        baseAmount: 0, // Paid via subscription
                        totalAmount: 0,
                        currency: 'INR'
                    },
                    payment: {
                        method: 'subscription',
                        status: 'paid',
                        paidAt: new Date()
                    },
                    schedule: {
                        type: 'scheduled',
                        date: today,
                        timeSlot: {
                            start: sub.slot === 'morning' ? '06:00 AM' : '06:00 PM',
                            end: sub.slot === 'morning' ? '09:00 AM' : '08:00 PM'
                        }
                    },
                    status: 'confirmed',
                    provider: {
                        id: assignedStaff._id,
                        type: 'captain'
                    },
                    // Scheduled apartment missions are captain-operated, not staff-operated.
                    assignedStaff: null
                };

                await Booking.create(bookingData);
                jobsCreated++;

                // 4. Notify consumer
                if (sub.user?._id) {
                    await sendNotification(sub.user._id, {
                        title: 'Daily Wash Activated 🧼',
                        message: `Your morning wash for ${sub.vehicle?.plate || 'your car'} is initialized. Assigned: ${assignedStaff?.name || 'Authorized Hub'}`,
                        type: 'subscription' // Fixed from 'booking' to align with subscription flow
                    });
                }

                // 5. Notify assigned captain
                if (assignedStaff?._id) {
                    await sendCaptainNotification(assignedStaff._id, {
                        title: 'Mission Assigned 🚗',
                        message: `You have a new Apartment Wash at ${sub.hub?.name}. Slot: ${sub.slot === 'morning' ? '6-9 AM' : '6-8 PM'}. Route sorted by Basement → Block → Pillar.`,
                        type: 'booking' // Fixed from 'status-update'
                    });
                }
            }
        }

        console.log(`[Cron] ✅ Processing complete. Created ${jobsCreated} new daily jobs.`);
    } catch (error) {
        console.error('[Cron] ❌ Error generating subscription jobs:', error);
    }
};

/**
 * Subscription Lifecycle Manager
 * Handles expiring subscriptions and notifying users/staff.
 */
const processSubscriptionExpiries = async () => {
    console.log('[Cron] 🕒 Checking for expired subscriptions and sending alerts...');
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Find subscriptions ending TODAY or already ended but still 'active'
        const expiringNow = await Subscription.find({
            status: 'active',
            endDate: { $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
        }).populate('user hub vehicle');

        for (const sub of expiringNow) {
            const isFullyEnded = sub.endDate < today;
            
            if (isFullyEnded) {
                sub.status = 'expired';
                await sub.save();

                // Notify User
                await sendNotification(sub.user?._id, {
                    title: 'Subscription Ended ⌛',
                    message: `Your Apartment Wash subscription for ${sub.vehicle?.plate || 'your car'} has ended today. Renew to continue services.`,
                    type: 'subscription_expired'
                });

                // Notify Hub/Staff
                if (sub.hub?.vendor) {
                    await sendVendorNotification(sub.hub.vendor, {
                        title: 'Client Subscription Ended',
                        message: `Subscription for ${sub.user?.name} (${sub.vehicle?.plate}) at ${sub.hub.name} has expired.`,
                        type: 'system_alert'
                    });
                }
            } else {
                // Ending Today - Final Warning
                await sendNotification(sub.user?._id, {
                    title: 'Last Day of Service 🔔',
                    message: `Today is the final day of your current subscription. Don't forget to renew for uninterrupted service!`,
                    type: 'subscription_warning'
                });
            }
        }

        // 2. Pre-expiry Alerts (e.g., 3 days before)
        const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
        const warningDateStart = new Date(threeDaysFromNow);
        warningDateStart.setHours(0, 0, 0, 0);
        const warningDateEnd = new Date(threeDaysFromNow);
        warningDateEnd.setHours(23, 59, 59, 999);

        const expiringSoon = await Subscription.find({
            status: 'active',
            endDate: { $gte: warningDateStart, $lte: warningDateEnd }
        }).populate('user');

        for (const sub of expiringSoon) {
            await sendNotification(sub.user?._id, {
                title: 'Renewal Reminder 🗓️',
                message: `Your subscription expires in 3 days. Renew now to keep your sparkling mornings!`,
                type: 'subscription_warning'
            });
        }

    } catch (error) {
        console.error('[Cron] ❌ Error in processSubscriptionExpiries:', error);
    }
};

/**
 * Robust Scheduler Initialization
 */
const initCronService = () => {
    console.log('[Cron] 🚀 Cron Service Initialized (Scheduled for 1:00 AM & 2:00 AM Daily)');

    // Task 1: Lifecycle Management (Expiry/Alerts) at 1:00 AM
    cron.schedule('0 1 * * *', () => {
        processSubscriptionExpiries();
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

    // Task 2: Job Generation at 2:00 AM
    cron.schedule('0 2 * * *', () => {
        generateDailySubscriptionJobs();
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

    // For development/immediate testing, trigger once on start
    if (process.env.NODE_ENV === 'development') {
        console.log('[Cron] 🧪 Dev Mode: Triggering lifecycle & job generation...');
        setTimeout(async () => {
            await processSubscriptionExpiries();
            await generateDailySubscriptionJobs();
        }, 3000);
    }
};

module.exports = { initCronService, generateDailySubscriptionJobs };
