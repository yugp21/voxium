const mongoose = require("mongoose");
const Debate = require("../models/Debate");
const Round = require("../models/Round");
const Vote = require("../models/Vote");
const User = require("../models/User");
const { notify } = require("../utils/notify");
const { checkAchievements } = require("../utils/checkAchievements");
const { calculateEloChange, determineWinner } = require("../services/eloService");
const { ROUND_DURATIONS } = require("../config/constants");

// Active debates in memory: debateId -> { player1SocketId, player2SocketId, readyPlayers }
const activeDebates = {};

const debateSocket = (io, socket) => {
  // ─── JOIN DEBATE ROOM ─────────────────────────────────────────
  socket.on("join_debate", async ({ debateId }) => {
    socket.join(`debate:${debateId}`);

    if (!activeDebates[debateId]) {
      activeDebates[debateId] = { players: [], readyPlayers: [], currentRound: 0 };
    }

    // Add player if not already in
    if (!activeDebates[debateId].players.includes(socket.user._id.toString())) {
      activeDebates[debateId].players.push(socket.user._id.toString());
    }

    // Notify room someone joined
    socket.to(`debate:${debateId}`).emit("player_joined", {
      userId: socket.user._id,
      username: socket.user.username,
    });

    console.log(`🎙️ ${socket.user.username} joined debate ${debateId}`);
  });

  // ─── PLAYER READY ─────────────────────────────────────────────
  socket.on("player_ready", async ({ debateId }) => {
    if (!activeDebates[debateId]) return;

    const userId = socket.user._id.toString();

    // Only the two actual debaters can ready-up. Without this check any
    // spectator/audience member in the room (join_debate has no role
    // restriction, by design, for voting) could start rounds for a debate
    // they aren't in.
    const debate = await Debate.findById(debateId).select("player1 player2");
    if (!debate) return;
    const isParticipant =
      debate.player1.toString() === userId || debate.player2.toString() === userId;
    if (!isParticipant) {
      socket.emit("vote_error", { message: "Only debate participants can ready up" });
      return;
    }

    if (!activeDebates[debateId].readyPlayers.includes(userId)) {
      activeDebates[debateId].readyPlayers.push(userId);
    }

    // Both players ready — start Round 1
    if (activeDebates[debateId].readyPlayers.length >= 2) {
      activeDebates[debateId].readyPlayers = []; // Reset for next round
      await startRound(io, debateId, 1);
    } else {
      socket.to(`debate:${debateId}`).emit("opponent_ready");
    }
  });

  // ─── CAST VOTE ────────────────────────────────────────────────
  socket.on("cast_vote", async ({ debateId, roundId, voteFor, score }) => {
    try {
      // Prevent players from voting in their own debate
      const debate = await Debate.findById(debateId);
      if (!debate) return;

      const userId = socket.user._id.toString();
      if (
        debate.player1.toString() === userId ||
        debate.player2.toString() === userId
      ) {
        socket.emit("vote_error", { message: "Players cannot vote in their own debate" });
        return;
      }

      // Save vote (unique index prevents double voting)
      await Vote.create({
        debateId,
        roundId,
        voterId: socket.user._id,
        voteFor,
        score: score || 10,
        voteType: "audience",
        weight: 1,
      });

      // Get live vote counts for this round
      const votes = await Vote.aggregate([
        { $match: { roundId: new mongoose.Types.ObjectId(roundId) } },
        { $group: { _id: "$voteFor", count: { $sum: 1 } } },
      ]);

      const voteCounts = { player1: 0, player2: 0 };
      votes.forEach((v) => { voteCounts[v._id] = v.count; });

      // Broadcast updated vote counts to entire debate room
      io.to(`debate:${debateId}`).emit("vote_update", { roundId, voteCounts });

    } catch (err) {
      if (err.code === 11000) {
        socket.emit("vote_error", { message: "You already voted this round" });
      }
    }
  });

  // ─── DEBATE END (triggered by server after round 3) ───────────
  socket.on("end_debate", async ({ debateId }) => {
    await finalizeDebate(io, debateId);
  });
};

