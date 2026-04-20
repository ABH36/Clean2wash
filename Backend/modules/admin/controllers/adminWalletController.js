const WalletTransaction = require('../../../models/WalletTransaction');
const SpareDriver = require('../../../models/SpareDriver');
const User = require('../../../models/User');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

// Get all wallets with balances
exports.getWallets = catchAsync(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        userType,
        search,
        minBalance,
        maxBalance
    } = req.query;
    
    const skip = (page - 1) * limit;
    let users = [];
    let total = 0;
    
    if (!userType || userType === 'driver') {
        // Get driver wallets
        const driverQuery = {};
        if (search) {
            driverQuery.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { driverId: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (minBalance !== undefined || maxBalance !== undefined) {
            driverQuery['wallet.balance'] = {};
            if (minBalance !== undefined) driverQuery['wallet.balance'].$gte = parseFloat(minBalance);
            if (maxBalance !== undefined) driverQuery['wallet.balance'].$lte = parseFloat(maxBalance);
        }
        
        const drivers = await SpareDriver.find(driverQuery)
            .select('name phone driverId wallet createdAt')
            .sort({ 'wallet.balance': -1 })
            .skip(userType === 'driver' ? skip : 0)
            .limit(userType === 'driver' ? parseInt(limit) : 1000);
        
        users = users.concat(drivers.map(driver => ({
            ...driver.toObject(),
            userType: 'driver',
            balance: driver.wallet?.balance || 0,
            holdAmount: driver.wallet?.holdAmount || 0
        })));
        
        if (userType === 'driver') {
            total = await SpareDriver.countDocuments(driverQuery);
        }
    }
    
    if (!userType || userType === 'customer') {
        // Get customer wallets
        const customerQuery = {};
        if (search) {
            customerQuery.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (minBalance !== undefined || maxBalance !== undefined) {
            customerQuery['wallet.balance'] = {};
            if (minBalance !== undefined) customerQuery['wallet.balance'].$gte = parseFloat(minBalance);
            if (maxBalance !== undefined) customerQuery['wallet.balance'].$lte = parseFloat(maxBalance);
        }
        
        const customers = await User.find({
            ...customerQuery,
            role: 'consumer'
        })
            .select('name phone wallet createdAt')
            .sort({ 'wallet.balance': -1 })
            .skip(userType === 'customer' ? skip : 0)
            .limit(userType === 'customer' ? parseInt(limit) : 1000);
        
        users = users.concat(customers.map(customer => ({
            ...customer.toObject(),
            userType: 'customer',
            balance: customer.wallet?.balance || 0,
            holdAmount: customer.wallet?.holdAmount || 0
        })));
        
        if (userType === 'customer') {
            total = await User.countDocuments({
                ...customerQuery,
                role: 'consumer'
            });
        }
    }
    
    // If no specific user type, sort and paginate combined results
    if (!userType) {
        users.sort((a, b) => b.balance - a.balance);
        total = users.length;
        users = users.slice(skip, skip + parseInt(limit));
    }
    
    res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
            wallets: users,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        }
    });
});

