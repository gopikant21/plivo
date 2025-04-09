// TODO: Implement teamRoutes.js// routes/teamRoutes.js
const express = require('express');
const {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember
} = require('../controllers/teamController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, getTeams)
  .post(protect, createTeam);

router.route('/:id')
  .get(protect, getTeam)
  .put(protect, updateTeam)
  .delete(protect, deleteTeam);

router.route('/:id/members')
  .post(protect, addTeamMember);

router.route('/:id/members/:userId')
  .delete(protect, removeTeamMember);

module.exports = router;