const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const Consumer = require('../models/Consumer');

// Get all bookings for a consumer
exports.getMyBookings = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        // Build filter
        const filter = { 
            consumer: req.consumer.id,
            isActive: true 
        };

        if (status) {
            filter.status = status;
        }

        const bookings = await Booking.find(filter)
            .populate('vehicle', 'brand model type plate image')
            .populate('provider.id', 'name phone rating photo')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Booking.countDocuments(filter);

        res.status(200).json({
            status: 'success',
            results: bookings.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
            data: {
                bookings
            }
        });

    } catch (error) {
        console.error('Error in getMyBookings:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get bookings. Please try again.'
        });
    }
};

// Get single booking
exports.getBooking = async (req, res) => {
    try {
        const booking = await Booking.findOne({
            _id: req.params.id,
            consumer: req.consumer.id,
            isActive: true
        })
        .populate('vehicle', 'brand model type plate image compliance')
        .populate('provider.id', 'name phone rating photo')
        .populate('consumer', 'name phone');

        if (!booking) {
            return res.status(404).json({
                status: 'fail',
                message: 'Booking not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                booking
            }
        });

    } catch (error) {
        console.error('Error in getBooking:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get booking. Please try again.'
        });
    }
};

// Create new booking
exports.createBooking = async (req, res) => {
    try {
        const {
            vehicleId,
            service,
            addons,
            schedule,
            location,
            paymentMethod = 'online'
        } = req.body;

        // Validate required fields
        if (!vehicleId || !service || !schedule) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide vehicle, service, and schedule details'
            });
        }

        // Check if vehicle belongs to consumer
        const vehicle = await Vehicle.findOne({
            _id: vehicleId,
            owner: req.consumer.id,
            isActive: true
        });

        if (!vehicle) {
            return res.status(404).json({
                status: 'fail',
                message: 'Vehicle not found or does not belong to you'
            });
        }

        // Get vehicle type multiplier
        const vehicleMultiplier = Vehicle.getTypeMultiplier(vehicle.type);

        // Calculate pricing
        const baseAmount = parseInt(service.basePrice || service.price?.replace(/[^\d]/g, '') || 299);
        const addonAmount = addons ? addons.reduce((sum, addon) => {
            return sum + (addon.included ? 0 : addon.price);
        }, 0) : 0;

        const totalAmount = Math.round((baseAmount * vehicleMultiplier) + addonAmount);

        // Create booking
        const newBooking = await Booking.create({
            consumer: req.consumer.id,
            vehicle: vehicleId,
            service: {
                id: service.id,
                name: service.name,
                category: service.category,
                type: service.type || 'captain',
                duration: service.duration,
                basePrice: baseAmount,
                features: service.features || []
            },
            pricing: {
                baseAmount,
                vehicleMultiplier,
                addonAmount,
                totalAmount
            },
            addons: addons || [],
            schedule: {
                type: schedule.type || 'instant',
                date: schedule.date,
                timeSlot: schedule.timeSlot,
                estimatedDuration: service.duration
            },
            location: location || {
                type: 'home',
                address: req.consumer.profile?.address
            },
            payment: {
                method: paymentMethod,
                status: paymentMethod === 'cash' ? 'pending' : 'pending'
            },
            provider: {
                type: service.type || 'captain',
                id: null
            }
        });

        // Populate booking details
        const populatedBooking = await Booking.findById(newBooking._id)
            .populate('vehicle', 'brand model type plate image')
            .populate('consumer', 'name phone');

        res.status(201).json({
            status: 'success',
            message: 'Booking created successfully',
            data: {
                booking: populatedBooking
            }
        });

    } catch (error) {
        console.error('Error in createBooking:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                status: 'fail',
                message: 'Validation failed',
                errors
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Failed to create booking. Please try again.'
        });
    }
};

