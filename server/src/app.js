const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const errorMiddleware = require("./middlewares/errorMiddleware");
const { apiLimiter } = require("./middlewares/rateLimiter");

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit:"10mb" }));
app.use(express.urlencoded({ extended:true, limit:"10mb" }));
app.use(cookieParser());
app.use("/api", apiLimiter);
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// ─── ROUTES ───────────────────────────────────────────────────────
app.use("/api/auth",          require("./routes/authRoutes"));
app.use("/api/users",         require("./routes/userRoutes"));
app.use("/api/debates",       require("./routes/debateRoutes"));
app.use("/api/leaderboard",   require("./routes/leaderboardRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/ai",            require("./routes/aiRoutes"));

app.get("/api/health", (req, res) => res.json({ status:"ok", message:"Voxium API running" }));
app.use((req, res) => res.status(404).json({ success:false, message:"Route not found" }));
app.use(errorMiddleware);

module.exports = app;