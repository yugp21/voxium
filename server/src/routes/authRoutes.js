const express = require("express");
const router = express.Router();
const { register, login, logout, refreshAccessToken, getCurrentUser } = require("../controllers/authController");
const { verifyJWT } = require("../middlewares/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/logout", verifyJWT, logout);
router.post("/refresh-token", refreshAccessToken);
router.get("/me", verifyJWT, getCurrentUser);

module.exports = router;