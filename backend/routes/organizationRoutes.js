// TODO: Implement organizationRoutes.js// routes/organizationRoutes.js
const express = require('express');
const {
  getOrganization,
  updateOrganization,
  getOrganizationMembers,
  getOrganizationStats,
  updateOrganizationSettings
} = require('../controllers/organizationController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.route('/:id')
  .get(protect, getOrganization)
  .put(protect, admin, updateOrganization);

router.route('/:id/members')
  .get(protect, getOrganizationMembers);

router.route('/:id/stats')
  .get(protect, getOrganizationStats);

router.route('/:id/settings')
  .put(protect, admin, updateOrganizationSettings);

module.exports = router;