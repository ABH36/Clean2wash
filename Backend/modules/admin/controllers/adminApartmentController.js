const Hub = require('../../../models/Hub');
const Captain = require('../../../models/Captain');
const Subscription = require('../../../models/Subscription');
const SubscriptionPlan = require('../../../models/SubscriptionPlan');
const Booking = require('../../../models/Booking');
const MasterData = require('../../../models/MasterData');
const { sendCaptainNotification, sendNotification } = require('../../../utils/notificationService');

const APARTMENT_SERVICE_ALIASES = ['APARTMENT_WASH', 'APARTMENT-WASH', 'APARTMENT WASH', 'APARTMENT', 'APARTMENTS'];

const normalizeApartmentToken = (value = '') => String(value).toUpperCase().replace(/[^A-Z0-9]+/g, '_');

const isApartmentPlan = (plan = {}) => {
    return plan.moduleScope === 'apartment-wash';
};

const isApartmentSubscription = (subscription = {}) => {
    if (subscription.moduleScope === 'apartment-wash') return true;
    if (normalizeApartmentToken(subscription.service?.key) === 'APARTMENT_WASH') return true;
    const applicable = Array.isArray(subscription.applicableServices) ? subscription.applicableServices : [];
    const normalized = applicable.map(normalizeApartmentToken);
    return normalized.includes('APARTMENT_WASH');
};

