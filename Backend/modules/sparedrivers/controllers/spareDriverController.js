const SpareDriver = require('../models/SpareDriver');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ── Ensure upload directory exists ──
const UPLOAD_DIR = path.join(__dirname, '../../../uploads/sparedrivers');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ── Multer config: store locally, allow images only ──
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${req.user?.id || 'unknown'}_${file.fieldname}_${Date.now()}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|heic/;
    const isOk = allowed.test(path.extname(file.originalname).toLowerCase()) &&
        allowed.test(file.mimetype);
    if (isOk) cb(null, true);
    else cb(new Error('Only image files are allowed (jpg, png, webp)'));
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB per file
});

exports.upload = upload; // expose for route use

// ── JWT helper ──
const signToken = (id) => jwt.sign(
    { id },
    process.env.JWT_SECRET || 'secret-jwt-key-for-carwash',
    { expiresIn: '90d' }
);

// ── Register ──
exports.register = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        const newDriver = await SpareDriver.create({ name, email, phone, password });
        const token = signToken(newDriver._id);
        res.status(201).json({
            status: 'success',
            token,
            data: {
                driver: {
                    id: newDriver._id,
                    name: newDriver.name,
                    email: newDriver.email,
                    phone: newDriver.phone,
                    status: newDriver.status
                }
            }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// ── Upload Documents (multipart/form-data with actual files) ──
exports.uploadDocuments = async (req, res) => {
    try {
        const files = req.files; // { aadhaarCard, drivingLicense, selfie }

        if (!files?.aadhaarCard || !files?.drivingLicense || !files?.selfie) {
            return res.status(400).json({
                status: 'fail',
                message: 'All three documents are required: aadhaarCard, drivingLicense, selfie'
            });
        }

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const aadhaarUrl = `${baseUrl}/uploads/sparedrivers/${files.aadhaarCard[0].filename}`;
        const dlUrl = `${baseUrl}/uploads/sparedrivers/${files.drivingLicense[0].filename}`;
        const selfieUrl = `${baseUrl}/uploads/sparedrivers/${files.selfie[0].filename}`;

        const driver = await SpareDriver.findByIdAndUpdate(
            req.user.id,
            {
                'documents.aadhaarCard.url': aadhaarUrl,
                'documents.drivingLicense.url': dlUrl,
                'documents.selfie.url': selfieUrl,
                status: 'pending_verification'
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            status: 'success',
            message: 'Documents uploaded. Pending admin verification.',
            data: { driver }
        });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

// ── Get own profile ──
exports.getProfile = async (req, res) => {
    try {
        const driver = await SpareDriver.findById(req.user.id);
        res.status(200).json({ status: 'success', data: { driver } });
    } catch (err) {
        res.status(404).json({ status: 'fail', message: 'Driver not found' });
    }
};

// ── Admin: List all drivers (with optional status filter) ──
exports.adminListDrivers = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};
        const drivers = await SpareDriver.find(filter)
            .select('-password')
            .sort({ createdAt: -1 });
        res.status(200).json({ status: 'success', results: drivers.length, data: { drivers } });
    } catch (err) {
        res.status(500).json({ status: 'fail', message: err.message });
    }
};

// ── Admin: Verify / Reject a driver ──
exports.adminVerifyDriver = async (req, res) => {
    try {
        const { status, adminNote } = req.body; // status: 'active' | 'rejected'
        const allowed = ['active', 'rejected', 'suspended'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ status: 'fail', message: 'Invalid status' });
        }

        const driver = await SpareDriver.findByIdAndUpdate(
            req.params.id,
            { status, adminNote },
            { new: true }
        );

        if (!driver) {
            return res.status(404).json({ status: 'fail', message: 'Driver not found' });
        }

        res.status(200).json({ status: 'success', data: { driver } });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};
