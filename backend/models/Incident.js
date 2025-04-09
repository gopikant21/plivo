const mongoose = require('mongoose');

const IncidentUpdateSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['investigating', 'identified', 'monitoring', 'resolved'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const IncidentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide incident name'],
    trim: true,
    maxlength: [200, 'Incident name cannot be more than 200 characters']
  },
  status: {
    type: String,
    enum: ['investigating', 'identified', 'monitoring', 'resolved'],
    default: 'investigating'
  },
  impact: {
    type: String,
    enum: ['none', 'minor', 'major', 'critical'],
    default: 'minor'
  },
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  }],
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  updates: [IncidentUpdateSchema],
  startedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Incident', IncidentSchema);