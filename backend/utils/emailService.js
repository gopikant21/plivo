// TODO: Implement emailService.js// utils/emailService.js (continued)
const nodemailer = require('nodemailer');

// Create a test account if in development
let testAccount;
let transporter;

const initializeTransporter = async () => {
  if (process.env.NODE_ENV === 'production') {
    // Use real email service in production
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else {
    // Use ethereal for development
    testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log('Ethereal email account:', testAccount.user);
  }
};

// Initialize transporter on module load
(async () => {
  await initializeTransporter();
})();

// Send incident notification
exports.sendIncidentNotification = async (incident) => {
  try {
    if (!transporter) {
      await initializeTransporter();
    }

    // Get service names
    const serviceNames = incident.services.map(service => service.name).join(', ');

    const message = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: process.env.NODE_ENV === 'production' ? 'subscribers' : testAccount.user,
      subject: `[${incident.impact.toUpperCase()}] New Incident: ${incident.name}`,
      html: `
        <h1>New Incident Reported</h1>
        <p><strong>Status:</strong> ${incident.status}</p>
        <p><strong>Impact:</strong> ${incident.impact}</p>
        <p><strong>Affected Services:</strong> ${serviceNames}</p>
        <p><strong>Description:</strong> ${incident.updates[0].message}</p>
        <p><a href="${process.env.FRONTEND_URL}/incidents/${incident._id}">View Details</a></p>
      `
    };

    const info = await transporter.sendMail(message);
    console.log('Incident notification sent:', info.messageId);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Error sending incident notification:', error);
    throw error;
  }
};

// Send incident update notification
exports.sendIncidentUpdateNotification = async (incident, update) => {
  try {
    if (!transporter) {
      await initializeTransporter();
    }

    // Get service names
    const serviceNames = incident.services.map(service => service.name).join(', ');

    const message = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: process.env.NODE_ENV === 'production' ? 'subscribers' : testAccount.user,
      subject: `[UPDATE] Incident: ${incident.name}`,
      html: `
        <h1>Incident Update</h1>
        <p><strong>Status:</strong> ${update.status}</p>
        <p><strong>Affected Services:</strong> ${serviceNames}</p>
        <p><strong>Update:</strong> ${update.message}</p>
        <p><a href="${process.env.FRONTEND_URL}/incidents/${incident._id}">View Details</a></p>
      `
    };

    const info = await transporter.sendMail(message);
    console.log('Incident update notification sent:', info.messageId);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Error sending incident update notification:', error);
    throw error;
  }
};

// Send maintenance notification
exports.sendMaintenanceNotification = async (maintenance) => {
  try {
    if (!transporter) {
      await initializeTransporter();
    }

    // Get service names
    const serviceNames = maintenance.services.map(service => service.name).join(', ');
    
    // Format dates
    const startTime = new Date(maintenance.scheduledStartTime).toLocaleString();
    const endTime = new Date(maintenance.scheduledEndTime).toLocaleString();

    const message = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: process.env.NODE_ENV === 'production' ? 'subscribers' : testAccount.user,
      subject: `[MAINTENANCE] Scheduled: ${maintenance.name}`,
      html: `
        <h1>Scheduled Maintenance</h1>
        <p><strong>Status:</strong> ${maintenance.status}</p>
        <p><strong>Scheduled Time:</strong> ${startTime} - ${endTime}</p>
        <p><strong>Affected Services:</strong> ${serviceNames}</p>
        <p><strong>Description:</strong> ${maintenance.description}</p>
        <p><a href="${process.env.FRONTEND_URL}/maintenance/${maintenance._id}">View Details</a></p>
      `
    };

    const info = await transporter.sendMail(message);
    console.log('Maintenance notification sent:', info.messageId);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Error sending maintenance notification:', error);
    throw error;
  }
};

// Send maintenance update notification
exports.sendMaintenanceUpdateNotification = async (maintenance, update) => {
  try {
    if (!transporter) {
      await initializeTransporter();
    }

    // Get service names
    const serviceNames = maintenance.services.map(service => service.name).join(', ');

    const message = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: process.env.NODE_ENV === 'production' ? 'subscribers' : testAccount.user,
      subject: `[UPDATE] Maintenance: ${maintenance.name}`,
      html: `
        <h1>Maintenance Update</h1>
        <p><strong>Status:</strong> ${update.status}</p>
        <p><strong>Affected Services:</strong> ${serviceNames}</p>
        <p><strong>Update:</strong> ${update.message}</p>
        <p><a href="${process.env.FRONTEND_URL}/maintenance/${maintenance._id}">View Details</a></p>
      `
    };

    const info = await transporter.sendMail(message);
    console.log('Maintenance update notification sent:', info.messageId);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return info;
  } catch (error) {
    console.error('Error sending maintenance update notification:', error);
    throw error;
  }
};

module.exports = exports;