// TODO: Implement maintenanceRoutes.js// routes/maintenanceRoutes.js
const express = require('express');
const {
  getMaintenances,
  getMaintenance,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  addMaintenanceUpdate,
  getPublicMaintenances
} = require('../controllers/maintenanceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, getMaintenances)
  .post(protect, createMaintenance);

router.route('/:id')
  .get(protect, getMaintenance)
  .put(protect, updateMaintenance)
  .delete(protect, deleteMaintenance);

router.post('/:id/updates', protect, addMaintenanceUpdate);
router.get('/public/:organizationId', getPublicMaintenances);

module.exports = router;