// TODO: Implement teamController.js// controllers/teamController.js
const Team = require('../models/Team');
const User = require('../models/User');
const emailService = require('../utils/emailService');

// @desc    Get all teams for organization
// @route   GET /api/teams
// @access  Private
exports.getTeams = async (req, res) => {
  try {
    const teams = await Team.find({ organization: req.user.organization })
      .populate('members.user', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get single team
// @route   GET /api/teams/:id
// @access  Private
exports.getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members.user', 'firstName lastName email')
      .populate('services', 'name status')
      .populate('createdBy', 'firstName lastName');

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    // Check if team belongs to user's organization
    if (team.organization.toString() !== req.user.organization.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this team'
      });
    }

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Create new team
// @route   POST /api/teams
// @access  Private
exports.createTeam = async (req, res) => {
  try {
    // Add organization and user to request body
    req.body.organization = req.user.organization;
    req.body.createdBy = req.user.id;
    
    // Ensure current user is a member of the team
    if (!req.body.members) {
      req.body.members = [];
    }
    
    // Add current user as admin if not already in members list
    if (!req.body.members.some(member => member.user.toString() === req.user.id)) {
      req.body.members.push({
        user: req.user.id,
        role: 'admin'
      });
    }

    const team = await Team.create(req.body);
    
    // Add team to user's teams
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { teams: team._id }
    });
    
    // Add team to other users' teams
    for (const member of req.body.members) {
      if (member.user.toString() !== req.user.id) {
        await User.findByIdAndUpdate(member.user, {
          $addToSet: { teams: team._id }
        });
      }
    }

    // Fetch complete team with populated fields
    const populatedTeam = await Team.findById(team._id)
      .populate('members.user', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      data: populatedTeam
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private
exports.updateTeam = async (req, res) => {
  try {
    let team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    // Check if team belongs to user's organization
    if (team.organization.toString() !== req.user.organization.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this team'
      });
    }
    
    // Check if user is team admin
    const userMember = team.members.find(member => member.user.toString() === req.user.id);
    if (!userMember || userMember.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only team admins can update team details'
      });
    }

    // Update team
    team = await Team.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('members.user', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Add member to team
// @route   POST /api/teams/:id/members
// @access  Private
exports.addTeamMember = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and role'
      });
    }

    // Find team
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    // Check if team belongs to user's organization
    if (team.organization.toString() !== req.user.organization.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this team'
      });
    }
    
    // Check if user is team admin
    const userMember = team.members.find(member => member.user.toString() === req.user.id);
    if (!userMember || userMember.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only team admins can add members'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user belongs to same organization
    if (user.organization.toString() !== req.user.organization.toString()) {
      return res.status(403).json({
        success: false,
        error: 'User must belong to the same organization'
      });
    }

    // Check if user is already a member
    if (team.members.some(member => member.user.toString() === user._id.toString())) {
      return res.status(400).json({
        success: false,
        error: 'User is already a member of this team'
      });
    }

    // Add user to team
    team.members.push({
      user: user._id,
      role
    });

    await team.save();
    
    // Add team to user's teams
    await User.findByIdAndUpdate(user._id, {
      $addToSet: { teams: team._id }
    });

    // Fetch complete team with populated fields
    const populatedTeam = await Team.findById(team._id)
      .populate('members.user', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: populatedTeam
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Remove member from team
// @route   DELETE /api/teams/:id/members/:userId
// @access  Private
exports.removeTeamMember = async (req, res) => {
  try {
    // Find team
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    // Check if team belongs to user's organization
    if (team.organization.toString() !== req.user.organization.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this team'
      });
    }
    
    // Check if user is team admin
    const userMember = team.members.find(member => member.user.toString() === req.user.id);
    if (!userMember || userMember.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only team admins can remove members'
      });
    }
    
    // Check if trying to remove last admin
    if (req.params.userId === req.user.id) {
      const adminCount = team.members.filter(member => member.role === 'admin').length;
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: 'Cannot remove the last admin from the team'
        });
      }
    }

    // Remove user from team
    team.members = team.members.filter(
      member => member.user.toString() !== req.params.userId
    );

    await team.save();
    
    // Remove team from user's teams
    await User.findByIdAndUpdate(req.params.userId, {
      $pull: { teams: team._id }
    });

    // Fetch complete team with populated fields
    const populatedTeam = await Team.findById(team._id)
      .populate('members.user', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: populatedTeam
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Delete team
// @route   DELETE /api/teams/:id
// @access  Private
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    // Check if team belongs to user's organization
    if (team.organization.toString() !== req.user.organization.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this team'
      });
    }
    
    // Check if user is team admin
    const userMember = team.members.find(member => member.user.toString() === req.user.id);
    if (!userMember || userMember.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only team admins can delete the team'
      });
    }

    // Remove team from all users' teams
    for (const member of team.members) {
      await User.findByIdAndUpdate(member.user, {
        $pull: { teams: team._id }
      });
    }

    await team.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

module.exports = exports;