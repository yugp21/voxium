const User = require("../models/User");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

// ─── GLOBAL LEADERBOARD ───────────────────────────────────────────
const getGlobalLeaderboard = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  const players = await User.find()
    .sort({ elo: -1 }) // Highest ELO first
    .skip(skip)
    .limit(Number(limit))
    .select("name username profileImage tier elo country stats.wins stats.losses stats.winRate");

  // Add rank number to each player
  const ranked = players.map((player, index) => ({
    rank: skip + index + 1,
    ...player.toObject(),
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, ranked, "Global leaderboard fetched"));
});

// ─── COUNTRY LEADERBOARD ──────────────────────────────────────────
const getCountryLeaderboard = asyncHandler(async (req, res) => {
  const { country } = req.params;

  const players = await User.find({ country })
    .sort({ elo: -1 })
    .limit(50)
    .select("name username profileImage tier elo country stats.wins stats.losses stats.winRate");

  const ranked = players.map((player, index) => ({
    rank: index + 1,
    ...player.toObject(),
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, ranked, `${country} leaderboard fetched`));
});

// ─── GET PLAYER RANK ─────────────────────────────────────────────
const getPlayerRank = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "Player not found");

  // Count how many players have higher ELO
  const rank = await User.countDocuments({ elo: { $gt: user.elo } });

  return res
    .status(200)
    .json(new ApiResponse(200, { rank: rank + 1, elo: user.elo }, "Player rank fetched"));
});

module.exports = { getGlobalLeaderboard, getCountryLeaderboard, getPlayerRank };