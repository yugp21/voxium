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

  // Check if the requesting user follows this user, and whether it's mutual
  let isFollowing = false;
  let followsYou = false;
  if (req.user) {
    const [iFollowThem, theyFollowMe] = await Promise.all([
      Follower.findOne({ followerId: req.user._id, followingId: user._id }),
      Follower.findOne({ followerId: user._id, followingId: req.user._id }),
    ]);
    isFollowing = !!iFollowThem;
    followsYou = !!theyFollowMe;
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { user, isFollowing, followsYou }, "Profile fetched"));
});

// ─── UPDATE PROFILE ───────────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const { name, bio, country, state, district, languages, playingStyle } = req.body;

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { name, bio, country, state, district, languages, playingStyle } },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Profile updated"));
});

// ─── COMPLETE ONBOARDING ──────────────────────────────────────────
const completeOnboarding = asyncHandler(async (req, res) => {
  const { country, state, district, languages, playingStyle, bio } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        country,
        state,
        district,
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
    .json(new ApiResponse(200, user, "Onboarding complete. Welcome to UDA!"));
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

// ─── GET FOLLOWERS ─────────────────────────────────────────────────
// People who follow :username
const getFollowers = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const targetUser = await User.findOne({ username: username.toLowerCase() }).select("_id");
  if (!targetUser) throw new ApiError(404, "Player not found");

  const [follows, total] = await Promise.all([
    Follower.find({ followingId: targetUser._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("followerId", "name username profileImage tier elo"),
    Follower.countDocuments({ followingId: targetUser._id }),
  ]);

  // For each row: does the viewer follow them (isFollowing), and do they
  // follow the viewer back (followsYou) — both needed to render
  // Follow / Follow Back / mutual state correctly per row.
  let myFollowing = new Set();
  let followMe = new Set();
  if (req.user) {
    const ids = follows.map((f) => f.followerId?._id).filter(Boolean);
    const [mine, theirs] = await Promise.all([
      Follower.find({ followerId: req.user._id, followingId: { $in: ids } }).select("followingId"),
      Follower.find({ followerId: { $in: ids }, followingId: req.user._id }).select("followerId"),
    ]);
    myFollowing = new Set(mine.map((m) => m.followingId.toString()));
    followMe = new Set(theirs.map((t) => t.followerId.toString()));
  }

  const users = follows
    .filter((f) => f.followerId) // guard against a stale row pointing at a deleted user
    .map((f) => ({
      ...f.followerId.toObject(),
      isFollowing: myFollowing.has(f.followerId._id.toString()),
      followsYou: followMe.has(f.followerId._id.toString()),
    }));

  return res
    .status(200)
    .json(new ApiResponse(200, { users, total, page: Number(page), hasMore: skip + users.length < total }, "Followers fetched"));
});

// ─── GET FOLLOWING ─────────────────────────────────────────────────
// People :username follows
const getFollowing = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const targetUser = await User.findOne({ username: username.toLowerCase() }).select("_id");
  if (!targetUser) throw new ApiError(404, "Player not found");

  const [follows, total] = await Promise.all([
    Follower.find({ followerId: targetUser._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("followingId", "name username profileImage tier elo"),
    Follower.countDocuments({ followerId: targetUser._id }),
  ]);

  let myFollowing = new Set();
  let followMe = new Set();
  if (req.user) {
    const ids = follows.map((f) => f.followingId?._id).filter(Boolean);
    const [mine, theirs] = await Promise.all([
      Follower.find({ followerId: req.user._id, followingId: { $in: ids } }).select("followingId"),
      Follower.find({ followerId: { $in: ids }, followingId: req.user._id }).select("followerId"),
    ]);
    myFollowing = new Set(mine.map((m) => m.followingId.toString()));
    followMe = new Set(theirs.map((t) => t.followerId.toString()));
  }

  const users = follows
    .filter((f) => f.followingId)
    .map((f) => ({
      ...f.followingId.toObject(),
      isFollowing: myFollowing.has(f.followingId._id.toString()),
      followsYou: followMe.has(f.followingId._id.toString()),
    }));

  return res
    .status(200)
    .json(new ApiResponse(200, { users, total, page: Number(page), hasMore: skip + users.length < total }, "Following fetched"));
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
  getFollowers,
  getFollowing,
  searchUsers,
};