// Get wallet statistics
exports.getWalletStats = catchAsync(async (req, res) => {
    const [driverStats, customerStats, transactionStats] = await Promise.all([
        SpareDriver.aggregate([
            {
                $group: {
                    _id: null,
                    totalDrivers: { $sum: 1 },
                    totalBalance: { $sum: '$wallet.balance' },
                    totalHold: { $sum: '$wallet.holdAmount' },
                    avgBalance: { $avg: '$wallet.balance' }
                }
            }
        ]),
        User.aggregate([
            {
                $match: { role: 'consumer' }
            },
            {
                $group: {
                    _id: null,
                    totalCustomers: { $sum: 1 },
                    totalBalance: { $sum: '$wallet.balance' },
                    avgBalance: { $avg: '$wallet.balance' }
                }
            }
        ]),
        WalletTransaction.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
                }
            },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            }
        ])
    ]);
    
    const stats = {
        drivers: driverStats[0] || { totalDrivers: 0, totalBalance: 0, totalHold: 0, avgBalance: 0 },
        customers: customerStats[0] || { totalCustomers: 0, totalBalance: 0, avgBalance: 0 },
        transactions: {
            credit: { count: 0, amount: 0 },
            debit: { count: 0, amount: 0 }
        },
        totalBalance: 0,
        totalHold: 0
    };
    
    transactionStats.forEach(stat => {
        if (stat._id === 'CREDIT') {
            stats.transactions.credit = { count: stat.count, amount: stat.totalAmount };
        } else if (stat._id === 'DEBIT') {
            stats.transactions.debit = { count: stat.count, amount: stat.totalAmount };
        }
    });
    
    stats.totalBalance = stats.drivers.totalBalance + stats.customers.totalBalance;
    stats.totalHold = stats.drivers.totalHold;
    
    res.status(200).json({
        status: 'success',
        data: stats
    });
});

// Adjust wallet balance (credit/debit)
exports.adjustWallet = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { userType, type, amount, reason, category = 'ADJUSTMENT' } = req.body;
    
    if (!userType || !type || !amount || !reason) {
        return res.status(400).json({
            status: 'error',
            message: 'User type, transaction type, amount, and reason are required'
        });
    }
    
    if (!['CREDIT', 'DEBIT'].includes(type)) {
        return res.status(400).json({
            status: 'error',
            message: 'Transaction type must be CREDIT or DEBIT'
        });
    }
    
    const adjustmentAmount = parseFloat(amount);
    if (adjustmentAmount <= 0) {
        return res.status(400).json({
            status: 'error',
            message: 'Amount must be greater than 0'
        });
    }
    
    // Find user
    let user;
    if (userType === 'driver') {
        user = await SpareDriver.findById(userId);
    } else if (userType === 'customer') {
        user = await User.findOne({ _id: userId, role: 'consumer' });
    }
    
    if (!user) {
        return res.status(404).json({
            status: 'error',
            message: `${userType} not found`
        });
    }
    
    // Initialize wallet if not exists
    if (!user.wallet) {
        user.wallet = { balance: 0, holdAmount: 0 };
    }
    
    const balanceBefore = user.wallet.balance;
    
    // Check if debit is possible
    if (type === 'DEBIT' && user.wallet.balance < adjustmentAmount) {
        return res.status(400).json({
            status: 'error',
            message: 'Insufficient wallet balance'
        });
    }
    
    // Update balance
    if (type === 'CREDIT') {
        user.wallet.balance += adjustmentAmount;
    } else {
        user.wallet.balance -= adjustmentAmount;
    }
    
    await user.save();
    
    // Create transaction record
    const transaction = await WalletTransaction.create({
        user: userId,
        userType: userType === 'driver' ? 'sparedriver' : 'consumer',
        type,
        amount: adjustmentAmount,
        category,
        description: `Admin adjustment: ${reason}`,
        balanceBefore,
        balanceAfter: user.wallet.balance,
        reference: {
            model: 'Admin',
            id: req.user._id
        },
        status: 'COMPLETED',
        processedBy: req.user._id
    });
    
    res.status(200).json({
        status: 'success',
        message: `Wallet ${type.toLowerCase()}ed successfully`,
        data: {
            user: {
                id: user._id,
                name: user.name,
                userType,
                wallet: user.wallet
            },
            transaction
        }
    });
});

