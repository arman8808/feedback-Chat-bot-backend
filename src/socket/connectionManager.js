const activeConnections = new Map();

export default (io, socket, next) => {
  try {
    const userId = socket.user.id;
    
    // Check for existing connection
    if (activeConnections.has(userId)) {
      const existingSocketId = activeConnections.get(userId);
      const existingSocket = io.sockets.sockets.get(existingSocketId);
      
      if (existingSocket) {
        existingSocket.emit('force-disconnect', {
          code: 'SESSION_LIMIT',
          message: 'You can only have one active session'
        });
        existingSocket.disconnect(true);
      }
    }
    
    // Store new connection
    activeConnections.set(userId, socket.id);
    
    // Cleanup on disconnect
    const disconnectHandler = (reason) => {
      if (activeConnections.get(userId) === socket.id) {
        activeConnections.delete(userId);
        console.log(`Cleaned up connection for user ${userId}`);
      }
    };
    
    socket.on('disconnect', disconnectHandler);
    socket.on('error', disconnectHandler);
    
    next();
  } catch (error) {
    console.error('Connection manager error:', error);
    const err = new Error('CONNECTION_LIMIT');
    err.details = 'Maximum concurrent sessions reached';
    next(err);
  }
};