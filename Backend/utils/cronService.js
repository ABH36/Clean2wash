const cron = require('node-cron');
const Subscription = require('../models/Subscription');
const Booking = require('../models/Booking');
const Hub = require('../models/Hub');
const { sendNotification, sendStaffNotification } = require('./notificationService');

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

            // 2. Fetch available specialists for this Hub
            // Specialists are users with role 'staff' assigned to this hub
            const specialists = await User.find({
                role: 'staff',
                'profile.hub': hub.name, // Usually stored by name or ID in this schema
                isActive: true
            });

            console.log(`[Cron] Hub ${hub.name}: Found ${specialists.length} specialists for ${subscriptions.length} jobs.`);

            const staffLoadCount = {}; // { staffId: count }
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

                // 3. Assign Specialist (Round-robin load balancing with CAP)
                let assignedStaff = null;
                if (specialists.length > 0) {
                    // Try to find an available specialist within the 10 car limit
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
                    console.warn(`[Cron] 🚩 CAPACITY ALERT: All specialists for Hub ${hub.name} have reached the 10-car limit.`);
                    // Depending on policy, we might still assign to hub vendor or leave unassigned
                    // For now, we'll continue to see if any other cars can be assigned (though unlikely given round-robin)
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
                    },
                    // Crucial: Set assignedStaff for dashboard visibility
                    assignedStaff: assignedStaff?._id
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

                // 5. Notify assigned staff (Captain)
                if (assignedStaff?._id) {
                    await sendStaffNotification(assignedStaff._id, {
                        title: 'Mission Assigned 🚗',
                        message: `You have a new Apartment Wash at ${sub.hub?.name}. Slot: ${sub.slot === 'morning' ? '6-9 AM' : '6-8 PM'}. Order sorted by Parking Hierarchy.`,
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
