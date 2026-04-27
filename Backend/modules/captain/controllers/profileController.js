const Captain = require('../../../models/Captain');
const Booking = require('../../../models/Booking');
const razorpay = require('../../../config/razorpay');
const crypto = require('crypto');
const Setting = require('../../../models/Setting');
const { sendAdminNotification } = require('../../../utils/notificationService');

const CAPTAIN_KIT_PRICE = 1499;
const DEFAULT_CAPTAIN_KIT_CONFIG = {
    title: 'Starter Captain Kit',
    subtitle: 'Complete payment to unlock your apartment wash dashboard.',
    kitPrice: CAPTAIN_KIT_PRICE,
    imageUrls: [
        'https://images.unsplash.com/photo-1517602302552-471fe67acf66?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1485291571150-772bcfc10da5?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80'
    ]
};

const getCaptainKitConfig = async () => {
    const setting = await Setting.findOne({ key: 'captain_kit_config' }).select('value').lean();
    if (!setting) return DEFAULT_CAPTAIN_KIT_CONFIG;
    return {
        ...DEFAULT_CAPTAIN_KIT_CONFIG,
        ...setting.value
    };
};

exports.getProfile = async (req, res) => {
    try {
        const captain = await Captain.findById(req.captain.id);
        captain.password = undefined;
        captain.otp = undefined;

        const completedCount = await Booking.countDocuments({
            'provider.id': req.captain.id,
            status: 'completed',
            isActive: true
        });
        const completed = await Booking.find({
            'provider.id': req.captain.id,
            status: 'completed',
            isActive: true
        }).select('pricing.totalAmount');
        const totalEarned = completed.reduce((s, b) => s + (b.pricing?.totalAmount || 0), 0);

        const profileData = captain.toObject();
        profileData.stats = {
            rating: captain.rating || 5.0,
            jobsCompleted: completedCount,
            totalEarned,
            walletBalance: captain.wallet?.balance || 0
        };

        res.status(200).json({
            status: 'success',
            data: { captain: profileData }
        });
    } catch (error) {
        console.error('Captain getProfile error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get profile.'
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, email, city, vehicleType, plate, kit, experience, avatar } = req.body;
        const captain = await Captain.findById(req.captain.id);

        if (!captain) {
            return res.status(404).json({ status: 'fail', message: 'Captain not found.' });
        }

        if (name !== undefined) captain.name = name;
        if (email !== undefined) captain.email = email;
        if (!captain.profile) captain.profile = {};
        if (city !== undefined) captain.profile.city = city;
        if (vehicleType !== undefined) captain.profile.vehicleType = vehicleType;
        if (plate !== undefined) captain.profile.plate = plate;
        if (kit !== undefined) captain.profile.kit = kit;
        if (experience !== undefined) captain.profile.experience = experience;
        if (avatar !== undefined) captain.profile.avatar = avatar;

        await captain.save({ validateBeforeSave: false });
        captain.password = undefined;
        captain.otp = undefined;

        res.status(200).json({
            status: 'success',
            message: 'Profile updated successfully',
            data: { captain }
        });
    } catch (error) {
        console.error('Captain updateProfile error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update profile.'
        });
    }
};

exports.updateLocation = async (req, res) => {
    try {
        const { lat, lng } = req.body;
        
        if (lat === undefined || lng === undefined) {
            return res.status(400).json({
                status: 'fail',
                message: 'Latitude and longitude are required'
            });
        }

        const captain = await Captain.findById(req.captain.id);
        
        if (!captain) {
            return res.status(404).json({ status: 'fail', message: 'Captain not found.' });
        }

        captain.location = {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)] // GeoJSON expects [lng, lat]
        };

        // Turn captain online automatically if they update location while supposedly offline 
        // Or keep current logic. We'll just update location strictly here.
        await captain.save({ validateBeforeSave: false });

        res.status(200).json({
            status: 'success',
            message: 'Location updated successfully',
            data: { location: captain.location }
        });

    } catch (error) {
        console.error('Captain updateLocation error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update live location.'
        });
    }
};

