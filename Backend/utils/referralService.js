const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const walletHelper = require('./walletHelper');
const { sendNotification } = require('./notificationService');
const Promotion = require('../models/Promotion');

/**
 * Centrally processes referral rewards when a user completes their first booking.
 * @param {String} refereeId - The ID of the user who completed the booking.
 * @param {String} bookingId - The ID of the completed booking.
 */
exports.processReferralReward = async (refereeId, bookingId) => {
    try {
        const referee = await User.findById(refereeId);
        if (!referee || !referee.referredBy) return;

        // 1. Check if this is the first completed booking
        const Booking = require('../models/Booking');
        const completedCount = await Booking.countDocuments({
            consumer: refereeId,
            status: 'completed',
            isActive: true
        });

        // We run this AFTER the current booking is marked completed, 
        // so if count is 1, it means this was the first one.
        if (completedCount !== 1) return;

        // 2. Find Referrer
        const referrer = await User.findById(referee.referredBy);
        if (!referrer) return;

        // 3. Get Reward Values (Default or from Promotion)
        let referrerReward = 50;
        let refereeReward = 50;

        const referralPromo = await Promotion.findOne({
            code: 'REFERRAL',
            isActive: true
        });

        if (referralPromo) {
            referrerReward = referralPromo.discountValue || 50;
            // Assuming referee reward is same for now, or could be in metadata
            refereeReward = referralPromo.metadata?.refereeReward || 50;
        }

        // 4. Execute Credits
        const session = await User.startSession();
        try {
            await session.withTransaction(async () => {
                // Credit Referrer
                await walletHelper.executeWalletTransaction(
                    referrer._id,
                    referrerReward,
                    'credit',
                    {
                        category: 'REFERRAL',
                        description: `Referral Reward: ${referee.name} completed their first wash!`,
                        referenceId: bookingId,
                        referenceType: 'booking'
                    },
                    session
                );

                // Credit Referee
                await walletHelper.executeWalletTransaction(
                    referee._id,
                    refereeReward,
                    'credit',
                    {
                        category: 'REFERRAL',
                        description: `Welcome Reward: Referral from ${referrer.name}`,
                        referenceId: bookingId,
                        referenceType: 'booking'
                    },
                    session
                );

                // Update Referrer stats
                await User.findByIdAndUpdate(referrer._id, {
                    $inc: {
                        referralsCount: 1,
                        totalReferralEarnings: referrerReward
                    }
                }, { session });
            });
            await session.endSession();

            // 5. Send Notifications (Aligned with Phase 4 standards)
            await sendNotification(referrer._id, {
                title: 'Referral Reward! 🎁',
                message: `You earned ₹${referrerReward} credits from ${referee.name}'s first wash.`,
                type: 'promotion',
                priority: 'medium',
                metaData: { referralId: referee._id }
            });

            await sendNotification(referee._id, {
                title: 'Referral Bonus! ✨',
                message: `₹${refereeReward} Referral bonus added to your wallet. Happy washing!`,
                type: 'promotion',
                priority: 'medium',
                metaData: { bookingId: bookingId }
            });

            console.log(`Referral reward processed for booking ${bookingId}. Referrer: ${referrer._id}, Referee: ${referee._id}`);

        } catch (error) {
            await session.endSession();
            throw error;
        }

    } catch (error) {
        console.error('Referral Processing Error:', error);
    }
};
