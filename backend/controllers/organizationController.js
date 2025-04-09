// TODO: Implement organizationController.js// controllers/organizationController.js
const Organization = require('../models/Organization');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

// @desc    Get organization
// @route   GET /api/organizations/:id
// @access  Private
exports.getOrganization = async (req, res) => {
  try {
    // Only allow users to access their own organization
    if (req.params.id !== req.user.organization.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this organization'
      });
    }

    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    res.status(200).json({
      success: true,
      data: organization
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Update organization
// @route   PUT /api/organizations/:id
// @access  Private/Admin
exports.updateOrganization = async (req, res) => {
  try {
    // Only allow users to update their own organization
    if (req.params.id !== req.user.organization.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this organization'
      });
    }

    const organization = await Organization.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    res.status(200).json({
      success: true,
      data: organization
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get organization members
// @route   GET /api/organizations/:id/members
// @access  Private
exports.getOrganizationMembers = async (req, res) => {
  try {
    // Only allow users to access their own organization's members
    if (req.params.id !== req.user.organization.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this organization'
      });
    }

    const members = await User.find({ organization: req.params.id })
      .select('firstName lastName email role lastLogin teams isActive')
      .sort({ firstName: 1, lastName: 1 });

    res.status(200).json({
      success: true,
      count: members.length,
      data: members
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get organization statistics
// @route   GET /api/organizations/:id/stats
// @access  Private
exports.getOrganizationStats = async (req, res) => {
  try {
    // Only allow users to access their own organization's stats
    if (req.params.id !== req.user.organization.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this organization'
      });
    }

    // Count services
    const serviceCount = await Service.countDocuments({
      organization: req.params.id
    });

    // Count active incidents
    const activeIncidentCount = await Incident.countDocuments({
      organization: req.params.id,
      status: { $ne: 'resolved' }
    });

    // Count upcoming maintenances
    const upcomingMaintenanceCount = await Maintenance.countDocuments({
      organization: req.params.id,
      status: { $in: ['scheduled', 'in_progress'] },
      scheduledEndTime: { $gte: new Date() }
    });

    // Count team members
    const memberCount = await User.countDocuments({
      organization: req.params.id
    });

    // Get uptime
    const services = await Service.find({
      organization: req.params.id
    });

    const averageUptime = services.length > 0
      ? services.reduce((sum, service) => sum + service.uptime.last24Hours, 0) / services.length
      : 100;

    res.status(200).json({
      success: true,
      data: {
        serviceCount,
        activeIncidentCount,
        upcomingMaintenanceCount,
        memberCount,
        averageUptime
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Update organization settings
// @route   PUT /api/organizations/:id/settings
// @access  Private/Admin
exports.updateOrganizationSettings = async (req, res) => {
  try {
    // Only allow admins to update their own organization's settings
    if (req.params.id !== req.user.organization.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this organization'
      });
    }

    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    // Update settings
    organization.settings = {
      ...organization.settings,
      ...req.body
    };

    await organization.save();

    res.status(200).json({
      success: true,
      data: organization
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

module.exports = exports;