const express = require("express");
const router = express.Router();
const { getGlobalLeaderboard, getCountryLeaderboard, getPlayerRank } = require("../controllers/leaderboardController");
const { verifyJWT } = require("../middlewares/authMiddleware");

router.get("/global", getGlobalLeaderboard);
router.get("/country/:country", getCountryLeaderboard);
router.get("/rank/:userId", verifyJWT, getPlayerRank);

module.exports = router;