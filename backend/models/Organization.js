const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide organization name'],
    trim: true,
    maxlength: [100, 'Organization name cannot be more than 100 characters']
  },
  domain: {
    type: String,
    trim: true
  },
  logo: {
    type: String
  },
  settings: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    dateFormat: {
      type: String,
      enum: ['US', 'EU', 'ISO'],
      default: 'ISO'
    },
    themeColor: {
      type: String,
      default: '#3B82F6'
    },
    allowSubscribers: {
      type: Boolean,
      default: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  customDomain: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'starter', 'business', 'enterprise'],
      default: 'free'
    },
    expiresAt: {
      type: Date
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Organization', OrganizationSchema);