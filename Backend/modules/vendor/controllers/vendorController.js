const Booking = require('../../../models/Booking');
const Product = require('../../../models/Product');
const User = require('../../../models/User');
const Service = require('../../../models/Service');
const Setting = require('../../../models/Setting');
const WalletTransaction = require('../../../models/WalletTransaction');
const cloudinary = require('../../../utils/cloudinary');

exports.getDashboard = async (req, res) => {
    try {
        const vendorId = req.user._id;

        // 1. Find bookings assigned to this vendor
        const bookings = await Booking.find({
            'provider.id': vendorId,
            'provider.type': 'vendor',
            isActive: true
        });

        // 2. Aggregate Revenue from pricing.totalAmount
        const totalRevenue = bookings
            .filter(b => b.status === 'completed' && b.payment?.status === 'paid')
            .reduce((acc, b) => acc + (b.pricing?.totalAmount || 0), 0);

        // 3. Operation Stats
        const activeJobs = bookings.filter(b => ['pending', 'confirmed', 'assigned', 'pickup-assigned', 'en_route', 'at-studio', 'in_progress', 'quality-check'].includes(b.status)).length;
        const completedJobs = bookings.filter(b => b.status === 'completed').length;

        // 4. Staff Count
        const staffCount = await User.countDocuments({ role: 'staff', vendorId, isActive: true });

        // 5. Aggregate Rating
        const feedbackBookings = bookings.filter(b => b.feedback?.rating);
        const avgRating = feedbackBookings.length > 0
            ? (feedbackBookings.reduce((acc, b) => acc + b.feedback.rating, 0) / feedbackBookings.length).toFixed(1)
            : 0;

        // 6. Recent Activity
        const recentActivity = await Booking.find({
            'provider.id': vendorId,
            'provider.type': 'vendor',
            isActive: true
        })
            .populate('consumer', 'name profile')
            .populate('vehicle', 'brand model plate')
            .sort({ updatedAt: -1 })
            .limit(5);

        // 7. Get Real Wallet Transactions
        const dbTransactions = await WalletTransaction.find({ user: vendorId })
            .sort({ createdAt: -1 })
            .limit(10);

        const transactions = dbTransactions.map(t => ({
            id: t._id.toString().slice(-8).toUpperCase(),
            orderId: t.referenceType === 'booking' ? t.referenceId : 'N/A',
            date: new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
            amount: `${t.type === 'credit' ? '+' : '-'}₹${t.amount.toLocaleString()}`,
            status: t.status.charAt(0).toUpperCase() + t.status.slice(1),
            method: (t.paymentMethod || 'BANK').toUpperCase()
        }));

        const inventoryCount = req.user.profile?.inventory?.length || 0;

        res.status(200).json({
            status: 'success',
            data: {
                totalRevenue,
                walletBalance: req.user.wallet?.balance || 0,
                activeJobs,
                completedJobs,
                staffCount,
                rating: parseFloat(avgRating),
                recentActivity,
                transactions,
                inventoryCount
            }
        });
    } catch (error) {
        console.error('Error fetching vendor dashboard:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch dashboard data' });
    }
};

