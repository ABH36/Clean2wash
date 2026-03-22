const User = require('../../../models/User');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

// Get current user referral status
exports.getReferralStats = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('referralCode referralsCount totalReferralEarnings');

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    // Fetch reward amounts from active promotion
    const Promotion = require('../../../models/Promotion');
    const activeReferral = await Promotion.findOne({
        type: 'Referrals',
        status: 'Active',
        isActive: true
    }).sort({ createdAt: -1 });

    res.status(200).json({
        status: 'success',
        data: {
            referralCode: user.referralCode,
            referralsCount: user.referralsCount || 0,
            totalEarnings: user.totalReferralEarnings || 0,
            rewardDetails: activeReferral || {
                userGets: '₹50',
                friendGets: '₹50',
                subtitle: 'Refer a friend and you both get ₹50 credits on the next premium wash!'
            }
        }
    });
});

