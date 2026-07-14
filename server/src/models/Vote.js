const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema(
  {
    debateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Debate",
      required: true,
    },
    roundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Round",
      required: true,
    },
    voterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Who they voted for
    voteFor: {
      type: String,
      enum: ["player1", "player2"],
      required: true,
    },
    // Score given (10-9, 10-8, 10-7 boxing style)
    score: {
      type: Number,
      min: 7,
      max: 10,
      default: 10,
    },
    // Who cast this vote
    voteType: {
      type: String,
      enum: ["audience", "jury", "ai"],
      required: true,
    },
    // Jury votes weigh more than audience votes
    weight: {
      type: Number,
      default: 1, // audience=1, jury=3, ai=2
    },
  },
  {
    timestamps: true,
  }
);

// One voter can only vote once per round
voteSchema.index({ roundId: 1, voterId: 1 }, { unique: true });

const Vote = mongoose.model("Vote", voteSchema);

module.exports = Vote;