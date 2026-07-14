const Debate = require("../models/Debate");

// In-memory queue: { userId, socketId, tier, division, language, mode, joinedAt }
const matchmakingQueue = [];

// Debate topics by division
const TOPICS = {
  Philosophy: [
    "Free will is an illusion",
    "Morality is subjective",
    "Consciousness cannot be explained by science",
    "The ends justify the means",
  ],
  Science: [
    "AI will surpass human intelligence within 20 years",
    "Gene editing should be freely available",
    "Space colonization is humanity's top priority",
    "Nuclear energy is the future of power",
  ],
  Politics: [
    "Democracy is the best form of government",
    "Social media should be regulated by governments",
    "Universal Basic Income would benefit society",
    "Borders should be open to everyone",
  ],
  Sports: [
    "Money has ruined modern football",
    "Athletes are better role models than politicians",
    "E-sports should be in the Olympics",
    "Performance-enhancing drugs should be allowed",
  ],
  Cinema: [
    "Streaming platforms have killed cinema",
    "Remakes destroy the legacy of original films",
    "Violence in media increases real-world violence",
    "International films deserve more recognition",
  ],
  Gaming: [
    "Video games are a legitimate art form",
    "Competitive gaming requires as much skill as traditional sports",
    "Loot boxes are a form of gambling",
    "Gaming culture has a toxicity problem",
  ],
};

const getRandomTopic = (division) => {
  const topics = TOPICS[division] || TOPICS.Philosophy;
  return topics[Math.floor(Math.random() * topics.length)];
};

// Check if two players are compatible for a match
const isCompatible = (player1, player2) => {
  if (player1.userId === player2.userId) return false;
  if (player1.mode !== player2.mode) return false;
  if (player1.language !== player2.language) return false;
  if (player1.division !== player2.division) return false;
  return true;
};

const matchmakingSocket = (io, socket) => {
  // ─── JOIN QUEUE ──────────────────────────────────────────────
  socket.on("join_queue", async (data) => {
    const { tier, division, language, mode } = data;

    // Remove if already in queue
    const existingIndex = matchmakingQueue.findIndex(
      (p) => p.userId === socket.user._id.toString()
    );
    if (existingIndex !== -1) matchmakingQueue.splice(existingIndex, 1);

    const playerEntry = {
      userId: socket.user._id.toString(),
      socketId: socket.id,
      username: socket.user.username,
      profileImage: socket.user.profileImage,
      tier: tier || socket.user.tier,
      elo: socket.user.elo,
      division: division || "Philosophy",
      language: language || "English",
      mode: mode || "ranked",
      joinedAt: Date.now(),
    };

    // Try to find opponent in existing queue
    const opponentIndex = matchmakingQueue.findIndex((p) =>
      isCompatible(playerEntry, p)
    );

    if (opponentIndex !== -1) {
      // Match found!
      const opponent = matchmakingQueue[opponentIndex];
      matchmakingQueue.splice(opponentIndex, 1); // Remove opponent from queue

      const topic = getRandomTopic(playerEntry.division);

      // Create debate in DB
      const debate = await Debate.create({
        player1: playerEntry.userId,
        player2: opponent.userId,
        topic,
        division: playerEntry.division,
        language: playerEntry.language,
        mode: playerEntry.mode,
        player1EloAtTime: playerEntry.elo,
        player2EloAtTime: opponent.elo,
      });

      const matchData = {
        debateId: debate._id,
        topic,
        division: playerEntry.division,
        language: playerEntry.language,
        mode: playerEntry.mode,
        prepTime: 90, // seconds
      };

      // Notify both players
      socket.emit("match_found", {
        ...matchData,
        opponent: {
          userId: opponent.userId,
          username: opponent.username,
          profileImage: opponent.profileImage,
          tier: opponent.tier,
          elo: opponent.elo,
        },
      });

      io.to(opponent.socketId).emit("match_found", {
        ...matchData,
        opponent: {
          userId: playerEntry.userId,
          username: playerEntry.username,
          profileImage: playerEntry.profileImage,
          tier: playerEntry.tier,
          elo: playerEntry.elo,
        },
      });

      console.log(`🥊 Match found: ${playerEntry.username} vs ${opponent.username}`);
    } else {
      // No match yet, add to queue
      matchmakingQueue.push(playerEntry);
      socket.emit("queue_joined", {
        position: matchmakingQueue.length,
        message: "Searching for an opponent...",
      });
      console.log(`🔍 ${playerEntry.username} joined queue (${matchmakingQueue.length} in queue)`);
    }
  });

  // ─── LEAVE QUEUE ─────────────────────────────────────────────
  socket.on("leave_queue", () => {
    const index = matchmakingQueue.findIndex(
      (p) => p.userId === socket.user._id.toString()
    );
    if (index !== -1) {
      matchmakingQueue.splice(index, 1);
      socket.emit("queue_left", { message: "Left the queue" });
    }
  });

  // Clean up queue on disconnect
  socket.on("disconnect", () => {
    const index = matchmakingQueue.findIndex(
      (p) => p.userId === socket.user._id.toString()
    );
    if (index !== -1) matchmakingQueue.splice(index, 1);
  });
};

module.exports = matchmakingSocket;