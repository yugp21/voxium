const User = require("../models/User");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

// ─── GLOBAL LEADERBOARD ───────────────────────────────────────────
const getGlobalLeaderboard = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  // Secondary sort by createdAt is the tiebreaker for equal ELO (e.g. every
  // brand-new Wanderer starts at elo 0) — without it, Mongo's sort order
  // for ties is not guaranteed stable, so the same player could appear at
  // a different position on every request.
  const players = await User.find()
    .sort({ elo: -1, createdAt: 1 })
    .skip(skip)
    .limit(Number(limit))
    .select("name username profileImage tier elo country createdAt stats.wins stats.losses stats.winRate");

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
  const { page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  const players = await User.find({ country })
    .sort({ elo: -1, createdAt: 1 })
    .skip(skip)
    .limit(Number(limit))
    .select("name username profileImage tier elo country createdAt stats.wins stats.losses stats.winRate");

  const ranked = players.map((player, index) => ({
    rank: skip + index + 1,
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

  // Must match the exact ordering used by getGlobalLeaderboard (elo desc,
  // createdAt asc) or "Your Rank" and your position in the list will
  // disagree whenever there's a tie — which is the common case for anyone
  // who hasn't finished a ranked debate yet (elo defaults to 0 for everyone).
  const rank = await User.countDocuments({
    $or: [
      { elo: { $gt: user.elo } },
      { elo: user.elo, createdAt: { $lt: user.createdAt } },
    ],
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { rank: rank + 1, elo: user.elo }, "Player rank fetched"));
});

module.exports = { getGlobalLeaderboard, getCountryLeaderboard, getPlayerRank };