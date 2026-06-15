const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // ─── AUTH MIDDLEWARE FOR SOCKET ───────────────────────────────
  // Every socket connection must send a valid JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token ||
                    socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded._id).select("-password -refreshToken");

      if (!user) return next(new Error("User not found"));

      // Attach user to socket so all handlers know who this is
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  // ─── CONNECTION ───────────────────────────────────────────────
  io.on("connection", async (socket) => {
    console.log(`⚡ Socket connected: ${socket.user.username} (${socket.id})`);

    // Mark user online
    await User.findByIdAndUpdate(socket.user._id, { isOnline: true });

    // Join personal room for private notifications
    socket.join(`user:${socket.user._id}`);

    // Load socket event handlers
    require("./matchmakingSocket")(io, socket);
    require("./debateSocket")(io, socket);
    require("./notificationSocket")(io, socket);

    // ─── DISCONNECT ───────────────────────────────────────────
    socket.on("disconnect", async () => {
      console.log(`❌ Socket disconnected: ${socket.user.username}`);
      await User.findByIdAndUpdate(socket.user._id, {
        isOnline: false,
        lastSeen: new Date(),
      });
    });
  });

  console.log("⚡ Socket.io initialized");
  return io;
};

// Export io instance so other files can use it to emit events
const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

module.exports = { initSocket, getIO };