exports.getApartmentWashConsole = async (req, res) => {
    try {
        const [
            service,
            hubs,
            captains,
            plans,
            subscriptions,
            bookings
        ] = await Promise.all([
            MasterData.findOne({
                type: 'SERVICE',
                $or: [
                    { key: 'APARTMENT_WASH' },
                    { 'metadata.path': '/apartments' },
                    { 'metadata.id': 'apartment-wash' }
                ]
            }).lean(),
            Hub.find({
                isActive: true,
                $or: [
                    { 'metadata.isSociety': true },
                    { serviceTags: 'APARTMENT_WASH' }
                ]
            })
                .populate('vendor', 'name profile.studioName')
                .lean(),
            Captain.find({})
                .select('name phone isOnline isVerified rating profile location createdAt')
                .lean(),
            SubscriptionPlan.find({ isActive: true, moduleScope: 'apartment-wash' }).sort({ price: 1 }).lean(),
            Subscription.find({
                status: { $in: ['pending', 'active', 'paused', 'rejected'] }
            })
                .populate('user', 'name phone')
                .populate('vehicle', 'brand model plate type')
                .populate('hub', 'name city')
                .sort({ createdAt: -1 })
                .lean(),
            Booking.find({
                'service.category': 'Apartment',
                isActive: true
            })
                .populate('consumer', 'name phone')
                .populate('vehicle', 'brand model plate type')
                .populate('provider.id', 'name phone isOnline')
                .populate('location.hubId', 'name city')
                .sort({ 'schedule.date': 1, createdAt: -1 })
                .limit(200)
                .lean()
        ]);

        const apartmentPlans = plans.filter(isApartmentPlan);
        const apartmentSubscriptions = subscriptions.filter(isApartmentSubscription);

        const mappedCaptains = captains.map((captain) => ({
            ...captain,
            mappedHub: captain.profile?.hub || '',
            apartmentReady: !!captain.profile?.hub && captain.isVerified && captain.isActive
        }));
        const eligibleApartmentCaptains = mappedCaptains.filter((captain) => captain.isVerified && captain.isActive);

        const apartmentHubs = hubs.map((hub) => {
            const mapped = eligibleApartmentCaptains.filter((captain) => captain.profile?.hub === hub.name);
            const liveSubscriptions = apartmentSubscriptions.filter((subscription) => String(subscription.hub?._id || subscription.hub) === String(hub._id));
            const liveBookings = bookings.filter((booking) => String(booking.location?.hubId?._id || booking.location?.hubId) === String(hub._id));
            const recommendedCaptains = Math.max(1, Math.ceil(liveSubscriptions.length / 10));

            return {
                ...hub,
                mappedCaptains: mapped,
                mappedCaptainCount: mapped.length,
                liveSubscriptionsCount: liveSubscriptions.length,
                liveBookingsCount: liveBookings.length,
                recommendedCaptains,
                captainGap: Math.max(0, recommendedCaptains - mapped.length)
            };
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayBookings = bookings.filter((booking) => {
            const scheduleDate = booking.schedule?.date ? new Date(booking.schedule.date) : null;
            return scheduleDate && scheduleDate >= today && scheduleDate < tomorrow;
        });

        const stats = {
            societies: apartmentHubs.length,
            mappedCaptains: eligibleApartmentCaptains.filter((captain) => captain.profile?.hub).length,
            verifiedCaptains: eligibleApartmentCaptains.length,
            pendingApprovals: apartmentSubscriptions.filter((subscription) => subscription.status === 'pending').length,
            activeSubscriptions: apartmentSubscriptions.filter((subscription) => subscription.status === 'active').length,
            pausedSubscriptions: apartmentSubscriptions.filter((subscription) => subscription.status === 'paused').length,
            todayBookings: todayBookings.length,
            liveBookings: bookings.filter((booking) => !['completed', 'cancelled', 'refunded'].includes(booking.status)).length,
            capacityRiskHubs: apartmentHubs.filter((hub) => hub.captainGap > 0).length
        };

        res.status(200).json({
            status: 'success',
            data: {
                stats,
                service,
                hubs: apartmentHubs,
                captains: mappedCaptains,
                plans: apartmentPlans,
                subscriptions: apartmentSubscriptions,
                bookings
            }
        });
    } catch (error) {
        console.error('Error fetching apartment wash console:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch apartment wash console' });
    }
};

exports.reviewApartmentSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, reason = '', captainId = '' } = req.body;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ status: 'error', message: 'Invalid review action' });
        }

        const subscription = await Subscription.findById(id).populate('hub');
        if (!subscription || !isApartmentSubscription(subscription)) {
            return res.status(404).json({ status: 'error', message: 'Apartment subscription request not found' });
        }

        if (action === 'reject') {
            // ... (keep rejection logic as is)
            subscription.status = 'rejected';
            subscription.review = {
                ...(subscription.review || {}),
                rejectionReason: String(reason || '').trim(),
                reviewedAt: new Date(),
                reviewedBy: req.user?._id || undefined
            };
            await subscription.save();

            const rejectionReason = subscription.review?.rejectionReason || 'Please review the apartment, parking route, or slot details and submit the request again.';

            await sendNotification(subscription.user, {
                title: 'Apartment Request Needs Update',
                message: `Your apartment wash request for ${subscription.hub?.name || 'the selected apartment'} was not approved. Reason: ${rejectionReason}`,
                type: 'subscription',
                priority: 'high',
                actionUrl: '/apartment-wash',
                metaData: {
                    subscriptionId: subscription._id.toString(),
                    status: 'rejected',
                    rejectionReason,
                    serviceKey: 'APARTMENT_WASH'
                }
            });

            return res.status(200).json({
                status: 'success',
                message: 'Apartment subscription request rejected',
                data: { subscription }
            });
        }

        // Approval Logic
        if (captainId) {
            const selectedCaptain = await Captain.findOne({
                _id: captainId,
                isActive: true,
                isVerified: true
            }).select('_id');

            if (!selectedCaptain) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Selected captain must be active and verified before approval'
                });
            }

            // Map the selected captain to this apartment hub
            await Captain.findByIdAndUpdate(captainId, {
                $set: { 'profile.hub': subscription.hub?.name || '' }
            });
            console.log(`Captain ${captainId} mapped to hub ${subscription.hub?.name} during apartment approval`);
        }

        const mappedCaptains = await Captain.find({
            isActive: true,
            isVerified: true,
            'profile.hub': subscription.hub?.name || ''
        }).select('_id name');

        if (!mappedCaptains.length) {
            return res.status(400).json({
                status: 'error',
                message: 'Map at least one active verified captain to this apartment before approval'
            });
        }

        await Subscription.updateMany(
            {
                _id: { $ne: subscription._id },
                user: subscription.user,
                moduleScope: 'apartment-wash',
                status: 'active'
            },
            { status: 'expired' }
        );

        subscription.status = 'active';
        subscription.review = {
            ...(subscription.review || {}),
            rejectionReason: '',
            reviewedAt: new Date(),
            reviewedBy: req.user?._id || undefined
        };
        await subscription.save();

        if (subscription.hub) {
            await Hub.findByIdAndUpdate(subscription.hub._id, {
                $set: {
                    'metadata.pendingApproval': false
                }
            });
        }

        await sendNotification(subscription.user, {
            title: 'Apartment Wash Approved',
            message: `Your apartment wash plan for ${subscription.hub?.name || 'your apartment'} is approved. Captains are mapped and the service will run in your selected slot.`,
            type: 'subscription',
            priority: 'high',
            actionUrl: '/apartment-wash',
            metaData: {
                subscriptionId: subscription._id.toString(),
                status: 'active',
                serviceKey: 'APARTMENT_WASH'
            }
        });

        await Promise.all(mappedCaptains.map((captain) => (
            sendCaptainNotification(captain._id, {
                title: 'Apartment Wash Base Updated',
                message: `A customer request at ${subscription.hub?.name || 'your mapped apartment'} is now approved. Upcoming apartment wash missions will route through your apartment desk.`,
                type: 'booking',
                priority: 'medium',
                actionUrl: '/captain/apartment-route',
                metaData: {
                    subscriptionId: subscription._id.toString(),
                    hubId: subscription.hub?._id?.toString() || '',
                    serviceKey: 'APARTMENT_WASH'
                }
            })
        )));

        return res.status(200).json({
            status: 'success',
            message: 'Apartment subscription approved and captain-ready',
            data: { subscription }
        });
    } catch (error) {
        console.error('Error reviewing apartment subscription:', error);
        return res.status(500).json({ status: 'error', message: 'Failed to review apartment subscription' });
    }
};
