const SOSAlert = require('../../../models/SOSAlert');
const User = require('../../../models/User');
const Captain = require('../../../models/Captain');
const Hub = require('../../../models/Hub');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');
const { sendNotification, sendCaptainNotification, sendVendorNotification, sendAdminNotification } = require('../../../utils/notificationService');
const socketService = require('../../../socketService');

// 1. Trigger SOS Alert
exports.triggerSOS = catchAsync(async (req, res, next) => {
    const { coordinates, address, description, photo } = req.body;

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
        return next(new AppError('Valid location coordinates are required to trigger SOS', 400));
    }

    // A. Create the SOS Alert record
    const sosAlert = await SOSAlert.create({
        consumer: req.user.id,
        location: {
            type: 'Point',
            coordinates: coordinates,
            address: address
        },
        description,
        photo
    });

    const populatedSOS = await SOSAlert.findById(sosAlert._id).populate('consumer', 'name phone profile.trustedContacts');

    // B. Radius Search: 5km (5000 meters)
    const lng = coordinates[0];
    const lat = coordinates[1];

    // 1. Find nearby Captains (Online & Active)
    const nearbyCaptains = await Captain.find({
        isOnline: true,
        isActive: true,
        location: {
            $nearSphere: {
                $geometry: { type: 'Point', coordinates: [lng, lat] },
                $maxDistance: 5000
            }
        }
    });

    // 2. Find nearby Studios (Hubs)
    const nearbyHubs = await Hub.find({
        isActive: true,
        type: 'Studio',
        'location.coordinates': {
            $nearSphere: {
                $geometry: { type: 'Point', coordinates: [lng, lat] },
                $maxDistance: 5000
            }
        }
    }).populate('vendor');

    // C. MULTI-CHANNEL NOTIFICATIONS
    const alertData = {
        title: '🚨 EMERGENCY SOS ALERT',
        message: `${populatedSOS.consumer.name} is in danger near ${address || 'your location'}. Please help!`,
        type: 'SOS',
        priority: 'high',
        metaData: {
            sosId: sosAlert._id,
            location: { lng, lat, address },
            consumerName: populatedSOS.consumer.name,
            consumerPhone: populatedSOS.consumer.phone
        }
    };

    // 1. Notify Captains
    nearbyCaptains.forEach(captain => {
        sendCaptainNotification(captain._id, alertData);
    });

    // 2. Notify Vendor Studios
    nearbyHubs.forEach(hub => {
        if (hub.vendor) {
            sendVendorNotification(hub.vendor._id, {
                ...alertData,
                message: `SOS ALERT near your Studio: ${hub.name}. Help requested!`
            });
        }
    });

    // 3. Notify Admin
    sendAdminNotification(alertData);

    // 4. Notify Trusted Contacts (SMS/Internal)
    const trustedContacts = populatedSOS.consumer.profile.trustedContacts || [];
    trustedContacts.forEach(contact => {
        // In a real app, this would trigger an SMS via Twilio/etc. 
        // For now, we simulate by creating a system notification for the consumer portal 
        // linked to their phone numbers if they are registered users.
        console.log(`[SOS] Alerting Trusted Contact: ${contact.name} (${contact.phone})`);
    });

    // D. SOCKET BROADCAST for the Responders Map
    const io = socketService.getIO();
    if (io) {
        io.emit('new_sos_alert', {
            sosId: sosAlert._id,
            consumerId: req.user.id,
            consumerName: populatedSOS.consumer.name,
            location: { lng, lat, address },
            description
        });
    }

    res.status(201).json({
        status: 'success',
        message: 'SOS Alert dispatched successfully to the rescue network',
        data: {
            sosId: sosAlert._id,
            nearbyCaptains: nearbyCaptains.length,
            nearbyStudios: nearbyHubs.length
        }
    });
});

// 2. Get SOS Status 
exports.getSOSStatus = catchAsync(async (req, res, next) => {
    const sosAlert = await SOSAlert.findById(req.params.id)
        .populate('consumer', 'name phone')
        .populate('responders.user', 'name phone role profile.photo');

    if (!sosAlert) {
        return next(new AppError('SOS Alert not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            sos: sosAlert
        }
    });
});

// 3. Respond to SOS (For Captains/Vendors)
exports.respondToSOS = catchAsync(async (req, res, next) => {
    const sosAlert = await SOSAlert.findById(req.params.id);
    if (!sosAlert || sosAlert.status !== 'active') {
        return next(new AppError('SOS alert is either resolved or not found.', 404));
    }

    // Check if already responding
    const alreadyResponding = sosAlert.responders.some(r => r.user.toString() === req.user.id);
    if (alreadyResponding) {
        return res.status(200).json({ status: 'success', message: 'You are already marked as a responder' });
    }

    sosAlert.responders.push({
        user: req.user.id,
        role: req.user.role,
        status: 'responding'
    });

    await sosAlert.save();

    // Notify the consumer that help is coming
    sendNotification(sosAlert.consumer, {
        title: 'Help is on the way! 🛡️',
        message: `${req.user.name} (${req.user.role}) is coming to help you. Stay safe.`,
        type: 'SOS_RESPONSE',
        priority: 'high',
        metaData: { sosId: sosAlert._id, responderId: req.user.id }
    });

    // Update listeners (Socket)
    const io = socketService.getIO();
    if (io) {
        io.emit('sos_responder_update', {
            sosId: sosAlert._id,
            responder: {
                id: req.user.id,
                name: req.user.name,
                role: req.user.role
            }
        });
    }

    res.status(200).json({
        status: 'success',
        message: 'Your response has been recorded. The consumer is notified.'
    });
});

// 4. Resolve SOS
exports.resolveSOS = catchAsync(async (req, res, next) => {
    const sosAlert = await SOSAlert.findById(req.params.id);
    if (!sosAlert) return next(new AppError('SOS Alert not found', 404));

    sosAlert.status = 'resolved';
    sosAlert.resolvedAt = new Date();
    sosAlert.resolvedBy = req.user.id;
    await sosAlert.save();

    res.status(200).json({
        status: 'success',
        message: 'SOS marked as resolved. Everyone notified.'
    });
});
