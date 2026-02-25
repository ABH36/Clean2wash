const ErrorResponse = require('../../utils/errorResponse');
const Consumer = require('../../models/Consumer');

// @desc    Register or Login Consumer (Mock OTP logic)
// @route   POST /api/v1/consumer/auth
// @access  Public
exports.authConsumer = async (req, res, next) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return next(new ErrorResponse('Please provide a phone number', 400));
        }

        // Find consumer by phone
        let consumer = await Consumer.findOne({ phone });

        // If not found, create a new one (Implicit Registration)
        if (!consumer) {
            consumer = await Consumer.create({
                phone,
                name: `User_${phone.slice(-4)}` // Temporary naming
            });
        }

        // In a real app, we would send OTP here.
        // For now, we return a token directly as if OTP was verified.
        sendTokenResponse(consumer, 200, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Get current logged in consumer
// @route   GET /api/v1/consumer/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const consumer = await Consumer.findById(req.user.id);
        res.status(200).json({
            success: true,
            data: consumer
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update consumer profile
// @route   PUT /api/v1/consumer/update-profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
    try {
        const fieldsToUpdate = {
            name: req.body.name,
            email: req.body.email
        };

        const consumer = await Consumer.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: consumer
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Add a vehicle
// @route   POST /api/v1/consumer/vehicles
// @access  Private
exports.addVehicle = async (req, res, next) => {
    try {
        const consumer = await Consumer.findById(req.user.id);

        // If this is the first vehicle, make it primary
        if (consumer.vehicles.length === 0) {
            req.body.isPrimary = true;
        }

        consumer.vehicles.push(req.body);
        await consumer.save();

        res.status(200).json({
            success: true,
            data: consumer.vehicles
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete a vehicle
// @route   DELETE /api/v1/consumer/vehicles/:id
// @access  Private
exports.deleteVehicle = async (req, res, next) => {
    try {
        const consumer = await Consumer.findById(req.user.id);
        consumer.vehicles = consumer.vehicles.filter(v => v._id.toString() !== req.params.id);
        await consumer.save();

        res.status(200).json({
            success: true,
            data: consumer.vehicles
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Add an address
// @route   POST /api/v1/consumer/addresses
// @access  Private
exports.addAddress = async (req, res, next) => {
    try {
        const consumer = await Consumer.findById(req.user.id);

        if (consumer.addresses.length === 0) {
            req.body.isPrimary = true;
        }

        consumer.addresses.push(req.body);
        await consumer.save();

        res.status(200).json({
            success: true,
            data: consumer.addresses
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete an address
// @route   DELETE /api/v1/consumer/addresses/:id
// @access  Private
exports.deleteAddress = async (req, res, next) => {
    try {
        const consumer = await Consumer.findById(req.user.id);
        consumer.addresses = consumer.addresses.filter(a => a._id.toString() !== req.params.id);
        await consumer.save();

        res.status(200).json({
            success: true,
            data: consumer.addresses
        });
    } catch (err) {
        next(err);
    }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token
        });
};