exports.getNotifications = async (req, res) => {
    try {
        const Notification = require('../../../models/Notification');
        const options = {
            page: req.query.page || 1,
            limit: req.query.limit || 20,
            type: req.query.type,
            isRead: req.query.isRead,
            priority: req.query.priority
        };

        const result = await Notification.getCaptainNotifications(req.captain.id, options);
        res.status(200).json({
            status: 'success',
            ...result
        });
    } catch (error) {
        console.error('Captain getNotifications error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch notifications.' });
    }
};

exports.markNotificationRead = async (req, res) => {
    try {
        const Notification = require('../../../models/Notification');
        const notification = await Notification.findOne({
            _id: req.params.notificationId,
            captain: req.captain.id
        });

        if (!notification) {
            return res.status(404).json({ status: 'fail', message: 'Notification not found' });
        }

        await notification.markAsRead();
        res.status(200).json({ status: 'success', message: 'Notification marked as read' });
    } catch (error) {
        console.error('Captain markNotificationRead error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update notification.' });
    }
};

exports.markAllNotificationsRead = async (req, res) => {
    try {
        const Notification = require('../../../models/Notification');
        await Notification.updateMany(
            { captain: req.captain.id, isRead: false },
            { isRead: true }
        );
        res.status(200).json({ status: 'success', message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Captain markAllNotificationsRead error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update notifications.' });
    }
};

exports.clearNotifications = async (req, res) => {
    try {
        const Notification = require('../../../models/Notification');
        await Notification.deleteMany({ captain: req.captain.id });
        res.status(200).json({ status: 'success', message: 'Notifications cleared successfully' });
    } catch (error) {
        console.error('Captain clearNotifications error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to clear notifications.' });
    }
};

exports.getKitConfig = async (req, res) => {
    try {
        const config = await getCaptainKitConfig();
        res.status(200).json({ status: 'success', data: config });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to get kit config' });
    }
};

exports.getKitPaymentKey = async (req, res) => {
    try {
        if (!razorpay || !razorpay.key_id) {
            return res.status(500).json({ status: 'fail', message: 'Payment gateway not configured' });
        }
        res.status(200).json({ status: 'success', data: { key_id: razorpay.key_id } });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

exports.createKitPaymentOrder = async (req, res) => {
    try {
        const captain = await Captain.findById(req.captain.id);
        if (!captain) return res.status(404).json({ status: 'fail', message: 'Captain not found' });

        const kitConfig = await getCaptainKitConfig();
        const amount = Number(kitConfig.kitPrice || CAPTAIN_KIT_PRICE);
        
        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100),
            currency: 'INR',
            receipt: `ckit_${captain._id.toString().slice(-8)}_${Date.now()}`,
            payment_capture: 1,
            notes: { captainId: captain._id.toString(), purpose: 'captain_kit' }
        });

        captain.profile.kit = {
            ...captain.profile.kit,
            razorpayOrderId: order.id,
            price: amount
        };
        await captain.save({ validateBeforeSave: false });

        res.status(200).json({
            status: 'success',
            data: {
                order_id: order.id,
                amount: order.amount,
                currency: order.currency,
                kitPrice: amount
            }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message || 'Could not create payment order' });
    }
};

exports.verifyKitPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ status: 'fail', message: 'Payment details missing' });
        }

        const captain = await Captain.findById(req.captain.id);
        const secret = process.env.RAZORPAY_KEY_SECRET;
        const generatedSignature = crypto.createHmac('sha256', secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ status: 'fail', message: 'Invalid signature' });
        }

        captain.profile.kit.status = 'COMPLETED';
        captain.profile.kit.razorpayPaymentId = razorpay_payment_id;
        captain.profile.kit.paidAt = new Date();
        captain.profile.kit.verifiedAt = new Date();
        
        if (captain.status === 'verified_pending_kit') {
            captain.status = 'ACTIVE';
        }
        
        await captain.save({ validateBeforeSave: false });

        await sendAdminNotification({
            title: 'Captain Kit Purchased',
            message: `${captain.name} has completed the kit purchase.`,
            type: 'payment',
            priority: 'medium',
            metaData: { captainId: captain._id }
        });

        res.status(200).json({ status: 'success', message: 'Payment verified successfully' });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};