exports.getOrders = async (req, res) => {
    try {
        const vendorId = req.user._id;
        const bookings = await Booking.find({
            'provider.id': vendorId,
            'provider.type': 'vendor',
            isActive: true
        })
            .populate('consumer', 'name phone profile')
            .populate({
                path: 'vehicle',
                select: 'brand model plate'
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            results: bookings.length,
            data: {
                orders: bookings
            }
        });
    } catch (error) {
        console.error('Error fetching vendor orders:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch vendor orders' });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;
        const vendorId = req.user._id;

        const booking = await Booking.findOne({
            _id: orderId,
            'provider.id': vendorId,
            'provider.type': 'vendor'
        })
            .populate('consumer', 'name phone profile')
            .populate('vehicle', 'brand model plate')
            .populate('pickupStaff', 'name phone profile')
            .populate('deliveryStaff', 'name phone profile');

        if (!booking) {
            return res.status(404).json({ status: 'error', message: 'Order not found' });
        }

        res.status(200).json({
            status: 'success',
            data: { order: booking }
        });
    } catch (error) {
        console.error('Error fetching vendor order details:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch vendor order details' });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, staffId, type } = req.body; // type: 'pickup' or 'delivery'
        const vendorId = req.user._id;

        const booking = await Booking.findOne({
            _id: orderId,
            'provider.id': vendorId,
            'provider.type': 'vendor'
        });

        if (!booking) {
            return res.status(404).json({ status: 'error', message: 'Order not found or not assigned to you' });
        }

        // --- Elite Flow Hardening: Status Transition Rules ---
        const eliteStatuses = ['at-studio', 'in_progress', 'quality-check', 'ready-for-delivery'];
        
        // Basic Guard: If trying to move to an internal studio status, ensure the order is actually at the studio
        if (['in_progress', 'quality-check'].includes(status) && booking.status !== 'at-studio' && !eliteStatuses.includes(booking.status)) {
            return res.status(400).json({ status: 'error', message: 'Order must be at studio for internal updates' });
        }

        // Specific Transition Logic
        if (booking.status === 'at-studio' && status === 'in_progress') {
            booking.status = 'in_progress';
        } else if (booking.status === 'in_progress' && status === 'quality-check') {
            booking.status = 'quality-check';
        } else if (booking.status === 'quality-check' && status === 'ready-for-delivery') {
            booking.status = 'ready-for-delivery';
        } else if (status === 'completed') {
            booking.status = 'completed';
        } else {
            // Standard behavior for non-internal transitions or fallback
            booking.status = status;
        }

        // Add timestamp for specific statuses in tracking
        if (!booking.tracking) booking.tracking = {};
        
        if (status === 'in_progress') booking.tracking.washStartedAt = new Date();
        if (status === 'quality-check') booking.tracking.washCompletedAt = new Date();
        if (status === 'ready-for-delivery') booking.tracking.readyForPickupAt = new Date();
        if (status === 'completed') {
            booking.tracking.completedAt = new Date();
            
            // --- PAYOUT LOGIC ---
            if (booking.pricing?.totalAmount > 0) {
                // Fetch Platform Commission
                let commissionRate = 15; // Default 15%
                const commissionSetting = await Setting.findOne({ key: 'platform_commission' });
                if (commissionSetting && commissionSetting.value) {
                    commissionRate = parseFloat(commissionSetting.value);
                }

                const adminCut = (booking.pricing.totalAmount * commissionRate) / 100;
                const providerPayout = booking.pricing.totalAmount - adminCut;

                // Update Vendor Wallet
                const vendor = await User.findById(vendorId);
                if (vendor) {
                    vendor.wallet = vendor.wallet || {};
                    vendor.wallet.balance = (vendor.wallet.balance || 0) + providerPayout;
                    vendor.wallet.lastUpdated = new Date();
                    await vendor.save({ validateBeforeSave: false });

                    // Log Transaction
                    await WalletTransaction.create({
                        user: vendor._id,
                        amount: providerPayout,
                        type: 'credit',
                        status: 'completed',
                        category: 'SERVICE_BOOKING',
                        description: `Payout for booking ${booking.bookingId || booking._id} (Commission deducted: ₹${adminCut.toFixed(2)})`,
                        referenceId: booking._id.toString()
                    });
                }
                
                if (booking.payment) {
                    booking.payment.status = 'paid';
                    booking.payment.paidAt = new Date();
                }
            }
        }

        await booking.save();

        // Emit Socket Event
        const { socketService } = require('../../../utils/socket');
        const io = socketService.getIO();
        io.to(booking._id.toString()).emit('booking_status_updated', {
            bookingId: booking._id,
            status: booking.status
        });

        res.status(200).json({
            status: 'success',
            message: 'Order status updated',
            data: { booking }
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update order status' });
    }
};

// --- Product Management ---

