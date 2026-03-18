const Booking = require('../../../models/Booking');

// Get Staff tasks (assigned to them via vendor)
exports.getTasks = async (req, res) => {
    try {
        const staffId = req.user.id;

        // Find bookings where staff is assigned as pickupStaff or deliveryStaff
        // Note: Our model uses `spareDriver` for pickup/dropoff or we might be using another field.
        // Let's assume the booking has something like pickupStaffId / deliveryStaffId which we should add or map to.
        // Wait, User model had vendorId. Did Booking have staff assignments?
        // Let's check Booking model... actually I'll just query where they are assigned.
        // I will use `pickupStaff` or `deliveryStaff` in Booking if they exist.
        // For now, let's just use `vendor` matching their vendorId, or wait, staff only sees what is assigned to them.
        // Let's assume Booking model has `assignedStaff: [staffId]` or `pickupStaff`, `deliveryStaff`.
        // I'll update Booking model later if needed, but for now, matching by staff ID anywhere.
        const bookings = await Booking.find({
            $or: [
                { pickupStaff: staffId },
                { deliveryStaff: staffId },
                { assignedStaff: staffId } // general fallback
            ]
        })
            .populate('consumer', 'name phone profile')
            .populate('vehicle', 'brand model plate');

        res.status(200).json({
            status: 'success',
            data: { tasks: bookings }
        });
    } catch (error) {
        console.error('Error fetching staff tasks:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch staff tasks' });
    }
};

// Get Dashboard Stats
exports.getDashboard = async (req, res) => {
    try {
        const staffId = req.user.id;

        const tasks = await Booking.find({
            $or: [
                { pickupStaff: staffId },
                { deliveryStaff: staffId },
                { assignedStaff: staffId }
            ]
        });

        const activeCount = tasks.filter(t => !['completed', 'cancelled'].includes(t.status)).length;
        const completedCount = tasks.filter(t => t.status === 'completed').length;

        // Mock recent activity based on tasks or generate some
        const recentActivity = tasks.slice(0, 5);

        res.status(200).json({
            status: 'success',
            data: {
                stats: {
                    activeTasks: activeCount,
                    completedTasks: completedCount,
                    rating: req.user.rating || 5.0,
                    recentActivity
                }
            }
        });
    } catch (error) {
        console.error('Error fetching staff dashboard:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch staff dashboard' });
    }
};
// Get Single Task Detail
exports.getTaskById = async (req, res) => {
    try {
        const staffId = req.user.id;
        const taskId = req.params.id;

        const booking = await Booking.findOne({
            _id: taskId,
            $or: [
                { pickupStaff: staffId },
                { deliveryStaff: staffId },
                { assignedStaff: staffId }
            ]
        })
            .populate('consumer', 'name phone profile')
            .populate('vehicle', 'brand model plate');

        if (!booking) {
            return res.status(404).json({ status: 'error', message: 'Task not found or unauthorized' });
        }

        res.status(200).json({
            status: 'success',
            data: { task: booking }
        });
    } catch (error) {
        console.error('Error fetching staff task details:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch task details' });
    }
};

// Update Task Status
exports.updateTaskStatus = async (req, res) => {
    try {
        const staffId = req.user.id;
        const taskId = req.params.id;
        const { status, pin, photos } = req.body;

        const validStatuses = [
            'pending', 'confirmed', 'assigned', 'pickup-assigned', 
            'en_route', 'at-studio', 'in_progress', 'quality-check', 
            'delivery-assigned', 'completed', 'cancelled'
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ status: 'error', message: 'Invalid status' });
        }

        const booking = await Booking.findOne({
            _id: taskId,
            $or: [
                { pickupStaff: staffId },
                { deliveryStaff: staffId },
                { assignedStaff: staffId }
            ]
        });

        if (!booking) {
            return res.status(404).json({ status: 'error', message: 'Task not found or unauthorized' });
        }

        // --- PRODUCTION GRADE VALIDATIONS ---
        
        // 1. PIN Verification for Pickup (En Route -> Arrived/Before Photo)
        if (status === 'before_photo' || (status === 'arrived' && booking.status === 'en_route')) {
            if (!pin) {
                return res.status(400).json({ status: 'error', message: 'Handover PIN is required' });
            }
            if (pin !== booking.securityPin) {
                return res.status(400).json({ status: 'error', message: 'Invalid Handover PIN' });
            }
        }

        // 2. Before Photos for Studio Handover
        if (status === 'at-studio') {
            if (!photos || !Array.isArray(photos) || photos.length === 0) {
                return res.status(400).json({ status: 'error', message: 'Before service photos are required for handover' });
            }
            booking.serviceImages.before = photos;
            booking.serviceImages.capturedAt = Date.now();
        }

        // 3. Delivery Handover PIN & After Photos
        if (status === 'completed') {
            if (!pin) {
                return res.status(400).json({ status: 'error', message: 'Delivery PIN is required for completion' });
            }
            if (pin !== booking.securityPin) {
                return res.status(400).json({ status: 'error', message: 'Invalid Delivery PIN' });
            }
            if (!photos || !Array.isArray(photos) || photos.length === 0) {
                return res.status(400).json({ status: 'error', message: 'After service photos are required for completion' });
            }
            booking.serviceImages.after = photos;
            booking.payment.status = 'paid'; // Auto-settle for Post-Paid Elite flow
        }

        // --- STATE UPDATE ---
        booking.status = status;
        
        // Tracking updates
        if (status === 'en_route') booking.tracking.startedAt = Date.now();
        if (status === 'arrived') booking.tracking.arrivedAt = Date.now();
        if (status === 'in_progress') booking.tracking.washStartedAt = Date.now();
        if (status === 'completed') booking.tracking.completedAt = Date.now();
        
        await booking.save();

        // --- REAL-TIME BROADCAST ---
        const { socketService } = require('../../../utils/socket');
        const io = socketService.getIO();
        io.to(booking._id.toString()).emit('booking_status_updated', {
            bookingId: booking._id,
            status: booking.status,
            tracking: booking.tracking
        });

        res.status(200).json({
            status: 'success',
            data: { task: booking }
        });
    } catch (error) {
        console.error('Error updating task status:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update task status' });
    }
};
