require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const cloudinary = require("cloudinary").v2;

const PORT = process.env.PORT || 5000;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create HTTP server (needed for Socket.io)
const server = http.createServer(app);

// Initialize Socket.io
const { initSocket } = require("./socket/socketManager");
initSocket(server);

// Connect to DB then start server
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Voxium server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 Client URL: ${process.env.CLIENT_URL}`);
  });
});