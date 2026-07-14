const Debate = require("../models/Debate");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
 
// Get debate by ID
const getDebate = asyncHandler(async (req, res) => {
  const debate = await Debate.findById(req.params.id)
    .populate("player1", "name username profileImage tier elo")
    .populate("player2", "name username profileImage tier elo")
    .populate("winner", "name username");
  if (!debate) throw new ApiError(404, "Debate not found");
  return res.status(200).json(new ApiResponse(200, debate, "Debate fetched"));
});
 
// Get user debate history
const getDebateHistory = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page=1, limit=10 } = req.query;
  const skip = (page-1)*limit;
 
  const debates = await Debate.find({
    $or: [{ player1:userId }, { player2:userId }],
  })
    .sort({ createdAt:-1 })
    .skip(skip)
    .limit(Number(limit))
    .populate("player1","name username profileImage tier")
    .populate("player2","name username profileImage tier")
    .populate("winner","name username");
 
  return res.status(200).json(new ApiResponse(200, debates, "History fetched"));
});
 
// Create debate (called by matchmaking socket, but also available via API)
const createDebate = asyncHandler(async (req, res) => {
  const { player1, player2, topic, division, language, mode } = req.body;
  const debate = await Debate.create({ player1, player2, topic, division, language, mode });
  return res.status(201).json(new ApiResponse(201, debate, "Debate created"));
});
 
module.exports = { getDebate, getDebateHistory, createDebate };