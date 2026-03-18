const Booking = require('../models/Booking');
const Captain = require('../models/Captain');
const { sendNotification, sendCaptainNotification, sendAdminNotification } = require('./notificationService');
const socketService = require('../socketService');

/**
 * Parse "09:00 AM" or "14:30" style time string into hours & minutes
 */
const parseTimeSlot = (timeStr) => {
    if (!timeStr) return null;
    const parts = timeStr.trim().split(' ');
    const time = parts[0];
    const modifier = parts[1]; // AM | PM | undefined (24hr)

    let [hours, minutes] = time.split(':').map(Number);

    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    return { hours, minutes };
};

/**
 * Get ISO start datetime from a booking's schedule
 */
const getScheduledStartTime = (booking) => {
    const parsed = parseTimeSlot(booking.schedule?.timeSlot?.start);
    if (!parsed) return null;

    const base = new Date(booking.schedule.date);
    base.setHours(parsed.hours, parsed.minutes, 0, 0);
    return base;
};

/**
 * Broadcast an unassigned scheduled booking to nearby captains
 * (Same logic as createBooking for instant wash)
 */
const broadcastScheduledBooking = async (booking) => {
    try {
        const io = socketService.getIO();

        // Only broadcast if no captain assigned yet
        if (booking.provider?.id) return;

        const broadcastPayload = {
            bookingId: booking._id,
            serviceName: booking.service?.name || 'Scheduled Wash',
            vehicle: booking.vehicle
                ? `${booking.vehicle.brand || ''} ${booking.vehicle.model || ''}`.trim()
                : 'Vehicle',
            userName: booking.consumer?.name || 'Customer',
            pricing: { total: booking.pricing?.totalAmount },
            location: booking.location,
            schedule: booking.schedule,
            isScheduled: true
        };

        // Find online, verified captains nearby (5km radius)
        let captainsNotified = 0;
        if (
            booking.location?.address?.geoPoint?.coordinates?.length === 2
        ) {
            const [lng, lat] = booking.location.address.geoPoint.coordinates;
            const nearbyCaptains = await Captain.find({
                isOnline: true,
                isVerified: true,
                'location.coordinates': {
                    $nearSphere: {
                        $geometry: { type: 'Point', coordinates: [lng, lat] },
                        $maxDistance: 5000
                    }
                }
            }).select('_id');

            for (const cap of nearbyCaptains) {
                io.to(cap._id.toString()).emit('new_booking_broadcast', broadcastPayload);
                captainsNotified++;
            }
        }

        // Fallback: Global broadcast if no nearby captains found
        if (captainsNotified === 0) {
            io.emit('new_booking_broadcast', broadcastPayload);
            console.log(`[Monitor] Scheduled booking ${booking._id}: Global broadcast (no nearby captains)`);
        } else {
            console.log(`[Monitor] Scheduled booking ${booking._id}: Notified ${captainsNotified} nearby captains`);
        }
    } catch (err) {
        console.error('[Monitor] broadcastScheduledBooking error:', err);
    }
};

