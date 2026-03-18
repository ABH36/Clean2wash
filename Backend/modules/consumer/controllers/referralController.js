const User = require('../../../models/User');

// Get current user referral status
exports.getReferralStats = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('referralCode referralsCount totalReferralEarnings');

        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'User not found'
            });
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
    } catch (error) {
        console.error('Error in getReferralStats:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch referral stats'
        });
    }
};
