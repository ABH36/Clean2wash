const Campaign = require('../../../models/Campaign');
const AuditLog = require('../../../models/AuditLog');

/**
 * ─── ADMIN CAMPAIGN CONTROLLER ──────────────────────────────────────────
 * Managed dynamic social media campaigns and tracking.
 */

exports.getAllCampaigns = async (req, res) => {
    try {
        const { platform, status } = req.query;
        const query = { isActive: true };
        
        if (platform && platform !== 'All') query.platform = platform;
        if (status && status !== 'All') query.status = status;

        const campaigns = await Campaign.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            results: campaigns.length,
            data: { campaigns }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch campaigns' });
    }
};

exports.createCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.create({
            ...req.body,
            createdBy: req.user._id
        });

        await AuditLog.create({
            userId: req.user._id,
            action: 'CREATE_CAMPAIGN',
            resource: 'Campaign',
            resourceId: campaign._id,
            newValue: campaign.name
        });

        res.status(201).json({
            status: 'success',
            data: { campaign }
        });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

exports.updateCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!campaign) {
            return res.status(404).json({ status: 'fail', message: 'Campaign not found' });
        }

        res.status(200).json({
            status: 'success',
            data: { campaign }
        });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

exports.deleteCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.findByIdAndUpdate(req.params.id, { isActive: false });

        if (!campaign) {
            return res.status(404).json({ status: 'fail', message: 'Campaign not found' });
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to delete campaign' });
    }
};

exports.getCampaignStats = async (req, res) => {
    try {
        const stats = await Campaign.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: '$platform',
                    totalClicks: { $sum: '$metrics.clicks' },
                    totalImpressions: { $sum: '$metrics.impressions' },
                    totalSpend: { $sum: '$metrics.spend' },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: { stats }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to aggregate campaign stats' });
    }
};