// ─── START ROUND ─────────────────────────────────────────────────
const startRound = async (io, debateId, roundNumber) => {
  const types = ["opening", "rebuttal", "closing"];
  const type = types[roundNumber - 1];
  const duration = ROUND_DURATIONS[type];

  // Create round in DB
  const round = await Round.create({
    debateId,
    roundNumber,
    type,
    duration,
    startTime: new Date(),
  });

  // Update debate status to ongoing on round 1
  if (roundNumber === 1) {
    await Debate.findByIdAndUpdate(debateId, { status: "ongoing" });
  }

  io.to(`debate:${debateId}`).emit("round_start", {
    roundId: round._id,
    roundNumber,
    type,
    duration, // Frontend starts countdown timer
  });

  console.log(`🔔 Round ${roundNumber} started in debate ${debateId}`);

  // Auto end round after duration
  setTimeout(async () => {
    await endRound(io, debateId, round._id, roundNumber);
  }, duration * 1000);
};

// ─── END ROUND ───────────────────────────────────────────────────
const endRound = async (io, debateId, roundId, roundNumber) => {
  // Get vote totals for this round
  const votes = await Vote.aggregate([
    { $match: { roundId } },
    {
      $group: {
        _id: "$voteFor",
        total: { $sum: { $multiply: ["$score", "$weight"] } },
      },
    },
  ]);

  const scores = { player1: 0, player2: 0 };
  votes.forEach((v) => { scores[v._id] = v.total; });

  // Update round in DB
  await Round.findByIdAndUpdate(roundId, {
    scores,
    endTime: new Date(),
    isCompleted: true,
  });

  io.to(`debate:${debateId}`).emit("round_end", { roundNumber, scores });

  console.log(`⏱️ Round ${roundNumber} ended in debate ${debateId}`);

  // 10 second voting buffer, then next round or finalize
  setTimeout(async () => {
    if (roundNumber < 3) {
      await startRound(io, debateId, roundNumber + 1);
    } else {
      await finalizeDebate(io, debateId);
    }
  }, 10000); // 10 second break between rounds
};

