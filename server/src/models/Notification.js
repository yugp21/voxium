const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    // Type controls the icon shown on frontend
    type: {
      type: String,
      enum: [
        "match_found",
        "debate_result",
        "new_follower",
        "jury_request",
        "achievement",
        "tier_up",
        "tier_down",
        "general",
      ],
      default: "general",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    // Link to relevant page (e.g. /debate/123)
    link: {
      type: String,
      default: "",
    },
    // Extra data (e.g. debateId, followerId)
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;