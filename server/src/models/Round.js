const mongoose = require("mongoose");

const roundSchema = new mongoose.Schema(
  {
    debateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Debate",
      required: true,
    },
    roundNumber: {
      type: Number,
      enum: [1, 2, 3],
      required: true,
    },
    type: {
      type: String,
      enum: ["opening", "rebuttal", "closing"],
      required: true,
    },
    // Duration in seconds (120 for opening/rebuttal, 60 for closing)
    duration: {
      type: Number,
      required: true,
    },
    // Cloudinary URLs for recorded speeches (Phase 2)
    player1Speech: {
      type: String,
      default: "",
    },
    player2Speech: {
      type: String,
      default: "",
    },
    // Aggregated scores for this round
    scores: {
      player1: { type: Number, default: 0 },
      player2: { type: Number, default: 0 },
      totalVotes: { type: Number, default: 0 },
    },
    startTime: {
      type: Date,
      default: null,
    },
    endTime: {
      type: Date,
      default: null,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Round = mongoose.model("Round", roundSchema);

module.exports = Round;