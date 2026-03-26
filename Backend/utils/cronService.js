const cron = require('node-cron');
const Subscription = require('../models/Subscription');
const Booking = require('../models/Booking');
const Hub = require('../models/Hub');
const { sendNotification } = require('./notificationService');

const User = require('../models/User');

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

            // 2. Fetch available specialists for this Hub
            // Specialists are users with role 'staff' assigned to this hub
            const specialists = await User.find({
                role: 'staff',
                'profile.hub': hub.name, // Usually stored by name or ID in this schema
                isActive: true
            });

            console.log(`[Cron] Hub ${hub.name}: Found ${specialists.length} specialists for ${subscriptions.length} jobs.`);

            let staffIndex = 0;
            for (const sub of subscriptions) {
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

                // 3. Assign Specialist (Round-robin load balancing)
                let assignedStaff = null;
                if (specialists.length > 0) {
                    assignedStaff = specialists[staffIndex % specialists.length];
                    staffIndex++;
                }

                const bookingData = {
                    consumer: sub.user?._id,
                    vehicle: sub.vehicle?._id,
                    subscriptionId: sub._id,
                    service: {
                        id: sub.service?.id || 'apartment-wash',
                        key: sub.service?.key || 'APARTMENT_WASH',
                        name: sub.service?.title || 'Apartment Car Wash',
                        category: 'Apartment',
                        type: 'vendor'
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
                        id: assignedStaff?._id || sub.hub?.vendor,
                        type: 'vendor'
                    }
                };

                await Booking.create(bookingData);
                jobsCreated++;

                // 4. Notify consumer
                if (sub.user?._id) {
                    await sendNotification(sub.user._id, {
                        title: 'Service Activated 🧼',
                        message: `Your daily apartment wash for ${sub.vehicle?.plate || 'your vehicle'} has been initialized. Specialist ${assignedStaff?.name || 'is on the way'}.`,
                        type: 'booking'
                    });
                }

                // 5. Notify assigned staff (Captain)
                if (assignedStaff?._id) {
                    await sendNotification(assignedStaff._id, {
                        title: 'Morning Duty Assigned 🚗',
                        message: `You have a new wash scheduled at ${sub.hub?.name}. Slot: ${sub.slot === 'morning' ? '6-9 AM' : '6-8 PM'}.`,
                        type: 'status-update'
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
 * Robust Scheduler Initialization
 */
const initCronService = () => {
    console.log('[Cron] 🚀 Cron Service Initialized (Scheduled for 2:00 AM Daily)');

    // Schedule: 0 2 * * * (At 2:00 AM every day)
    cron.schedule('0 2 * * *', () => {
        generateDailySubscriptionJobs();
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

    // For development/immediate testing, trigger once on start
    if (process.env.NODE_ENV === 'development') {
        console.log('[Cron] 🧪 Dev Mode: Triggering immediate job generation...');
        setTimeout(generateDailySubscriptionJobs, 3000);
    }
};

module.exports = { initCronService, generateDailySubscriptionJobs };
