const SubscriptionPlan = require('../../../models/SubscriptionPlan');
const Subscription = require('../../../models/Subscription');

// Get all subscription plans
exports.getPlans = async (req, res) => {
    try {
        const plans = await SubscriptionPlan.find({ isActive: true }).sort({ price: 1 });
        res.status(200).json({
            status: 'success',
            results: plans.length,
            data: { plans }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Get all user subscriptions (Active/Expired) - New for Admin Visibility
exports.getAllSubscriptions = async (req, res) => {
    try {
        const { status, hubId } = req.query;
        const query = {};
        
        if (status) query.status = status;
        if (hubId) query.hub = hubId;

        const subscriptions = await Subscription.find(query)
            .populate('user', 'name email phone profile')
            .populate('vehicle', 'brand model plate type')
            .populate('hub', 'name city location')
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            results: subscriptions.length,
            data: { subscriptions }
        });
    } catch (error) {
        console.error('Error fetching subscriptions for admin:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch subscriptions' });
    }
};

// Create a new subscription plan
exports.createPlan = async (req, res) => {
    try {
        const newPlan = await SubscriptionPlan.create(req.body);
        res.status(201).json({
            status: 'success',
            data: { plan: newPlan }
        });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

// Update an existing plan
exports.updatePlan = async (req, res) => {
    try {
        const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!plan) {
            return res.status(404).json({ status: 'fail', message: 'Plan not found' });
        }

        res.status(200).json({
            status: 'success',
            data: { plan }
        });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};

// Delete a plan (Soft delete by setting isActive: false)
exports.deletePlan = async (req, res) => {
    try {
        const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, { isActive: false });

        if (!plan) {
            return res.status(404).json({ status: 'fail', message: 'Plan not found' });
        }

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};
