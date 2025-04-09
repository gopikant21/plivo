// TODO: Implement websocket.js// config/websocket.js
const socketIo = require('socket.io');

const setupWebSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Join organization room if specified
    socket.on('join-org', (orgId) => {
      socket.join(`org:${orgId}`);
      console.log(`Socket ${socket.id} joined room org:${orgId}`);
    });
    
    // Join service room if specified
    socket.on('join-service', (serviceId) => {
      socket.join(`service:${serviceId}`);
      console.log(`Socket ${socket.id} joined room service:${serviceId}`);
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

module.exports = setupWebSocket;