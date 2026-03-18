const Captain = require('../../../models/Captain');
const Booking = require('../../../models/Booking');

const LEVELS = [
    { name: 'Rookie', minWashes: 0, maxWashes: 100, perks: [] },
    { name: 'Pro', minWashes: 101, maxWashes: 500, perks: ['+5% Payout'] },
    { name: 'Elite', minWashes: 501, maxWashes: 2000, perks: ['+10% Payout', 'Priority Jobs', 'Zero Penalty', 'Badges'] },
    { name: 'Legend', minWashes: 2001, maxWashes: Infinity, perks: ['+15% Payout', 'VIP Status', 'All Elite Perks'] }
];

exports.getRewards = async (req, res) => {
    try {
        const captainId = req.captain.id;
        const washCount = await Booking.countDocuments({
            'provider.id': captainId,
            status: 'completed',
            isActive: true
        });

        let currentLevel = LEVELS[0];
        let nextLevel = LEVELS[1];
        let progress = 0;
        let washesToNext = 0;

        for (let i = 0; i < LEVELS.length; i++) {
            if (washCount >= LEVELS[i].minWashes) {
                currentLevel = LEVELS[i];
                nextLevel = LEVELS[i + 1] || LEVELS[i];
            }
        }

        if (nextLevel && nextLevel.maxWashes !== Infinity) {
            washesToNext = Math.max(0, nextLevel.minWashes - washCount);
            const range = nextLevel.minWashes - currentLevel.minWashes;
            progress = range > 0 ? Math.round(((washCount - currentLevel.minWashes) / range) * 100) : 100;
        } else {
            progress = 100;
        }

        const levelsWithStatus = LEVELS.map((l) => ({
            ...l,
            completed: l.maxWashes !== Infinity && washCount >= l.maxWashes,
            current: l.name === currentLevel.name,
            locked: washCount < l.minWashes
        }));

        res.status(200).json({
            status: 'success',
            data: {
                washCount,
                currentLevel: currentLevel.name,
                nextLevel: nextLevel?.name,
                progress,
                washesToNext,
                levels: levelsWithStatus,
                perks: currentLevel.perks || []
            }
        });
    } catch (error) {
        console.error('Captain getRewards error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch rewards.' });
    }
};