// ─── FINALIZE DEBATE ─────────────────────────────────────────────
const finalizeDebate = async (io, debateId) => {
  const debate = await Debate.findById(debateId)
    .populate("player1", "elo tier username")
    .populate("player2", "elo tier username");

  if (!debate || debate.status === "completed") return;

  // Sum all round scores
  const rounds = await Round.find({ debateId });
  const totalScores = { player1: 0, player2: 0 };
  rounds.forEach((r) => {
    totalScores.player1 += r.scores.player1;
    totalScores.player2 += r.scores.player2;
  });

  const result = determineWinner(totalScores);
  const winnerId = result === "player1"
    ? debate.player1._id
    : result === "player2"
    ? debate.player2._id
    : null;

  // Calculate ELO changes
  const eloResult = calculateEloChange(
    debate.player1.elo,
    debate.player2.elo,
    result,
    debate.player1.tier,
    debate.player2.tier
  );

  // Update debate
  await Debate.findByIdAndUpdate(debateId, {
    status: "completed",
    winner: winnerId,
    score: totalScores,
    eloChange: {
      player1: eloResult.player1.change,
      player2: eloResult.player2.change,
    },
  });

  // Update player 1 stats and ELO
  // currentStreak/longestStreak were declared on the schema but never
  // actually maintained anywhere — win extends the streak, loss resets it,
  // draw leaves it untouched. Read-then-write because a streak reset can't
  // be expressed as a plain $inc.
  const p1Before = await User.findById(debate.player1._id).select("stats tier elo");
  const p1NewStreak = result === "player1" ? p1Before.stats.currentStreak + 1
                     : result === "player2" ? 0
                     : p1Before.stats.currentStreak;
  const p1UpdatedUser = await User.findByIdAndUpdate(debate.player1._id, {
    elo: eloResult.player1.newElo,
    tier: eloResult.player1.newTier,
    "stats.currentStreak": p1NewStreak,
    "stats.longestStreak": Math.max(p1NewStreak, p1Before.stats.longestStreak),
    $inc: {
      "stats.wins": result === "player1" ? 1 : 0,
      "stats.losses": result === "player2" ? 1 : 0,
      "stats.totalDebates": 1,
    },
  }, { new: true }).select("stats tier");

  await notify({
    userId: debate.player1._id,
    title: result === "player1" ? "Victory!" : result === "player2" ? "Defeat" : "Draw",
    message: `Your debate on "${debate.topic}" vs ${debate.player2.username} has ended (${eloResult.player1.change >= 0 ? "+" : ""}${eloResult.player1.change} ELO)`,
    type: "debate_result",
    link: `/debate/${debateId}/result`,
    data: { debateId, result, eloChange: eloResult.player1.change },
  });
  if (eloResult.player1.newTier !== debate.player1.tier) {
    await notify({
      userId: debate.player1._id,
      title: eloResult.player1.newElo > debate.player1.elo ? "Tier Up!" : "Tier Down",
      message: `You are now ${eloResult.player1.newTier} tier`,
      type: eloResult.player1.newElo > debate.player1.elo ? "tier_up" : "tier_down",
      link: `/profile/${debate.player1.username}`,
      data: { newTier: eloResult.player1.newTier },
    });
  }
  await checkAchievements(debate.player1._id, p1UpdatedUser.stats, p1UpdatedUser.tier);

  // Update player 2 stats and ELO
  const p2Before = await User.findById(debate.player2._id).select("stats tier elo");
  const p2NewStreak = result === "player2" ? p2Before.stats.currentStreak + 1
                     : result === "player1" ? 0
                     : p2Before.stats.currentStreak;
  const p2UpdatedUser = await User.findByIdAndUpdate(debate.player2._id, {
    elo: eloResult.player2.newElo,
    tier: eloResult.player2.newTier,
    "stats.currentStreak": p2NewStreak,
    "stats.longestStreak": Math.max(p2NewStreak, p2Before.stats.longestStreak),
    $inc: {
      "stats.wins": result === "player2" ? 1 : 0,
      "stats.losses": result === "player1" ? 1 : 0,
      "stats.totalDebates": 1,
    },
  }, { new: true }).select("stats tier");

  await notify({
    userId: debate.player2._id,
    title: result === "player2" ? "Victory!" : result === "player1" ? "Defeat" : "Draw",
    message: `Your debate on "${debate.topic}" vs ${debate.player1.username} has ended (${eloResult.player2.change >= 0 ? "+" : ""}${eloResult.player2.change} ELO)`,
    type: "debate_result",
    link: `/debate/${debateId}/result`,
    data: { debateId, result, eloChange: eloResult.player2.change },
  });
  if (eloResult.player2.newTier !== debate.player2.tier) {
    await notify({
      userId: debate.player2._id,
      title: eloResult.player2.newElo > debate.player2.elo ? "Tier Up!" : "Tier Down",
      message: `You are now ${eloResult.player2.newTier} tier`,
      type: eloResult.player2.newElo > debate.player2.elo ? "tier_up" : "tier_down",
      link: `/profile/${debate.player2.username}`,
      data: { newTier: eloResult.player2.newTier },
    });
  }
  await checkAchievements(debate.player2._id, p2UpdatedUser.stats, p2UpdatedUser.tier);

  // Broadcast final result to debate room
  io.to(`debate:${debateId}`).emit("debate_result", {
    result,
    winner: winnerId,
    totalScores,
    eloChanges: {
      player1: eloResult.player1,
      player2: eloResult.player2,
    },
  });

  // Cleanup
  delete activeDebates[debateId];
  console.log(`🏆 Debate ${debateId} completed. Winner: ${result}`);
};

module.exports = debateSocket;