exports.getProducts = async (req, res) => {
    try {
        const vendorId = req.user._id;
        const products = await Product.find({ vendor: vendorId }).sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            results: products.length,
            data: { products }
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch products' });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const vendorId = req.user._id;
        const productData = { ...req.body, vendor: vendorId, status: 'Pending' };

        // Handle Image Upload
        if (productData.image && productData.image.startsWith('data:image')) {
            try {
                const uploadRes = await cloudinary.uploadImage(productData.image, 'clean2wash/products/images');
                productData.image = uploadRes.secure_url;
            } catch (err) {
                console.error('Product image upload failed:', err);
            }
        }

        // Handle Video Upload
        if (productData.video && productData.video.startsWith('data:video')) {
            try {
                const uploadRes = await cloudinary.uploadImage(productData.video, 'clean2wash/products/videos');
                productData.video = uploadRes.secure_url;
            } catch (err) {
                console.error('Product video upload failed:', err);
            }
        }

        const product = await Product.create(productData);

        res.status(201).json({
            status: 'success',
            data: { product }
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Failed to create product' });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const vendorId = req.user._id;
        const updateData = { ...req.body, status: 'Pending' };

        // Handle Image Upload
        if (updateData.image && updateData.image.startsWith('data:image')) {
            try {
                const uploadRes = await cloudinary.uploadImage(updateData.image, 'clean2wash/products/images');
                updateData.image = uploadRes.secure_url;
            } catch (err) {
                console.error('Product image upload failed:', err);
            }
        }

        // Handle Video Upload
        if (updateData.video && updateData.video.startsWith('data:video')) {
            try {
                const uploadRes = await cloudinary.uploadImage(updateData.video, 'clean2wash/products/videos');
                updateData.video = uploadRes.secure_url;
            } catch (err) {
                console.error('Product video upload failed:', err);
            }
        }

        // Ensure user owns the product
        const product = await Product.findOneAndUpdate(
            { _id: productId, vendor: vendorId },
            updateData, // Re-verify on edit
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ status: 'error', message: 'Product not found' });
        }

        res.status(200).json({
            status: 'success',
            data: { product }
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update product' });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const vendorId = req.user._id;

        const product = await Product.findOneAndDelete({ _id: productId, vendor: vendorId });

        if (!product) {
            return res.status(404).json({ status: 'error', message: 'Product not found' });
        }

        res.status(200).json({
            status: 'success',
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ status: 'error', message: 'Failed to delete product' });
    }
};

// --- Staff Management ---

// --- Staff Management ---

exports.getStaff = async (req, res) => {
    try {
        const vendorId = req.user._id;
        // Find users with role 'staff' linked to this vendor via profile.vendorId
        const staff = await User.find({ role: 'staff', 'profile.vendorId': vendorId });

        res.status(200).json({
            status: 'success',
            data: { staff }
        });
    } catch (error) {
        console.error('Error fetching staff:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch staff' });
    }
};

exports.searchStaff = async (req, res) => {
    try {
        const { phone } = req.query;
        if (!phone) {
            return res.status(400).json({ status: 'error', message: 'Please provide a phone number' });
        }

        const staffMember = await User.findOne({ phone, role: 'staff' }).select('name phone profile rating');

        if (!staffMember) {
            return res.status(404).json({ status: 'error', message: 'Staff member not found in global registry' });
        }

        res.status(200).json({
            status: 'success',
            data: { staff: staffMember }
        });
    } catch (error) {
        console.error('Error searching staff:', error);
        res.status(500).json({ status: 'error', message: 'Failed to search registry' });
    }
};

exports.linkStaff = async (req, res) => {
    try {
        const vendorId = req.user._id;
        const { phone } = req.body;

        const staffMember = await User.findOne({ phone, role: 'staff' });

        if (!staffMember) {
            return res.status(404).json({ status: 'error', message: 'Staff member not found in registry' });
        }

        if (staffMember.profile?.vendorId && staffMember.profile.vendorId.toString() === vendorId.toString()) {
            return res.status(400).json({ status: 'error', message: 'Staff member already linked to your studio' });
        }

        // Update nested path
        if (!staffMember.profile) staffMember.profile = {};
        staffMember.profile.vendorId = vendorId;
        await staffMember.save({ validateBeforeSave: false });

        res.status(200).json({
            status: 'success',
            message: 'Staff member linked successfully',
            data: { staff: staffMember }
        });
    } catch (error) {
        console.error('Error linking staff:', error);
        res.status(500).json({ status: 'error', message: 'Failed to link staff member' });
    }
};

exports.createStaff = async (req, res) => {
    try {
        const vendorId = req.user._id;
        const { name, phone, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return res.status(400).json({ status: 'error', message: 'User already registered with this number' });
        }

        const staffMember = await User.create({
            name,
            phone,
            password: password || '1234', // Default PIN for quick onboard
            role: 'staff',
            isVerified: true, // Auto-verified since added by vendor
            profile: {
                vendorId: vendorId,
                studioName: req.user.profile?.studioName || ''
            }
        });

        res.status(201).json({
            status: 'success',
            message: 'Staff member registered and linked successfully',
            data: { staff: staffMember }
        });
    } catch (error) {
        console.error('Error creating staff:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Failed to onboard staff' });
    }
};

