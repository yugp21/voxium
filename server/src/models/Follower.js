const mongoose = require("mongoose");

const followerSchema = new mongoose.Schema(
  {
    // The person who is following
    followerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The person being followed
    followingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Can only follow someone once
followerSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

const Follower = mongoose.model("Follower", followerSchema);

module.exports = Follower;