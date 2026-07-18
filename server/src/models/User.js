const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
 
const statsSchema = new mongoose.Schema(
  {
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
    knockouts: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    hoursSpoken: { type: Number, default: 0 },
    promotionMatches: { type: Number, default: 0 },
    followersCount: { type: Number, default: 0 },
    supportersCount: { type: Number, default: 0 },
    totalDebates: { type: Number, default: 0 },
  },
  { _id: false }
);
 
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [20, "Username cannot exceed 20 characters"],
      match: [/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, underscores"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Never return password in queries
    },
    profileImage: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
    state: {
      type: String,
      default: "",
    },
    district: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      maxlength: [200, "Bio cannot exceed 200 characters"],
      default: "",
    },
    tier: {
      type: String,
      enum: ["Wanderer", "Vanguard", "Oracle", "Ascendant", "Sovereign", "Conqueror", "Immortal"],
      default: "Wanderer",
    },
    elo: {
      type: Number,
      default: 0,
      min: 0,
    },
    house: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "House",
      default: null,
    },
    languages: {
      type: [String],
      default: ["English"],
    },
    playingStyle: {
      type: String,
      enum: ["Aggressive", "Analytical", "Emotional", "Logical", "Creative", ""],
      default: "",
    },
    legacyTitle: {
      type: String,
      default: "",
    },
    divisionTitles: {
      type: [String],
      default: [],
    },
    achievements: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Achievement",
      },
    ],
    stats: {
      type: statsSchema,
      default: () => ({}),
    },
    isOnboarded: {
      type: Boolean,
      default: false, // False until user completes onboarding
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    refreshToken: {
      type: String,
      select: false, // Never return refresh token in queries
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);
 
// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});
 
// Compare password method
userSchema.methods.isPasswordCorrect = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};
 
// Recalculate win rate whenever stats change
userSchema.methods.recalculateWinRate = function () {
  const total = this.stats.wins + this.stats.losses;
  this.stats.winRate = total > 0 ? Math.round((this.stats.wins / total) * 100) : 0;
  this.stats.totalDebates = total;
};
 
const User = mongoose.model("User", userSchema);
 
module.exports = User;