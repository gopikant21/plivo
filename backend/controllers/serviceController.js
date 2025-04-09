const Service = require('../models/Service');
const Incident = require('../models/Incident');
const Maintenance = require('../models/Maintenance');

// @desc    Get all services for organization
// @route   GET /api/services
// @access  Private
exports.getServices = async (req, res) => {
  try {
    const services = await Service.find({ organization: req.user.organization })
      .sort({ group: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get public services for an organization
// @route   GET /api/services/public/:organizationId
// @access  Public
exports.getPublicServices = async (req, res) => {
  try {
    const services = await Service.find({ 
      organization: req.params.organizationId,
      isPublic: true
    }).sort({ group: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Private
exports.getService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }

    // Check if service belongs to user's organization
    if (service.organization.toString() !== req.user.organization.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this service'
      });
    }

    res.status(200).json({
      success: true,
      data: service
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Create new service
// @route   POST /api/services
// @access  Private
exports.createService = async (req, res) => {
  try {
    // Add organization and user to request body
    req.body.organization = req.user.organization;
    req.body.createdBy = req.user.id;

    const service = await Service.create(req.body);

    // Emit socket event for new service
    const io = req.app.get('io');
    io.emit(`org:${req.user.organization}:service:created`, service);

    res.status(201).json({
      success: true,
      data: service
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private
exports.updateService = async (req, res) => {
  try {
    let service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }

    // Check if service belongs to user's organization
    if (service.organization.toString() !== req.user.organization.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this service'
      });
    }

    // Add user to updatedBy
    req.body.updatedBy = req.user.id;

    // Check if status is being changed
    const statusChanged = service.status !== req.body.status;
    const oldStatus = service.status;

    service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // Emit socket event for updated service
    const io = req.app.get('io');
    io.emit(`org:${req.user.organization}:service:updated`, service);

    // If status changed, emit additional event
    if (statusChanged) {
      io.emit(`org:${req.user.organization}:service:status-changed`, {
        service,
        oldStatus,
        newStatus: service.status
      });
    }

    res.status(200).json({
      success: true,
      data: service
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }

    // Check if service belongs to user's organization
    if (service.organization.toString() !== req.user.organization.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this service'
      });
    }

    // Check if service has incidents
    const hasIncidents = await Incident.findOne({ services: service._id });
    
    if (hasIncidents) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete service with associated incidents'
      });
    }

    // Check if service has maintenances
    const hasMaintenances = await Maintenance.findOne({ services: service._id });
    
    if (hasMaintenances) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete service with associated maintenances'
      });
    }

    await service.remove();

    // Emit socket event for deleted service
    const io = req.app.get('io');
    io.emit(`org:${req.user.organization}:service:deleted`, service);

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