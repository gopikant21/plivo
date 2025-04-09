// controllers/maintenanceController.js
const Maintenance = require('../models/Maintenance');
const Service = require('../models/Service');
const emailService = require('../utils/emailService');

// @desc    Get all maintenance events for organization
// @route   GET /api/maintenance
// @access  Private
exports.getMaintenances = async (req, res) => {
  try {
    // Build query
    const query = {
      organization: req.user.organization
    };

    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by service if provided
    if (req.query.service) {
      query.services = req.query.service;
    }

    // Filter by date range if provided
    if (req.query.from) {
      query.scheduledStartTime = { $gte: new Date(req.query.from) };
    }
    if (req.query.to) {
      query.scheduledEndTime = { $lte: new Date(req.query.to) };
    }

    const maintenances = await Maintenance.find(query)
      .populate('services', 'name status')
      .populate('createdBy', 'firstName lastName')
      .sort({ scheduledStartTime: -1 });

    res.status(200).json({
      success: true,
      count: maintenances.length,
      data: maintenances
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get public maintenance events for an organization
// @route   GET /api/maintenance/public/:organizationId
// @access  Public
exports.getPublicMaintenances = async (req, res) => {
  try {
    // Find public services for this organization
    const publicServices = await Service.find({
      organization: req.params.organizationId,
      isPublic: true
    }).select('_id');

    const publicServiceIds = publicServices.map(service => service._id);

    // Build query
    const query = {
      organization: req.params.organizationId,
      services: { $in: publicServiceIds }
    };

    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter for upcoming and ongoing maintenances
    if (req.query.upcoming === 'true') {
      query.status = { $in: ['scheduled', 'in_progress'] };
      query.scheduledEndTime = { $gte: new Date() };
    }

    // Filter by date range if provided
    if (req.query.from) {
      query.scheduledStartTime = { $gte: new Date(req.query.from) };
    }
    if (req.query.to) {
      query.scheduledEndTime = { $lte: new Date(req.query.to) };
    }

    const maintenances = await Maintenance.find(query)
      .populate('services', 'name status')
      .sort({ scheduledStartTime: -1 });

    res.status(200).json({
      success: true,
      count: maintenances.length,
      data: maintenances
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get single maintenance
// @route   GET /api/maintenance/:id
// @access  Private
exports.getMaintenance = async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id)
      .populate('services', 'name status')
      .populate('createdBy', 'firstName lastName')
      .populate('updates.createdBy', 'firstName lastName');

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        error: 'Maintenance not found'
      });
    }

    // Check if maintenance belongs to user's organization
    if (maintenance.organization.toString() !== req.user.organization.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this maintenance'
      });
    }

    res.status(200).json({
      success: true,
      data: maintenance
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Create new maintenance
// @route   POST /api/maintenance
// @access  Private
exports.createMaintenance = async (req, res) => {
  try {
    // Add organization and user to request body
    req.body.organization = req.user.organization;
    req.body.createdBy = req.user.id;
    
    // Make sure services exist and belong to this organization
    if (req.body.services && req.body.services.length > 0) {
      for (const serviceId of req.body.services) {
        const service = await Service.findById(serviceId);
        
        if (!service) {
          return res.status(404).json({
            success: false,
            error: `Service with ID ${serviceId} not found`
          });
        }
        
        if (service.organization.toString() !== req.user.organization.toString()) {
          return res.status(403).json({
            success: false,
            error: `Not authorized to include service ${serviceId} in maintenance`
          });
        }
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'At least one service must be affected by the maintenance'
      });
    }
    
    // Validate start and end times
    const startTime = new Date(req.body.scheduledStartTime);
    const endTime = new Date(req.body.scheduledEndTime);
    
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format'
      });
    }
    
    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        error: 'End time must be after start time'
      });
    }
    
    // Initial update
    if (!req.body.updates) {
      req.body.updates = [];
    }
    
    // Add initial update
    req.body.updates.push({
      status: req.body.status || 'scheduled',
      message: req.body.description || `Scheduled maintenance for ${req.body.services.length} service(s).`,
      createdBy: req.user.id
    });

    const maintenance = await Maintenance.create(req.body);

    // Update service status to maintenance if it's in progress
    if (req.body.status === 'in_progress') {
      for (const serviceId of req.body.services) {
        await Service.findByIdAndUpdate(serviceId, {
          status: 'maintenance',
          updatedBy: req.user.id
        });
      }
    }

    // Fetch complete maintenance with populated fields
    const populatedMaintenance = await Maintenance.findById(maintenance._id)
      .populate('services', 'name status')
      .populate('createdBy', 'firstName lastName')
      .populate('updates.createdBy', 'firstName lastName');

    // Emit socket event for new maintenance
    const io = req.app.get('io');
    io.emit(`org:${req.user.organization}:maintenance:created`, populatedMaintenance);

    // Send email notifications if needed
    if (req.body.notify === true) {
      await sendMaintenanceNotifications(populatedMaintenance);
    }

    res.status(201).json({
      success: true,
      data: populatedMaintenance
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Update maintenance
// @route   PUT /api/maintenance/:id
// @access  Private
exports.updateMaintenance = async (req, res) => {
  try {
    let maintenance = await Maintenance.findById(req.params.id);

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        error: 'Maintenance not found'
      });
    }

    // Check if maintenance belongs to user's organization
    if (maintenance.organization.toString() !== req.user.organization.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this maintenance'
      });
    }

    // Add user to updatedBy
    req.body.updatedBy = req.user.id;

    // Check for status changes requiring service updates
    const statusChanged = req.body.status && maintenance.status !== req.body.status;
    
    // Update maintenance
    maintenance = await Maintenance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Update service statuses based on maintenance status
    if (statusChanged) {
      if (req.body.status === 'in_progress') {
        // If maintenance is now in progress, update service status
        maintenance.actualStartTime = new Date();
        
        for (const serviceId of maintenance.services) {
          await Service.findByIdAndUpdate(serviceId, {
            status: 'maintenance',
            updatedBy: req.user.id
          });
        }
      } else if (req.body.status === 'completed') {
        // If maintenance is now completed, update service status to operational
        maintenance.actualEndTime = new Date();
        
        for (const serviceId of maintenance.services) {
          // Check if there are active incidents for this service
          const activeIncidents = await Incident.find({
            services: serviceId,
            status: { $ne: 'resolved' }
          });
          
          // Only set to operational if no active incidents
          if (activeIncidents.length === 0) {
            await Service.findByIdAndUpdate(serviceId, {
              status: 'operational',
              updatedBy: req.user.id
            });
          }
        }
      }
      
      // Save updates to maintenance times
      await maintenance.save();
    }

    // Fetch complete maintenance with populated fields
    const populatedMaintenance = await Maintenance.findById(maintenance._id)
      .populate('services', 'name status')
      .populate('createdBy', 'firstName lastName')
      .populate('updates.createdBy', 'firstName lastName');

    // Emit socket event for updated maintenance
    const io = req.app.get('io');
    io.emit(`org:${req.user.organization}:maintenance:updated`, populatedMaintenance);

    res.status(200).json({
      success: true,
      data: populatedMaintenance
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Add update to maintenance
// @route   POST /api/maintenance/:id/updates
// @access  Private
exports.addMaintenanceUpdate = async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id);

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        error: 'Maintenance not found'
      });
    }

    // Check if maintenance belongs to user's organization
    if (maintenance.organization.toString() !== req.user.organization.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this maintenance'
      });
    }

    // Create update object
    const update = {
      status: req.body.status,
      message: req.body.message,
      createdBy: req.user.id,
      createdAt: new Date()
    };

    // Add update to maintenance
    maintenance.updates.push(update);
    
    // Update maintenance status
    maintenance.status = req.body.status;
    
    // Handle status changes
    if (req.body.status === 'in_progress' && !maintenance.actualStartTime) {
      maintenance.actualStartTime = new Date();
      
      // Update service statuses to maintenance
      for (const serviceId of maintenance.services) {
        await Service.findByIdAndUpdate(serviceId, {
          status: 'maintenance',
          updatedBy: req.user.id
        });
      }
    } else if (req.body.status === 'completed' && !maintenance.actualEndTime) {
      maintenance.actualEndTime = new Date();
      
      // Update service statuses to operational
      for (const serviceId of maintenance.services) {
        // Check if there are active incidents for this service
        const activeIncidents = await Incident.find({
          services: serviceId,
          status: { $ne: 'resolved' }
        });
        
        // Only set to operational if no active incidents
        if (activeIncidents.length === 0) {
          await Service.findByIdAndUpdate(serviceId, {
            status: 'operational',
            updatedBy: req.user.id
          });
        }
      }
    }
    
    // Save maintenance
    await maintenance.save();

    // Fetch complete maintenance with populated fields
    const populatedMaintenance = await Maintenance.findById(maintenance._id)
      .populate('services', 'name status')
      .populate('createdBy', 'firstName lastName')
      .populate('updates.createdBy', 'firstName lastName');

    // Emit socket event for maintenance update
    const io = req.app.get('io');
    io.emit(`org:${req.user.organization}:maintenance:updated`, populatedMaintenance);
    
    // Also emit specific event for the update
    io.emit(`org:${req.user.organization}:maintenance:update-added`, {
      maintenance: populatedMaintenance,
      update: populatedMaintenance.updates[populatedMaintenance.updates.length - 1]
    });

    // Send notification emails if configured
    if (req.body.notify === true) {
      await sendMaintenanceUpdateNotifications(populatedMaintenance, update);
    }

    res.status(200).json({
      success: true,
      data: populatedMaintenance
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Delete maintenance
// @route   DELETE /api/maintenance/:id
// @access  Private
exports.deleteMaintenance = async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id);

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        error: 'Maintenance not found'
      });
    }

    // Check if maintenance belongs to user's organization
    if (maintenance.organization.toString() !== req.user.organization.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this maintenance'
      });
    }

    await maintenance.remove();

    // Emit socket event for deleted maintenance
    const io = req.app.get('io');
    io.emit(`org:${req.user.organization}:maintenance:deleted`, { id: req.params.id });

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

// Helper function to send maintenance notifications
const sendMaintenanceNotifications = async (maintenance) => {
  try {
    // Implementation depends on your email service
    await emailService.sendMaintenanceNotification(maintenance);
  } catch (error) {
    console.error('Error sending maintenance notifications:', error);
  }
};

// Helper function to send maintenance update notifications
const sendMaintenanceUpdateNotifications = async (maintenance, update) => {
  try {
    // Implementation depends on your email service
    await emailService.sendMaintenanceUpdateNotification(maintenance, update);
  } catch (error) {
    console.error('Error sending maintenance update notifications:', error);
  }
};

module.exports = exports;