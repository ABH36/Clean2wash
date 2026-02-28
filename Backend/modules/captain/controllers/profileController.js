const Captain = require('../models/Captain');
const Booking = require('../../consumer/models/Booking');

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
