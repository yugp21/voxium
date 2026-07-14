const mongoose = require("mongoose");

const debateSchema = new mongoose.Schema(
  {
    player1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    player2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    division: {
      type: String,
      enum: ["Philosophy", "Science", "Politics", "Sports", "Cinema", "Gaming"],
      required: true,
    },
    language: {
      type: String,
      default: "English",
    },
    mode: {
      type: String,
      enum: ["ranked", "casual"],
      default: "ranked",
    },
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming",
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Final scores object { player1: 87, player2: 73 }
    score: {
      player1: { type: Number, default: 0 },
      player2: { type: Number, default: 0 },
    },
    // ELO changes after debate
    eloChange: {
      player1: { type: Number, default: 0 },
      player2: { type: Number, default: 0 },
    },
    audienceCount: {
      type: Number,
      default: 0,
    },
    juryPanel: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    aiJudgeUsed: {
      type: Boolean,
      default: false,
    },
    rounds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Round",
      },
    ],
    // Replay video stored on Cloudinary (Phase 2)
    replayUrl: {
      type: String,
      default: "",
    },
    // Duration of full debate in seconds
    duration: {
      type: Number,
      default: 0,
    },
    // ELO of both players at time of debate (for history accuracy)
    player1EloAtTime: {
      type: Number,
      default: 0,
    },
    player2EloAtTime: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Debate = mongoose.model("Debate", debateSchema);

module.exports = Debate;