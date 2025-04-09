// TODO: Implement error.js// middleware/error.js
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
  
    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }
  
    // Mongoose duplicate key
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate field value entered'
      });
    }
  
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
  
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }
  
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message || 'Server Error'
    });
  };
  
  module.exports = errorHandler;