// Update booking
exports.updateBooking = async (req, res) => {
    try {
        const { schedule, location, addons } = req.body;

        const booking = await Booking.findOne({
            _id: req.params.id,
            consumer: req.consumer.id,
            isActive: true
        });

        if (!booking) {
            return res.status(404).json({
                status: 'fail',
                message: 'Booking not found'
            });
        }

        // Check if booking can be modified
        if (!['pending', 'confirmed'].includes(booking.status)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Cannot modify booking after it has been assigned'
            });
        }

        // Update booking
        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            {
                schedule: schedule || booking.schedule,
                location: location || booking.location,
                addons: addons || booking.addons
            },
            { new: true, runValidators: true }
        ).populate('vehicle', 'brand model type plate image');

        res.status(200).json({
            status: 'success',
            message: 'Booking updated successfully',
            data: {
                booking: updatedBooking
            }
        });

    } catch (error) {
        console.error('Error in updateBooking:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update booking. Please try again.'
        });
    }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
    try {
        const { reason } = req.body;

        const booking = await Booking.findOne({
            _id: req.params.id,
            consumer: req.consumer.id,
            isActive: true
        });

        if (!booking) {
            return res.status(404).json({
                status: 'fail',
                message: 'Booking not found'
            });
        }

        // Check if booking can be cancelled
        if (!['pending', 'confirmed'].includes(booking.status)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Cannot cancel booking after it has been assigned'
            });
        }

        // Update booking status
        booking.status = 'cancelled';
        booking.notes.consumer = reason || 'Cancelled by consumer';
        await booking.save();

        // Process refund if payment was made
        if (booking.payment.status === 'paid') {
            booking.payment.status = 'refunded';
            booking.payment.refundAmount = booking.pricing.totalAmount;
            booking.payment.refundedAt = new Date();
            await booking.save();
        }

        res.status(200).json({
            status: 'success',
            message: 'Booking cancelled successfully',
            data: {
                booking
            }
        });

    } catch (error) {
        console.error('Error in cancelBooking:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to cancel booking. Please try again.'
        });
    }
};

// Submit feedback for completed booking
exports.submitFeedback = async (req, res) => {
    try {
        const { rating, review, photos } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide a valid rating between 1 and 5'
            });
        }

        const booking = await Booking.findOne({
            _id: req.params.id,
            consumer: req.consumer.id,
            status: 'completed',
            isActive: true
        });

        if (!booking) {
            return res.status(404).json({
                status: 'fail',
                message: 'Booking not found or not completed'
            });
        }

        // Check if feedback already submitted
        if (booking.feedback.rating) {
            return res.status(400).json({
                status: 'fail',
                message: 'Feedback already submitted for this booking'
            });
        }

        // Update feedback
        booking.feedback = {
            rating,
            review,
            photos: photos || [],
            submittedAt: new Date()
        };

        await booking.save();

        res.status(200).json({
            status: 'success',
            message: 'Feedback submitted successfully',
            data: {
                booking
            }
        });

    } catch (error) {
        console.error('Error in submitFeedback:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to submit feedback. Please try again.'
        });
    }
};

// Report issue with booking
exports.reportIssue = async (req, res) => {
    try {
        const { type, description, photo } = req.body;

        if (!type || !description) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide issue type and description'
            });
        }

        const booking = await Booking.findOne({
            _id: req.params.id,
            consumer: req.consumer.id,
            isActive: true
        });

        if (!booking) {
            return res.status(404).json({
                status: 'fail',
                message: 'Booking not found'
            });
        }

        // Add issue to booking
        booking.issues.push({
            type,
            description,
            photo,
            reportedAt: new Date(),
            status: 'open'
        });

        await booking.save();

        res.status(200).json({
            status: 'success',
            message: 'Issue reported successfully',
            data: {
                issue: booking.issues[booking.issues.length - 1]
            }
        });

    } catch (error) {
        console.error('Error in reportIssue:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to report issue. Please try again.'
        });
    }
};

// Get booking statistics
exports.getBookingStats = async (req, res) => {
    try {
        const stats = await Booking.getConsumerStats(req.consumer.id);

        // Get upcoming bookings count
        const upcomingCount = await Booking.countDocuments({
            consumer: req.consumer.id,
            status: { $in: ['pending', 'confirmed', 'assigned'] },
            isActive: true
        });

        stats.upcoming = upcomingCount;

        res.status(200).json({
            status: 'success',
            data: {
                stats
            }
        });

    } catch (error) {
        console.error('Error in getBookingStats:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get booking statistics. Please try again.'
        });
    }
};

// Get upcoming bookings
exports.getUpcomingBookings = async (req, res) => {
    try {
        const { limit = 5 } = req.query;

        const bookings = await Booking.getUpcomingBookings(
            req.consumer.id,
            parseInt(limit)
        );

        res.status(200).json({
            status: 'success',
            results: bookings.length,
            data: {
                bookings
            }
        });

    } catch (error) {
        console.error('Error in getUpcomingBookings:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get upcoming bookings. Please try again.'
        });
    }
};

// Get booking history
exports.getBookingHistory = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const bookings = await Booking.getBookingHistory(
            req.consumer.id,
            parseInt(page),
            parseInt(limit)
        );

        const total = await Booking.countDocuments({
            consumer: req.consumer.id,
            status: { $in: ['completed', 'cancelled', 'refunded'] },
            isActive: true
        });

        res.status(200).json({
            status: 'success',
            results: bookings.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
            data: {
                bookings
            }
        });

    } catch (error) {
        console.error('Error in getBookingHistory:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get booking history. Please try again.'
        });
    }
};