exports.unlinkStaff = async (req, res) => {
    try {
        const vendorId = req.user._id;
        const { staffId } = req.params;

        const staffMember = await User.findOneAndUpdate(
            { _id: staffId, 'profile.vendorId': vendorId, role: 'staff' },
            { $set: { 'profile.vendorId': null } },
            { new: true }
        );

        if (!staffMember) {
            return res.status(404).json({ status: 'error', message: 'Staff member not found or not linked to your studio' });
        }

        res.status(200).json({
            status: 'success',
            message: 'Staff member unlinked successfully'
        });
    } catch (error) {
        console.error('Error unlinking staff:', error);
        res.status(500).json({ status: 'error', message: 'Failed to unlink staff member' });
    }
};

// --- Customer Management ---

exports.getCustomers = async (req, res) => {
    try {
        const vendorId = req.user._id;

        // Find all bookings for this vendor and get unique consumers
        const bookings = await Booking.find({ 'provider.id': vendorId }).populate('consumer', 'name phone email profile');

        const customersMap = new Map();

        bookings.forEach(booking => {
            if (booking.consumer) {
                const customerId = booking.consumer._id.toString();
                if (!customersMap.has(customerId)) {
                    customersMap.set(customerId, {
                        id: customerId,
                        name: booking.consumer.name,
                        phone: booking.consumer.phone,
                        email: booking.consumer.email,
                        bookings: 0,
                        spent: 0,
                        lastActive: booking.createdAt,
                        status: 'Regular'
                    });
                }

                const customer = customersMap.get(customerId);
                customer.bookings += 1;
                const totalAmount = booking.pricing?.totalAmount || 0;
                customer.spent += totalAmount;

                if (new Date(booking.createdAt) > new Date(customer.lastActive)) {
                    customer.lastActive = booking.createdAt;
                }

                if (customer.bookings >= 5) customer.status = 'Elite';
            }
        });

        res.status(200).json({
            status: 'success',
            results: customersMap.size,
            data: { customers: Array.from(customersMap.values()) }
        });
    } catch (error) {
        console.error('Error fetching vendor customers:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch customers' });
    }
};

// --- Reports & Analytics ---

