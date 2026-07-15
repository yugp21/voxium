const User = require("../models/User");
const Follower = require("../models/Follower");
const { notify } = require("../utils/notify");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const cloudinary = require("cloudinary").v2;

// ─── GET PUBLIC PROFILE ───────────────────────────────────────────
const getProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const user = await User.findOne({ username: username.toLowerCase() })
    .select("-password -refreshToken");

  if (!user) throw new ApiError(404, "Player not found");

  // Check if the requesting user follows this user
  let isFollowing = false;
  if (req.user) {
    const follow = await Follower.findOne({
      followerId: req.user._id,
      followingId: user._id,
    });
    isFollowing = !!follow;
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { user, isFollowing }, "Profile fetched"));
});

// ─── UPDATE PROFILE ───────────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const { name, bio, country, languages, playingStyle } = req.body;

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { name, bio, country, languages, playingStyle } },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Profile updated"));
});

// ─── COMPLETE ONBOARDING ──────────────────────────────────────────
const completeOnboarding = asyncHandler(async (req, res) => {
  const { country, languages, playingStyle, bio } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        country,
        languages,
        playingStyle,
        bio,
        isOnboarded: true,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Onboarding complete. Welcome to Voxium!"));
});

// ─── UPLOAD AVATAR ────────────────────────────────────────────────
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No image file provided");

  // Convert buffer to base64 and upload to Cloudinary
  const b64 = Buffer.from(req.file.buffer).toString("base64");
  const dataURI = `data:${req.file.mimetype};base64,${b64}`;

  const result = await cloudinary.uploader.upload(dataURI, {
    folder: "voxium/avatars",
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
  });

  // Save cloudinary URL to user
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { profileImage: result.secure_url },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, { profileImage: user.profileImage }, "Avatar uploaded"));
});

// ─── FOLLOW USER ─────────────────────────────────────────────────
const followUser = asyncHandler(async (req, res) => {
  const { id: targetUserId } = req.params;

  if (targetUserId === req.user._id.toString()) {
    throw new ApiError(400, "You cannot follow yourself");
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) throw new ApiError(404, "User not found");

  // Check if already following
  const existing = await Follower.findOne({
    followerId: req.user._id,
    followingId: targetUserId,
  });
  if (existing) throw new ApiError(409, "Already following this user");

  // Create follow
  await Follower.create({ followerId: req.user._id, followingId: targetUserId });

  // Update follower counts
  await User.findByIdAndUpdate(targetUserId, { $inc: { "stats.followersCount": 1 } });
  await User.findByIdAndUpdate(req.user._id, { $inc: { "stats.supportersCount": 1 } });

  // Send notification to followed user
  await notify({
    userId: targetUserId,
    title: "New Follower",
    message: `${req.user.username} is now following you`,
    type: "new_follower",
    link: `/profile/${req.user.username}`,
    data: { followerId: req.user._id },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Followed successfully"));
});

// ─── UNFOLLOW USER ────────────────────────────────────────────────
const unfollowUser = asyncHandler(async (req, res) => {
  const { id: targetUserId } = req.params;

  const follow = await Follower.findOneAndDelete({
    followerId: req.user._id,
    followingId: targetUserId,
  });

  if (!follow) throw new ApiError(404, "You are not following this user");

  // Update follower counts
  await User.findByIdAndUpdate(targetUserId, { $inc: { "stats.followersCount": -1 } });
  await User.findByIdAndUpdate(req.user._id, { $inc: { "stats.supportersCount": -1 } });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Unfollowed successfully"));
});

// ─── SEARCH USERS ─────────────────────────────────────────────────
const searchUsers = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;

  if (!q || q.trim().length < 2) {
    throw new ApiError(400, "Search query must be at least 2 characters");
  }

  const skip = (page - 1) * limit;

  const users = await User.find({
    $or: [
      { username: { $regex: q, $options: "i" } },
      { name: { $regex: q, $options: "i" } },
    ],
  })
    .select("name username profileImage tier elo country")
    .skip(skip)
    .limit(Number(limit));

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Search results"));
});

module.exports = {
  getProfile,
  updateProfile,
  completeOnboarding,
  uploadAvatar,
  followUser,
  unfollowUser,
  searchUsers,
};