
const activeConnections = new Map();

export default (io, socket, next) => {
  try {
    const userId = socket.userId;
    if (!userId) {
      throw new Error("No userId on socket");
    }
    if (activeConnections.has(userId)) {
      const existingSocketId = activeConnections.get(userId);
      const existingSocket = io.sockets.sockets.get(existingSocketId);
      if (existingSocket) {
        existingSocket.emit('force-disconnect', {
          code: 'SESSION_LIMIT',
          message: 'You can only have one active session',
        });
        existingSocket.disconnect(true);
      }
    }
   
    activeConnections.set(userId, socket.id);
 
    const cleanup = () => {
      if (activeConnections.get(userId) === socket.id) {
        activeConnections.delete(userId);
        console.log(`Cleaned up connection for user ${userId}`);
      }
    };
    socket.on('disconnect', cleanup);
    socket.on('error', cleanup);
    
    next();
  } catch (err) {
    console.error('Connection manager error:', err);
    const error = new Error('CONNECTION_LIMIT');
    error.details = 'Maximum concurrent sessions reached';
    next(error);
  }
};
