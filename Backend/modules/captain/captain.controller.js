const ErrorResponse = require('../../utils/errorResponse');
const Captain = require('../../models/Captain');
const Booking = require('../../models/Booking');

// @desc    Auth Captain (Login/Register)
// @route   POST /api/v1/captain/auth
// @access  Public
exports.authCaptain = async (req, res, next) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return next(new ErrorResponse('Please provide a phone number', 400));
        }

        let captain = await Captain.findOne({ phone }).select('+password');

        if (!captain) {
            // In real app, we would redirect to signup. 
            // For now, let's allow implicit creation for testing if needed, 
            // but usually Captains must register through signup.
            return next(new ErrorResponse('Captain not found. Please sign up.', 404));
        }

        // Return token
        sendTokenResponse(captain, 200, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Register Captain
// @route   POST /api/v1/captain/register
// @access  Public
exports.registerCaptain = async (req, res, next) => {
    try {
        const captain = await Captain.create(req.body);
        sendTokenResponse(captain, 201, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Get current captain
// @route   GET /api/v1/captain/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const captain = await Captain.findById(req.user.id);
        res.status(200).json({
            success: true,
            data: captain
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Go Online/Offline
// @route   PUT /api/v1/captain/status
// @access  Private
exports.toggleStatus = async (req, res, next) => {
    try {
        const { isOnline } = req.body;
        const captain = await Captain.findByIdAndUpdate(req.user.id, { isOnline }, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: captain
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get Available Jobs (Nearby)
// @route   GET /api/v1/captain/jobs/available
// @access  Private
exports.getAvailableJobs = async (req, res, next) => {
    try {
        // Find bookings with status 'pending' (for doorstep) or 'confirmed' (for studio pickup if captain handles that)
        // For now, doorstep eco wash
        const jobs = await Booking.find({ status: 'pending' }).populate('service');

        res.status(200).json({
            success: true,
            count: jobs.length,
            data: jobs
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Accept a Job
// @route   PUT /api/v1/captain/jobs/:id/accept
// @access  Private
exports.acceptJob = async (req, res, next) => {
    try {
        let booking = await Booking.findById(req.params.id);

        if (!booking) {
            return next(new ErrorResponse('Job not found', 404));
        }

        if (booking.status !== 'pending') {
            return next(new ErrorResponse('Job already taken', 400));
        }

        booking.captain = req.user.id;
        booking.status = 'confirmed';
        await booking.save();

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update Job Status (Arrived, Started, Completed)
// @route   PUT /api/v1/captain/jobs/:id/status
// @access  Private
exports.updateJobStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        let booking = await Booking.findById(req.params.id);

        if (!booking) {
            return next(new ErrorResponse('Job not found', 404));
        }

        if (booking.captain.toString() !== req.user.id) {
            return next(new ErrorResponse('Not authorized to update this job', 401));
        }

        booking.status = status;
        await booking.save();

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (err) {
        next(err);
    }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
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
