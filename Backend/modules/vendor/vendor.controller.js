const ErrorResponse = require('../../utils/errorResponse');
const Vendor = require('../../models/Vendor');
const Booking = require('../../models/Booking');
const Captain = require('../../models/Captain');
const Product = require('../../models/Product');

// @desc    Register Vendor
// @route   POST /api/v1/vendor/register
// @access  Public
exports.registerVendor = async (req, res, next) => {
    try {
        const vendor = await Vendor.create(req.body);
        sendTokenResponse(vendor, 201, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Login Vendor
// @route   POST /api/v1/vendor/login
// @access  Public
exports.loginVendor = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return next(new ErrorResponse('Please provide an email and password', 400));
        }

        // Check for vendor
        const vendor = await Vendor.findOne({ email }).select('+password');

        if (!vendor) {
            return next(new ErrorResponse('Invalid credentials', 401));
        }

        // Check if password matches
        const isMatch = await vendor.matchPassword(password);

        if (!isMatch) {
            return next(new ErrorResponse('Invalid credentials', 401));
        }

        sendTokenResponse(vendor, 200, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Get current vendor
// @route   GET /api/v1/vendor/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const vendor = await Vendor.findById(req.user.id);
        res.status(200).json({
            success: true,
            data: vendor
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get Vendor Dashboard Stats
// @route   GET /api/v1/vendor/dashboard
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
    try {
        const totalBookings = await Booking.countDocuments({ vendor: req.user.id });
        const pendingBookings = await Booking.countDocuments({ vendor: req.user.id, status: 'pending' });
        const completedBookings = await Booking.countDocuments({ vendor: req.user.id, status: 'completed' });

        const vendor = await Vendor.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: {
                totalBookings,
                pendingBookings,
                completedBookings,
                earnings: vendor.earnings,
                wallet: vendor.wallet
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get Studio Roster (Staff)
// @route   GET /api/v1/vendor/staff
// @access  Private
exports.getStaff = async (req, res, next) => {
    try {
        // Staff associated with this vendor
        const staff = await Captain.find({ studio: req.user.id }); // Using 'studio' field in Captain or adding 'vendorId'

        res.status(200).json({
            success: true,
            count: staff.length,
            data: staff
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Add Staff to Roster
// @route   POST /api/v1/vendor/staff
// @access  Private
exports.addStaff = async (req, res, next) => {
    try {
        const { phone } = req.body;
        let captain = await Captain.findOne({ phone });

        if (!captain) {
            return next(new ErrorResponse('Personnel not found in registry', 404));
        }

        captain.studio = req.user._id;
        await captain.save();

        res.status(200).json({
            success: true,
            data: captain
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Add or Update Service
// @route   POST /api/v1/vendor/services
// @access  Private
exports.manageService = async (req, res, next) => {
    try {
        const vendor = await Vendor.findById(req.user.id);
        const { id, name, price, duration, category, active } = req.body;

        if (id) {
            // Update
            const serviceIndex = vendor.services.findIndex(s => s._id.toString() === id);
            if (serviceIndex !== -1) {
                vendor.services[serviceIndex] = {
                    ...vendor.services[serviceIndex].toObject(),
                    name, price, duration, category, active
                };
            }
        } else {
            // Add
            vendor.services.push({ name, price, duration, category, active });
        }

        await vendor.save();
        res.status(200).json({ success: true, data: vendor.services });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete Service
// @route   DELETE /api/v1/vendor/services/:id
// @access  Private
exports.deleteService = async (req, res, next) => {
    try {
        const vendor = await Vendor.findById(req.user.id);
        vendor.services = vendor.services.filter(s => s._id.toString() !== req.params.id);
        await vendor.save();
        res.status(200).json({ success: true, data: vendor.services });
    } catch (err) {
        next(err);
    }
};

// @desc    Get Vendor Bookings
// @route   GET /api/v1/vendor/bookings
// @access  Private
exports.getBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.find({ vendor: req.user.id }).populate('consumer service captain');
        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update Vendor Subscription
// @route   PUT /api/v1/vendor/subscription
// @access  Private
exports.updateSubscription = async (req, res, next) => {
    try {
        const { plan } = req.body;
        const duration = 30; // 30 days

        const vendor = await Vendor.findByIdAndUpdate(
            req.user.id,
            {
                subscription: {
                    plan,
                    expiresAt: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
                    isActive: true
                }
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({ success: true, data: vendor });
    } catch (err) {
        next(err);
    }
};

// @desc    Handle Service Request (Accept/Reject)
// @route   PUT /api/v1/vendor/bookings/:id/handle
// @access  Private
exports.handleBooking = async (req, res, next) => {
    try {
        const { action } = req.body; // 'accept' or 'reject'
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return next(new ErrorResponse('Booking not found', 404));
        }

        if (action === 'accept') {
            booking.status = 'accepted';
            // Generate Pickup OTP
            booking.pickupOTP = Math.floor(100000 + Math.random() * 900000).toString();
        } else {
            booking.status = 'rejected';
        }

        await booking.save();
        res.status(200).json({ success: true, data: booking });
    } catch (err) {
        next(err);
    }
};

// @desc    Assign Task (Pickup/Drop)
// @route   PUT /api/v1/vendor/bookings/:id/assign
// @access  Private
exports.assignTask = async (req, res, next) => {
    try {
        const { staffId, taskType } = req.body; // taskType: 'pickup' or 'drop'
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return next(new ErrorResponse('Booking not found', 404));
        }

        if (taskType === 'pickup') {
            booking.pickupStaff = staffId;
            booking.status = 'pickup-assigned';
        } else {
            booking.dropStaff = staffId;
            booking.status = 'drop-assigned';
            // Generate Drop OTP
            booking.dropOTP = Math.floor(100000 + Math.random() * 900000).toString();
        }

        await booking.save();
        res.status(200).json({ success: true, data: booking });
    } catch (err) {
        next(err);
    }
};

// @desc    Update Booking Status (Studio Wash Flow)
// @route   PUT /api/v1/vendor/bookings/:id/status
// @access  Private
exports.updateBookingStatus = async (req, res, next) => {
    try {
        const { status, photos } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return next(new ErrorResponse('Booking not found', 404));
        }

        booking.status = status;

        if (status === 'at-studio' && photos) {
            booking.beforePhotos = photos;
        }

        if (status === 'wash-completed' && photos) {
            booking.afterPhotos = photos;
        }

        await booking.save();
        res.status(200).json({ success: true, data: booking });
    } catch (err) {
        next(err);
    }
};

// @desc    Manage Accessories (CRUD)
// @route   POST /api/v1/vendor/accessories
// @access  Private
exports.manageAccessory = async (req, res, next) => {
    try {
        const { id, name, price, salePrice, category, stock, description, image } = req.body;

        if (id) {
            // Update
            const accessory = await Product.findOneAndUpdate(
                { _id: id, vendor: req.user.id },
                req.body,
                { new: true, runValidators: true }
            );
            return res.status(200).json({ success: true, data: accessory });
        } else {
            // Create
            const accessory = await Product.create({
                ...req.body,
                vendor: req.user.id
            });
            return res.status(201).json({ success: true, data: accessory });
        }
    } catch (err) {
        next(err);
    }
};

// @desc    Delete Accessory
// @route   DELETE /api/v1/vendor/accessories/:id
// @access  Private
exports.deleteAccessory = async (req, res, next) => {
    try {
        const accessory = await Product.findOneAndDelete({ _id: req.params.id, vendor: req.user.id });
        if (!accessory) {
            return next(new ErrorResponse('Accessory not found or unauthorized', 404));
        }
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};

// @desc    Get Vendor Accessories
// @route   GET /api/v1/vendor/accessories
// @access  Private
exports.getAccessories = async (req, res, next) => {
    try {
        const accessories = await Product.find({ vendor: req.user.id });
        res.status(200).json({
            success: true,
            count: accessories.length,
            data: accessories
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Verify OTP (Pickup/Drop)
// @route   PUT /api/v1/vendor/bookings/:id/verify-otp
// @access  Private
exports.verifyOTP = async (req, res, next) => {
    try {
        const { otp, type } = req.body; // type: 'pickup' or 'drop'
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return next(new ErrorResponse('Booking not found', 404));
        }

        if (type === 'pickup') {
            if (booking.pickupOTP === otp) {
                booking.otpVerified.pickup = true;
                booking.status = 'picked-up';
            } else {
                return next(new ErrorResponse('Invalid Pickup OTP', 400));
            }
        } else {
            if (booking.dropOTP === otp) {
                booking.otpVerified.drop = true;
                booking.status = 'completed';

                // Update Vendor Earnings
                const vendor = await Vendor.findById(booking.vendor);
                if (vendor) {
                    vendor.earnings.total += (booking.price.final || 0);
                    vendor.earnings.daily += (booking.price.final || 0);
                    await vendor.save();
                }
            } else {
                return next(new ErrorResponse('Invalid Drop OTP', 400));
            }
        }

        await booking.save();
        res.status(200).json({ success: true, data: booking });
    } catch (err) {
        next(err);
    }
};

// Get token from model
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