// Hold amount in wallet
exports.holdAmount = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { userType, amount, reason } = req.body;
    
    if (!userType || !amount || !reason) {
        return res.status(400).json({
            status: 'error',
            message: 'User type, amount, and reason are required'
        });
    }
    
    const holdAmount = parseFloat(amount);
    if (holdAmount <= 0) {
        return res.status(400).json({
            status: 'error',
            message: 'Hold amount must be greater than 0'
        });
    }
    
    // Find user
    let user;
    if (userType === 'driver') {
        user = await SpareDriver.findById(userId);
    } else if (userType === 'customer') {
        user = await User.findOne({ _id: userId, role: 'consumer' });
    }
    
    if (!user) {
        return res.status(404).json({
            status: 'error',
            message: `${userType} not found`
        });
    }
    
    // Initialize wallet if not exists
    if (!user.wallet) {
        user.wallet = { balance: 0, holdAmount: 0 };
    }
    
    // Check if hold is possible
    const availableBalance = user.wallet.balance - (user.wallet.holdAmount || 0);
    if (availableBalance < holdAmount) {
        return res.status(400).json({
            status: 'error',
            message: 'Insufficient available balance for hold'
        });
    }
    
    // Add to hold amount
    user.wallet.holdAmount = (user.wallet.holdAmount || 0) + holdAmount;
    await user.save();
    
    // Create transaction record
    const transaction = await WalletTransaction.create({
        user: userId,
        userType: userType === 'driver' ? 'sparedriver' : 'consumer',
        type: 'HOLD',
        amount: holdAmount,
        category: 'HOLD',
        description: `Amount held: ${reason}`,
        balanceBefore: user.wallet.balance,
        balanceAfter: user.wallet.balance,
        reference: {
            model: 'Admin',
            id: req.user._id
        },
        status: 'COMPLETED',
        processedBy: req.user._id
    });
    
    res.status(200).json({
        status: 'success',
        message: 'Amount held successfully',
        data: {
            user: {
                id: user._id,
                name: user.name,
                userType,
                wallet: user.wallet
            },
            transaction
        }
    });
});

// Release held amount
exports.releaseHold = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { userType, amount, reason } = req.body;
    
    if (!userType || !amount || !reason) {
        return res.status(400).json({
            status: 'error',
            message: 'User type, amount, and reason are required'
        });
    }
    
    const releaseAmount = parseFloat(amount);
    if (releaseAmount <= 0) {
        return res.status(400).json({
            status: 'error',
            message: 'Release amount must be greater than 0'
        });
    }
    
    // Find user
    let user;
    if (userType === 'driver') {
        user = await SpareDriver.findById(userId);
    } else if (userType === 'customer') {
        user = await User.findOne({ _id: userId, role: 'consumer' });
    }
    
    if (!user) {
        return res.status(404).json({
            status: 'error',
            message: `${userType} not found`
        });
    }
    
    // Check if release is possible
    if (!user.wallet || (user.wallet.holdAmount || 0) < releaseAmount) {
        return res.status(400).json({
            status: 'error',
            message: 'Insufficient held amount'
        });
    }
    
    // Release from hold
    user.wallet.holdAmount -= releaseAmount;
    await user.save();
    
    // Create transaction record
    const transaction = await WalletTransaction.create({
        user: userId,
        userType: userType === 'driver' ? 'sparedriver' : 'consumer',
        type: 'RELEASE',
        amount: releaseAmount,
        category: 'RELEASE',
        description: `Hold released: ${reason}`,
        balanceBefore: user.wallet.balance,
        balanceAfter: user.wallet.balance,
        reference: {
            model: 'Admin',
            id: req.user._id
        },
        status: 'COMPLETED',
        processedBy: req.user._id
    });
    
    res.status(200).json({
        status: 'success',
        message: 'Hold released successfully',
        data: {
            user: {
                id: user._id,
                name: user.name,
                userType,
                wallet: user.wallet
            },
            transaction
        }
    });
});

// Get wallet transaction history
exports.getWalletTransactions = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const {
        page = 1,
        limit = 20,
        type,
        category,
        startDate,
        endDate
    } = req.query;
    
    const query = { user: userId };
    
    if (type) query.type = type;
    if (category) query.category = category;
    
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const skip = (page - 1) * limit;
    
    const transactions = await WalletTransaction.find(query)
        .populate('processedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    
    const total = await WalletTransaction.countDocuments(query);
    
    res.status(200).json({
        status: 'success',
        results: transactions.length,
        data: {
            transactions,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        }
    });
});

module.exports = exports;
