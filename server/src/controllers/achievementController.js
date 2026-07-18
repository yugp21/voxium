const Achievement = require("../models/Achievement");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const ACHIEVEMENTS = require("../config/achievements");

// GET /api/achievements/:username — earned achievements + locked ones with
// their unlock criteria, so the frontend can render a full trophy case
// (not just what's been earned).
const getUserAchievements = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.params.username.toLowerCase() }).select("_id");
  if (!user) throw new ApiError(404, "Player not found");

  const earned = await Achievement.find({ userId: user._id }).sort({ earnedAt: -1 });
  const earnedTitles = new Set(earned.map((a) => a.title));

  const locked = ACHIEVEMENTS.filter((a) => !earnedTitles.has(a.title)).map((a) => ({
    title: a.title,
    description: a.description,
    icon: a.icon,
    locked: true,
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, { earned, locked, totalEarned: earned.length, totalAvailable: ACHIEVEMENTS.length }, "Achievements fetched"));
});

module.exports = { getUserAchievements };