const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const initSocket = (server, app) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    transports: ['websocket', 'polling']
  });

  // Middleware for authentication
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      
      if (!token) {
        console.warn("Socket connection attempt without token");
        return next(new Error("Authentication error: No token provided"));
      }
      
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          console.warn("Socket authentication failed:", err.message);
          return next(new Error("Authentication error: Invalid token"));
        }
        
        // Store decoded user info in socket for later use
        const userId = decoded.id || decoded.userId || decoded._id || decoded.uid;
        socket.userId = userId;
        socket.userEmail = decoded.email || "Unknown";
        
        // Join a room specific to the user so we can emit private updates
        socket.join(userId);
        console.log(`User ${socket.userEmail} (ID: ${socket.userId}) connected via Socket.io`);
        next();
      });
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Socket authentication failed"));
    }
  });

  // Connection handlers
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id} (User ID: ${socket.userId})`);

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id} (Reason: ${reason})`);
    });

    socket.on("error", (error) => {
      console.error(`Socket error: ${socket.id}`, error);
    });
  });

  app.set("io", io);
};

module.exports = initSocket;