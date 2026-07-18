const express = require("express");
const router = express.Router();
const { getUserAchievements } = require("../controllers/achievementController");
const { verifyJWT } = require("../middlewares/authMiddleware");

router.get("/:username", verifyJWT, getUserAchievements);

module.exports = router;