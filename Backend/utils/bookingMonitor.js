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

            // ─── PASS 3: STUDIO WASH Scheduled Monitor ─────────────────────────────
            const studioScheduled = await Booking.find({
                'schedule.type': 'scheduled',
                'service.type': 'vendor',
                status: { $in: ['accepted', 'pickup-assigned'] },
                isActive: true,
                'schedule.date': {
                    $gte: new Date(now.getTime() - 12 * 60 * 60 * 1000),
                    $lte: new Date(now.getTime() + 12 * 60 * 60 * 1000)
                }
            }).populate('provider.id').populate('pickupStaff');

            for (const booking of studioScheduled) {
                const startTime = getScheduledStartTime(booking);
                if (!startTime) continue;
                const diffMinutes = (startTime - now) / (1000 * 60);
                const io = socketService.getIO();

                if (diffMinutes <= 47 && diffMinutes >= 43 && !booking.vendorAlertSent && !booking.pickupStaff) {
                    const vendorId = booking.provider?.id?._id || booking.provider?.id;
                    if (vendorId) {
                        io.to(vendorId.toString()).emit('scheduled_dispatch_alert', {
                            bookingId: booking._id,
                            message: `⚠️ Urgent: Assign pickup agent for booking #${booking.bookingId || booking._id.toString().slice(-6)}`,
                            deadline: 15
                        });
                        booking.vendorAlertSent = true;
                        await booking.save();
                    }
                }

                if (diffMinutes <= 32 && diffMinutes >= 28 && !booking.staffCommitmentAlertSent && booking.pickupStaff) {
                    const staffId = booking.pickupStaff?._id || booking.pickupStaff;
                    if (staffId) {
                        io.to(staffId.toString()).emit('scheduled_commitment_request', {
                            bookingId: booking._id,
                            message: `⏰ Priority: Scheduled pickup in 30 mins. Please confirm availability in terminal.`,
                            schedule: booking.schedule
                        });
                        booking.staffCommitmentAlertSent = true;
                        await booking.save();
                    }
                }

                if (diffMinutes <= 3 && diffMinutes >= -3 && booking.status === 'pickup-assigned' && !booking.scheduledAlertSent) {
                    booking.status = 'en_route';
                    booking.scheduledAlertSent = true;
                    await booking.save();

                    io.to(booking._id.toString()).emit('booking_status_updated', {
                        bookingId: booking._id,
                        status: 'en_route',
                        message: 'Agent is heading towards you for the scheduled pickup!'
                    });
                }
            }

            // ─── PASS 4: DOORSTEP Scheduled Monitor (Risk Mitigation) ─────────────
            const doorstepScheduled = await Booking.find({
                'schedule.type': 'scheduled',
                'service.type': 'captain',
                status: 'confirmed',
                isActive: true,
                'schedule.date': {
                    $gte: new Date(now.getTime() - 12 * 60 * 60 * 1000),
                    $lte: new Date(now.getTime() + 12 * 60 * 60 * 1000)
                }
            }).populate('provider.id');

            for (const booking of doorstepScheduled) {
                const startTime = getScheduledStartTime(booking);
                if (!startTime) continue;
                const diffMinutes = (startTime - now) / (1000 * 60);
                const io = socketService.getIO();

                // Stage 1: T-45 Commitment Alert
                if (diffMinutes <= 47 && diffMinutes >= 43 && !booking.doorstepCommitmentAlertSent) {
                    const captainId = booking.provider?.id?._id || booking.provider?.id;
                    if (captainId) {
                        io.to(captainId.toString()).emit('doorstep_commitment_request', {
                            bookingId: booking._id,
                            message: `⚠️ Urgent: Confirm availability for scheduled wash #${booking.bookingId || booking._id.toString().slice(-6)}`,
                            deadline: 15
                        });

                        await sendCaptainNotification(captainId, {
                            title: '⏰ Commitment Required!',
                            message: `Please confirm your upcoming wash #${booking.bookingId || booking._id.toString().slice(-6)} at ${booking.schedule.timeSlot.start}. Failure to confirm in 15 mins will result in re-assignment.`,
                            type: 'booking',
                            priority: 'high',
                            metaData: { bookingId: booking._id }
                        });

                        booking.doorstepCommitmentAlertSent = true;
                        await booking.save();
                    }
                }

                // Stage 2: T-30 Emergency Re-Broadcast (If NOT committed)
                if (diffMinutes <= 32 && diffMinutes >= 28 && !booking.isDoorstepCommitted) {
                    const originalCaptainId = booking.provider?.id?._id || booking.provider?.id;

                    console.log(`[Monitor] 🚨 EMERGENCY: Un-commited doorstep booking at T-30. Re-assigning: ${booking._id}`);

                    // 1. Log the failure
                    booking.activityLog.push({
                        status: 'reassigned',
                        description: 'Original captain failed to commit at T-45. Re-broadcasting to nearby specialists.',
                        metadata: { originalCaptain: originalCaptainId }
                    });

                    // 2. Unassign and move to pending
                    booking.reassignedFrom = originalCaptainId;
                    booking.reassignedAt = new Date();
                    booking.provider = { type: 'captain' }; // Clear the ID
                    booking.status = 'pending';
                    await booking.save();

                    // 3. Inform original captain
                    if (originalCaptainId) {
                        io.to(originalCaptainId.toString()).emit('job_unassigned', {
                            bookingId: booking._id,
                            reason: 'Failure to commit at T-45'
                        });
                    }

                    // 4. Trigger Instant Broadcast for nearby backup captains
                    await broadcastScheduledBooking(booking);

                    // 5. Notify Admins
                    await sendAdminNotification({
                        title: '🔴 Critical: Doorstep Re-assignment',
                        message: `Booking #${booking.bookingId || booking._id.toString().slice(-6)} reassigned. Specialist failed to commit.`,
                        type: 'booking',
                        priority: 'high',
                        metaData: { bookingId: booking._id }
                    });
                }
            }

            // ─── PASS 5: STUCK BOOKING MONITOR (Proactive Logistics) ─────────────
            const twoHoursAgo = new Date(now.getTime() - 120 * 60 * 1000);
            const stuckBookings = await Booking.find({
                status: { $in: ['assigned', 'en_route', 'arrived', 'pickup-assigned', 'in_progress'] },
                updatedAt: { $lt: twoHoursAgo },
                isActive: true,
                isStuckAlertSent: { $ne: true } // Prevent notification spam
            }).populate('consumer', 'name');

            for (const b of stuckBookings) {
                console.log(`[Monitor] ⚠️ STUCK BOOKING DETECTED: ${b._id} (No activity for 2+ hours)`);

                // Emit to Admin Room
                const io = socketService.getIO();
                io.to('admin').emit('stuck_booking_alert', {
                    bookingId: b._id,
                    status: b.status,
                    customer: b.consumer?.name || 'Customer',
                    lastUpdate: b.updatedAt
                });

                // Send Admin DB Notification
                await sendAdminNotification({
                    title: '⚠️ Logistical Bottleneck',
                    message: `Booking #${b.bookingId || b._id.toString().slice(-6)} has stalled in "${b.status}" status for over 2 hours.`,
                    type: 'logistics',
                    priority: 'medium',
                    metaData: { bookingId: b._id }
                });

                // Mark as alerted
                b.isStuckAlertSent = true;
                await b.save();
            }

        } catch (error) {
            console.error('[Monitor] ❌ Error in booking monitor cycle:', error.message);
        }
    }, 60000); // Every 60 seconds
};

module.exports = startBookingMonitor;
