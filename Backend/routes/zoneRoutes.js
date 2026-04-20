const express = require('express');
const router = express.Router();
const zoneController = require('../controllers/zoneController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes (no authentication required)
router.get('/check-location', zoneController.checkLocation);
router.get('/nearby', zoneController.getNearbyZones);
router.get('/geojson', zoneController.getZonesGeoJSON);
router.get('/active', zoneController.getAllZones);

// Protected routes (admin only)
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('admin', 'superadmin'));

router.route('/')
    .get(zoneController.getAllZones)
    .post(zoneController.createZone);

router.route('/bulk-update')
    .patch(zoneController.bulkUpdateZones);

router.route('/:id')
    .get(zoneController.getZone)
    .patch(zoneController.updateZone)
    .delete(zoneController.deleteZone);

router.route('/:id/status')
    .patch(zoneController.updateZoneStatus);

router.route('/:id/services')
    .patch(zoneController.updateZoneServices);

router.route('/:id/stats')
    .get(zoneController.getZoneStats);

router.get('/code/:code', zoneController.getZoneByCode);

module.exports = router;