exports.getReports = async (req, res) => {
    try {
        const vendorId = req.user._id;
        const now = new Date();
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

        const bookings = await Booking.find({
            'provider.id': vendorId,
            'provider.type': 'vendor',
            isActive: true
        }).populate('consumer', 'name profile');

        // 1. Growth Calculation (Current Month vs Previous Month)
        const currentMonth = now.getMonth();
        const prevMonth = (currentMonth === 0) ? 11 : currentMonth - 1;
        const currentYear = now.getFullYear();
        const prevYear = (currentMonth === 0) ? currentYear - 1 : currentYear;

        const currentMonthBookings = bookings.filter(b => b.createdAt.getMonth() === currentMonth && b.createdAt.getFullYear() === currentYear).length;
        const prevMonthBookings = bookings.filter(b => b.createdAt.getMonth() === prevMonth && b.createdAt.getFullYear() === prevYear).length;

        let growthVal = '0%';
        if (prevMonthBookings > 0) {
            const growthPct = ((currentMonthBookings - prevMonthBookings) / prevMonthBookings) * 100;
            growthVal = `${growthPct >= 0 ? '+' : ''}${Math.round(growthPct)}%`;
        } else if (currentMonthBookings > 0) {
            growthVal = '+100%';
        }

        // 2. Retention (Unique users with > 1 booking)
        const userBookingCounts = {};
        bookings.forEach(b => {
            const uId = b.consumer?._id?.toString() || b.consumer?.toString();
            if (uId) userBookingCounts[uId] = (userBookingCounts[uId] || 0) + 1;
        });

        const totalUniqueUsers = Object.keys(userBookingCounts).length;
        const repeatUsers = Object.values(userBookingCounts).filter(count => count > 1).length;
        const retentionPct = totalUniqueUsers > 0 ? Math.round((repeatUsers / totalUniqueUsers) * 100) : 0;

        // 3. Avg Rating
        const feedbackBookings = bookings.filter(b => b.feedback?.rating);
        const avgRating = feedbackBookings.length > 0
            ? (feedbackBookings.reduce((acc, b) => acc + b.feedback.rating, 0) / feedbackBookings.length).toFixed(1)
            : '0.0';

        // 4. Best Sellers
        const serviceCounts = {};
        bookings.forEach(b => {
            const sName = b.service?.name || 'Standard Service';
            serviceCounts[sName] = (serviceCounts[sName] || 0) + 1;
        });

        const bestSellers = Object.entries(serviceCounts)
            .map(([name, sales]) => ({ name, sales, trend: '+5%' }))
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 4);

        // 5. Revenue Trend (12 Months)
        const trend = Array.from({ length: 12 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
            const m = d.getMonth();
            const y = d.getFullYear();
            const revenue = bookings
                .filter(b => b.status === 'completed' && b.payment?.status === 'paid' && b.createdAt.getMonth() === m && b.createdAt.getFullYear() === y)
                .reduce((acc, b) => acc + (b.pricing?.totalAmount || 0), 0);
            return { month: m, revenue: Math.round(revenue / 1000) }; // in k
        });

        // 6. Recent Reviews
        const reviews = feedbackBookings
            .sort((a, b) => new Date(b.feedback.submittedAt) - new Date(a.feedback.submittedAt))
            .slice(0, 3)
            .map(b => ({
                id: b._id,
                user: b.consumer?.name || 'Guest',
                rating: b.feedback.rating,
                comment: b.feedback.review || 'Awesome service!',
                date: new Date(b.feedback.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
            }));

        res.status(200).json({
            status: 'success',
            data: {
                metrics: [
                    { label: 'Booking Growth', val: growthVal, sub: 'vs last month', color: 'text-green-500' },
                    { label: 'Repeat Customers', val: `${retentionPct}%`, sub: 'Retention rate', color: 'text-blue-500' },
                    { label: 'Avg Rating', val: avgRating, sub: `From ${feedbackBookings.length} reviews`, color: 'text-amber-500' },
                ],
                bestSellers,
                revenueTrend: trend.map(t => t.revenue),
                reviews
            }
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch reports' });
    }
};

// --- Service Management (Vendor-Specific) ---

exports.getServices = async (req, res) => {
    try {
        const vendorId = req.user._id;
        const services = await Service.find({ vendor: vendorId });

        res.status(200).json({
            status: 'success',
            results: services.length,
            data: { services }
        });
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch services' });
    }
};

exports.createService = async (req, res) => {
    try {
        const vendorId = req.user._id;
        // Map isActive to status for consistency
        const status = req.body.isActive === false ? 'Paused' : (req.body.status || 'Live');

        const service = await Service.create({
            ...req.body,
            vendor: vendorId,
            status
        });

        res.status(201).json({
            status: 'success',
            data: { service }
        });
    } catch (error) {
        console.error('Error creating service:', error);
        res.status(500).json({ status: 'error', message: 'Failed to create service' });
    }
};

exports.updateService = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const vendorId = req.user._id;

        const updateData = { ...req.body };
        // Sync status if isActive is explicitly changed
        if (updateData.isActive === false) updateData.status = 'Paused';
        if (updateData.isActive === true && updateData.status === 'Paused') updateData.status = 'Live';

        const service = await Service.findOneAndUpdate(
            { _id: serviceId, vendor: vendorId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!service) return res.status(404).json({ status: 'error', message: 'Service not found' });

        res.status(200).json({
            status: 'success',
            data: { service }
        });
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update service' });
    }
};

exports.deleteService = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const vendorId = req.user._id;

        const service = await Service.findOneAndDelete({ _id: serviceId, vendor: vendorId });
        if (!service) return res.status(404).json({ status: 'error', message: 'Service not found' });

        res.status(200).json({
            status: 'success',
            message: 'Service deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ status: 'error', message: 'Failed to delete service' });
    }
};

// Assign staff to booking
exports.assignStaff = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { staffId, type } = req.body; // type: 'pickup' or 'delivery'

        const updateField = type === 'pickup' ? 'pickupStaff' : 'deliveryStaff';

        const booking = await Booking.findOneAndUpdate(
            {
                _id: orderId,
                'provider.id': req.user._id,
                'provider.type': 'vendor'
            },
            { [updateField]: staffId },
            { new: true }
        )
            .populate('consumer', 'name phone profile')
            .populate('vehicle', 'brand model plate')
            .populate('pickupStaff', 'name phone profile')
            .populate('deliveryStaff', 'name phone profile');

        if (!booking) {
            return res.status(404).json({
                status: 'fail',
                message: 'Booking not found or unauthorized'
            });
        }

        // Notify Consumer of assignment / status update
        const { socketService } = require('../../../utils/socket');
        const io = socketService.getIO();
        
        // Auto-update status if staff is assigned for the first time
        if (type === 'pickup' && booking.status === 'accepted') {
            booking.status = 'pickup-assigned';
            booking.tracking.assignedAt = new Date();
            await booking.save();
        }

        io.to(booking._id.toString()).emit('booking_status_updated', {
            bookingId: booking._id,
            status: booking.status,
            staff: {
                name: type === 'pickup' ? booking.pickupStaff?.name : booking.deliveryStaff?.name,
                phone: type === 'pickup' ? booking.pickupStaff?.phone : booking.deliveryStaff?.phone,
                type: type
            }
        });

        res.status(200).json({
            status: 'success',
            data: { booking }
        });
    } catch (err) {
        res.status(400).json({
            status: 'error',
            message: err.message
        });
    }
};