const startBookingMonitor = () => {
    console.log('[Monitor] 🕐 Booking monitor started — checking every 60 seconds');

    setInterval(async () => {
        try {
            const now = new Date();

            // ─── PASS 1: ASSIGNED Scheduled Bookings (captain already accepted) ───────
            // Find bookings where:
            // - type: scheduled
            // - status: confirmed (captain assigned)
            // - scheduledAlertSent: NOT set (prevent duplicate alerts)
            // - timeSlot start is within ±2 minutes of now

            const assignedScheduled = await Booking.find({
                'schedule.type': 'scheduled',
                status: 'confirmed',
                isActive: true,
                scheduledAlertSent: { $ne: true },
                'schedule.date': {
                    $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Within last 24h
                    $lte: new Date(now.getTime() + 24 * 60 * 60 * 1000)  // Within next 24h
                }
            })
                .populate('consumer', 'name phone _id')
                .populate('provider.id', 'name phone _id');

            for (const booking of assignedScheduled) {
                const startTime = getScheduledStartTime(booking);
                if (!startTime) continue;

                const diffMinutes = (startTime - now) / (1000 * 60);

                // ── 30-minute pre-alert ──
                if (diffMinutes >= 28 && diffMinutes <= 32) {
                    console.log(`[Monitor] 30-min pre-alert for booking: ${booking._id}`);

                    const io = socketService.getIO();
                    const captainId = booking.provider?.id?._id || booking.provider?.id;

                    if (captainId) {
                        io.to(captainId.toString()).emit('scheduled_reminder', {
                            bookingId: booking._id,
                            minutesLeft: 30,
                            message: 'Reminder: Scheduled wash in 30 minutes!',
                            location: booking.location
                        });

                        await sendCaptainNotification(captainId, {
                            title: '⏰ 30-Minute Reminder',
                            message: `Your scheduled wash booking #${booking.bookingId || booking._id.toString().slice(-6)} starts in 30 minutes. Get ready!`,
                            type: 'booking',
                            priority: 'high',
                            metaData: { bookingId: booking._id }
                        });
                    }
                }

                // ── Time Arrived (±2 minutes window) ──
                if (diffMinutes <= 1 && diffMinutes >= -2) {
                    console.log(`[Monitor] ⚡ Time arrived for scheduled booking: ${booking._id}`);

                    const io = socketService.getIO();
                    const captainId = booking.provider?.id?._id || booking.provider?.id;

                    // Notify Captain via Socket + DB Notification
                    if (captainId) {
                        io.to(captainId.toString()).emit('scheduled_job_starting', {
                            bookingId: booking._id,
                            status: 'en_route',
                            message: "It's time! Head to the customer's location.",
                            location: booking.location,
                            consumer: {
                                name: booking.consumer?.name,
                                phone: booking.consumer?.phone
                            }
                        });

                        await sendCaptainNotification(captainId, {
                            title: '🚀 Scheduled Wash — Time to Go!',
                            message: `Booking #${booking.bookingId || booking._id.toString().slice(-6)} — It's time! Head to the customer right now.`,
                            type: 'booking',
                            priority: 'high',
                            metaData: { bookingId: booking._id }
                        });
                    }

                    // Notify Consumer via Socket
                    io.to(booking._id.toString()).emit('booking_status_updated', {
                        bookingId: booking._id,
                        status: 'en_route',
                        message: 'Captain is on the way for your scheduled wash!'
                    });

                    // Notify Consumer via DB Notification
                    if (booking.consumer?._id) {
                        await sendNotification(booking.consumer._id, {
                            title: 'Captain is on the way! 🚚',
                            message: `Your scheduled wash time has arrived. Captain ${booking.provider?.id?.name || 'Agent'} is heading your way.`,
                            type: 'booking',
                            priority: 'high',
                            metaData: { bookingId: booking._id }
                        });
                    }

                    // Update status → en_route + mark alert as sent (prevent re-trigger)
                    booking.status = 'en_route';
                    booking.scheduledAlertSent = true;
                    booking.tracking = {
                        ...(booking.tracking || {}),
                        startedAt: new Date()
                    };
                    await booking.save();
                }
            }

            // ─── PASS 2: UNASSIGNED Scheduled Bookings ─────────────────────────────
            // If no captain accepted a scheduled booking yet, and the time is arriving
            // → rebroadcast to nearby captains like an instant wash

            const unassignedScheduled = await Booking.find({
                'schedule.type': 'scheduled',
                status: 'pending',
                isActive: true,
                'schedule.date': {
                    $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
                    $lte: new Date(now.getTime() + 24 * 60 * 60 * 1000)
                }
            })
                .populate('consumer', 'name phone _id')
                .populate('vehicle', 'brand model type');

            for (const booking of unassignedScheduled) {
                const startTime = getScheduledStartTime(booking);
                if (!startTime) continue;

                const diffMinutes = (startTime - now) / (1000 * 60);

                // Re-broadcast 15 minutes before if still unassigned
                if (diffMinutes >= 13 && diffMinutes <= 17) {
                    console.log(`[Monitor] Re-broadcasting unassigned scheduled booking: ${booking._id} (${diffMinutes.toFixed(0)} min left)`);
                    await broadcastScheduledBooking(booking);

                    // Notify admin about unmatched scheduled booking
                    await sendAdminNotification({
                        title: '⚠️ Unassigned Scheduled Booking',
                        message: `Booking #${booking.bookingId || booking._id.toString().slice(-6)} starts in ~15 min with no captain assigned. Broadcasting to captains.`,
                        type: 'booking',
                        priority: 'high',
                        metaData: { bookingId: booking._id }
                    });
                }

                // Auto-cancel if still unassigned 5 min AFTER scheduled time
                if (diffMinutes <= -5 && diffMinutes >= -10) {
                    console.log(`[Monitor] Auto-cancelling unmatched scheduled booking: ${booking._id}`);
                    booking.status = 'cancelled';
                    booking.notes = { ...(booking.notes || {}), admin: 'Auto-cancelled: No captain available at scheduled time' };
                    await booking.save();

                    if (booking.consumer?._id) {
                        await sendNotification(booking.consumer._id, {
                            title: 'Booking Cancelled ❌',
                            message: `Sorry, we could not find an available captain for your scheduled booking. If payment was made, a refund will be processed.`,
                            type: 'booking',
                            priority: 'high',
                            metaData: { bookingId: booking._id }
                        });
                    }
                }
            }

        } catch (error) {
            console.error('[Monitor] ❌ Error in booking monitor cycle:', error.message);
        }
    }, 60000); // Every 60 seconds
};

module.exports = startBookingMonitor;
