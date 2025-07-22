const activeConnections = new Map();

export default (io, socket, next) => {
  try {
 
    if (!socket.userId) {
      return next(new Error("UNAUTHENTICATED"));
    }

   
    const existingSocketId = activeConnections.get(socket.userId);
    if (existingSocketId && existingSocketId !== socket.id) {
      const existingSocket = io.sockets.sockets.get(existingSocketId);
      if (existingSocket) {
        existingSocket.emit('force-disconnect', {
          code: 'DUPLICATE_CONNECTION',
          message: 'New connection replacing this one'
        });
        existingSocket.disconnect();
      }
    }

    activeConnections.set(socket.userId, socket.id);
    console.log(`New connection for user ${socket.userId}`);

    const cleanup = () => {
      if (activeConnections.get(socket.userId) === socket.id) {
        activeConnections.delete(socket.userId);
        console.log(`Connection cleaned for user ${socket.userId}`);
      }
    };

    socket.on('disconnect', cleanup);
    socket.on('error', cleanup);
    
    next();
  } catch (err) {
    console.error('Connection manager error:', err);
    next(err);
  }
};