// --- Payout Management ---

exports.requestPayout = async (req, res) => {
    try {
        const { amount } = req.body;
        const vendor = await User.findById(req.user._id);

        if (!amount || amount <= 0) {
            return res.status(400).json({ status: 'error', message: 'Please provide a valid amount' });
        }

        if (vendor.wallet.balance < amount) {
            return res.status(400).json({ status: 'error', message: 'Insufficient balance' });
        }

        const balanceBefore = vendor.wallet.balance;
        const balanceAfter = balanceBefore - amount;

        // Create transaction record
        await WalletTransaction.create({
            user: vendor._id,
            type: 'debit',
            amount,
            description: 'Bank Transfer Payout Request',
            category: 'WITHDRAWAL',
            status: 'pending',
            balanceBefore,
            balanceAfter,
            paymentMethod: 'netbanking'
        });

        // Update user balance
        vendor.wallet.balance = balanceAfter;
        vendor.wallet.lastUpdated = new Date();
        await vendor.save({ validateBeforeSave: false });

        res.status(200).json({
            status: 'success',
            message: 'Payout request submitted successfully',
            data: { balance: balanceAfter }
        });
    } catch (error) {
        console.error('Error requesting payout:', error);
        res.status(500).json({ status: 'error', message: 'Failed to process payout request' });
    }
};
