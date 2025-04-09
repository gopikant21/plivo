// TODO: Implement incidentRoutes.js// routes/incidentRoutes.js
const express = require('express');
const {
  getIncidents,
  getIncident,
  createIncident,
  updateIncident,
  deleteIncident,
  addIncidentUpdate,
  getPublicIncidents
} = require('../controllers/incidentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, getIncidents)
  .post(protect, createIncident);

router.route('/:id')
  .get(protect, getIncident)
  .put(protect, updateIncident)
  .delete(protect, deleteIncident);

router.post('/:id/updates', protect, addIncidentUpdate);
router.get('/public/:organizationId', getPublicIncidents);

module.exports = router;