const Incident = require('../models/Incident');
const Service = require('../models/Service');
const emailService = require('../utils/emailService');

// @desc    Get all incidents for organization
// @route   GET /api/incidents
// @access  Private
exports.getIncidents = async (req, res) => {
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

    const incidents = await Incident.find(query)
      .populate('services', 'name status')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: incidents.length,
      data: incidents
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get public incidents for an organization
// @route   GET /api/incidents/public/:organizationId
// @access  Public
exports.getPublicIncidents = async (req, res) => {
  try {
    // Build query
    const query = {
      organization: req.params.organizationId
    };

    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Find public services for this organization
    const publicServices = await Service.find({
      organization: req.params.organizationId,
      isPublic: true
    }).select('_id');

    const publicServiceIds = publicServices.map(service => service._id);

    // Add filter to only include incidents affecting public services
    query.services = { $in: publicServiceIds };

    const incidents = await Incident.find(query)
      .populate('services', 'name status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: incidents.length,
      data: incidents
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get single incident
// @route   GET /api/incidents/:id
// @access  Private
exports.getIncident = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('services', 'name status')
      .populate('createdBy', 'firstName lastName')
      .populate('updates.createdBy', 'firstName lastName');

    if (!incident) {
      // Continuing controllers/incidentController.js

      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }

    // Check if incident belongs to user's organization
    if (incident.organization.toString() !== req.user.organization.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this incident'
      });
    }

    res.status(200).json({
      success: true,
      data: incident
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Create new incident
// @route   POST /api/incidents
// @access  Private
exports.createIncident = async (req, res) => {
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
            error: `Not authorized to include service ${serviceId} in incident`
          });
        }
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'At least one service must be affected by the incident'
      });
    }
    
    // Initial update
    if (!req.body.updates) {
      req.body.updates = [];
    }
    
    // Add initial update
    req.body.updates.push({
      status: req.body.status || 'investigating',
      message: req.body.message || `We are investigating issues with ${req.body.services.length} service(s).`,
      createdBy: req.user.id
    });

    const incident = await Incident.create(req.body);
    
    // Update service statuses based on incident impact
    await updateServiceStatuses(req.body.services, req.body.impact, req.user.id);

    // Fetch complete incident with populated fields
    const populatedIncident = await Incident.findById(incident._id)
      .populate('services', 'name status')
      .populate('createdBy', 'firstName lastName')
      .populate('updates.createdBy', 'firstName lastName');

    // Emit socket event for new incident
    const io = req.app.get('io');
    io.emit(`org:${req.user.organization}:incident:created`, populatedIncident);

    // Send email notifications if needed
    await sendIncidentNotifications(populatedIncident);

    res.status(201).json({
      success: true,
      data: populatedIncident
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Update incident
// @route   PUT /api/incidents/:id
// @access  Private
exports.updateIncident = async (req, res) => {
  try {
    let incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }

    // Check if incident belongs to user's organization
    if (incident.organization.toString() !== req.user.organization.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this incident'
      });
    }

    // Add user to updatedBy
    req.body.updatedBy = req.user.id;

    // If status changed to resolved, set resolvedAt
    if (req.body.status === 'resolved' && incident.status !== 'resolved') {
      req.body.resolvedAt = new Date();
    }

    // Update incident
    incident = await Incident.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // If services were updated, update their statuses
    if (req.body.services && req.body.impact) {
      await updateServiceStatuses(req.body.services, req.body.impact, req.user.id);
    }

    // Fetch complete incident with populated fields
    const populatedIncident = await Incident.findById(incident._id)
      .populate('services', 'name status')
      .populate('createdBy', 'firstName lastName')
      .populate('updates.createdBy', 'firstName lastName');

    // Emit socket event for updated incident
    const io = req.app.get('io');
    io.emit(`org:${req.user.organization}:incident:updated`, populatedIncident);

    res.status(200).json({
      success: true,
      data: populatedIncident
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Add update to incident
// @route   POST /api/incidents/:id/updates
// @access  Private
exports.addIncidentUpdate = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }

    // Check if incident belongs to user's organization
    if (incident.organization.toString() !== req.user.organization.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this incident'
      });
    }

    // Create update object
    const update = {
      status: req.body.status,
      message: req.body.message,
      createdBy: req.user.id,
      createdAt: new Date()
    };

    // Add update to incident
    incident.updates.push(update);
    
    // Update incident status
    incident.status = req.body.status;
    
    // If status is resolved, set resolvedAt
    if (req.body.status === 'resolved' && !incident.resolvedAt) {
      incident.resolvedAt = new Date();
      
      // If incident is resolved, update service statuses back to operational
      if (incident.services && incident.services.length > 0) {
        for (const serviceId of incident.services) {
          // Check if there are other active incidents for this service
          const activeIncidents = await Incident.find({
            services: serviceId,
            _id: { $ne: incident._id },
            status: { $ne: 'resolved' }
          });
          
          // If no other active incidents, set service to operational
          if (activeIncidents.length === 0) {
            await Service.findByIdAndUpdate(serviceId, {
              status: 'operational',
              updatedBy: req.user.id
            });
          }
        }
      }
    }
    
    // Save incident
    await incident.save();

    // Fetch complete incident with populated fields
    const populatedIncident = await Incident.findById(incident._id)
      .populate('services', 'name status')
      .populate('createdBy', 'firstName lastName')
      .populate('updates.createdBy', 'firstName lastName');

    // Emit socket event for incident update
    const io = req.app.get('io');
    io.emit(`org:${req.user.organization}:incident:updated`, populatedIncident);
    
    // Also emit specific event for the update
    io.emit(`org:${req.user.organization}:incident:update-added`, {
      incident: populatedIncident,
      update: populatedIncident.updates[populatedIncident.updates.length - 1]
    });

    // Send notification emails if configured
    if (req.body.notify === true) {
      await sendIncidentUpdateNotifications(populatedIncident, update);
    }

    res.status(200).json({
      success: true,
      data: populatedIncident
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Delete incident
// @route   DELETE /api/incidents/:id
// @access  Private
exports.deleteIncident = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        error: 'Incident not found'
      });
    }

    // Check if incident belongs to user's organization
    if (incident.organization.toString() !== req.user.organization.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this incident'
      });
    }

    await incident.remove();

    // Emit socket event for deleted incident
    const io = req.app.get('io');
    io.emit(`org:${req.user.organization}:incident:deleted`, { id: req.params.id });

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

// Helper function to update service statuses based on incident impact
const updateServiceStatuses = async (services, impact, userId) => {
  let status = 'operational';
  
  switch (impact) {
    case 'minor':
      status = 'degraded_performance';
      break;
    case 'major':
      status = 'partial_outage';
      break;
    case 'critical':
      status = 'major_outage';
      break;
  }
  
  // Update all affected services
  for (const serviceId of services) {
    await Service.findByIdAndUpdate(serviceId, {
      status,
      updatedBy: userId
    });
  }
};

// Helper function to send incident notifications
const sendIncidentNotifications = async (incident) => {
  try {
    // Implementation depends on your email service
    await emailService.sendIncidentNotification(incident);
  } catch (error) {
    console.error('Error sending incident notifications:', error);
  }
};

// Helper function to send incident update notifications
const sendIncidentUpdateNotifications = async (incident, update) => {
  try {
    // Implementation depends on your email service
    await emailService.sendIncidentUpdateNotification(incident, update);
  } catch (error) {
    console.error('Error sending incident update notifications:', error);
  }
};

module.exports = exports;