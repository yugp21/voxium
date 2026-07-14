// AI Controller — handles all AI feature requests
const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const Debate = require("../models/Debate");
const User = require("../models/User");
const { judgeDebate, coachPlayer, analyzeDebateDNA, generateTopics, summarizeDebate } = require("../services/aiService");

// ── GET AI JUDGE VERDICT ──────────────────────────────────────────
const getAIJudgeVerdict = asyncHandler(async (req, res) => {
  const { debateId } = req.params;
  const debate = await Debate.findById(debateId)
    .populate("player1", "name username")
    .populate("player2", "name username");
  if (!debate) throw new ApiError(404, "Debate not found");

  const verdict = await judgeDebate({
    topic: debate.topic,
    division: debate.division,
    player1Name: debate.player1.username,
    player2Name: debate.player2.username,
    audienceVotes: debate.score,
  });

  if (!verdict) throw new ApiError(500, "AI Judge unavailable");

  // Save AI verdict to debate
  await Debate.findByIdAndUpdate(debateId, { aiVerdict: verdict, aiJudgeUsed: true });

  return res.status(200).json(new ApiResponse(200, verdict, "AI verdict generated"));
});

// ── GET AI COACHING ───────────────────────────────────────────────
const getAICoaching = asyncHandler(async (req, res) => {
  const { debateId } = req.params;
  const userId = req.user._id;

  const debate = await Debate.findById(debateId)
    .populate("player1", "name username")
    .populate("player2", "name username");
  if (!debate) throw new ApiError(404, "Debate not found");

  const isPlayer1 = debate.player1._id.toString() === userId.toString();
  const playerName = isPlayer1 ? debate.player1.username : debate.player2.username;
  const won = debate.winner?.toString() === userId.toString();

  const coaching = await coachPlayer({
    playerName,
    topic: debate.topic,
    division: debate.division,
    won,
    audienceVotes: debate.score,
  });

  if (!coaching) throw new ApiError(500, "AI Coach unavailable");

  return res.status(200).json(new ApiResponse(200, coaching, "AI coaching generated"));
});

// ── GET DEBATE DNA ────────────────────────────────────────────────
const getDebateDNA = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const debates = await Debate.find({
    $or: [{ player1: userId }, { player2: userId }],
    status: "completed",
  }).limit(20).select("topic division winner");

  const dna = await analyzeDebateDNA({
    playerName: user.username,
    debateHistory: debates,
    totalWins: user.stats?.wins || 0,
    totalLosses: user.stats?.losses || 0,
  });

  if (!dna) throw new ApiError(500, "AI DNA analysis unavailable");

  // Save DNA to user
  await User.findByIdAndUpdate(userId, { debateDNA: dna });

  return res.status(200).json(new ApiResponse(200, dna, "Debate DNA analyzed"));
});

// ── GENERATE AI TOPICS ────────────────────────────────────────────
const getAITopics = asyncHandler(async (req, res) => {
  const { division = "Philosophy", count = 5 } = req.query;
  const topics = await generateTopics(division, Number(count));
  if (!topics.length) throw new ApiError(500, "AI topic generation failed");
  return res.status(200).json(new ApiResponse(200, topics, "Topics generated"));
});

// ── GET DEBATE SUMMARY ────────────────────────────────────────────
const getDebateSummary = asyncHandler(async (req, res) => {
  const { debateId } = req.params;
  const debate = await Debate.findById(debateId)
    .populate("player1", "username")
    .populate("player2", "username")
    .populate("winner", "username");
  if (!debate) throw new ApiError(404, "Debate not found");

  const summary = await summarizeDebate({
    topic: debate.topic,
    division: debate.division,
    player1Name: debate.player1.username,
    player2Name: debate.player2.username,
    winner: debate.winner?.username || "Draw",
    score: debate.score,
  });

  if (!summary) throw new ApiError(500, "AI summary unavailable");

  return res.status(200).json(new ApiResponse(200, summary, "Debate summary generated"));
});

module.exports = { getAIJudgeVerdict, getAICoaching, getDebateDNA, getAITopics, getDebateSummary };