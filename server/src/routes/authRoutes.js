const express = require("express");
const router = express.Router();
const { register, login, logout, refreshAccessToken, getCurrentUser } = require("../controllers/authController");
const { verifyJWT } = require("../middlewares/authMiddleware");
const { authLimiter } = require("../middlewares/rateLimiter");
const { registerValidator, loginValidator } = require("../middlewares/validators/authValidators");

router.post("/register", authLimiter, registerValidator, register);
router.post("/login", authLimiter, loginValidator, login);
router.post("/logout", verifyJWT, logout);
router.post("/refresh-token", authLimiter, refreshAccessToken);
router.get("/me", verifyJWT, getCurrentUser);

module.exports = router;