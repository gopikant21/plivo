// TODO: Implement serviceRoutes.js// routes/serviceRoutes.js
const express = require('express');
const {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
  getPublicServices
} = require('../controllers/serviceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, getServices)
  .post(protect, createService);

router.route('/:id')
  .get(protect, getService)
  .put(protect, updateService)
  .delete(protect, deleteService);

router.get('/public/:organizationId', getPublicServices);

module.exports = router;