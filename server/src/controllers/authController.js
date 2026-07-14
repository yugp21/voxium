const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { generateAndSaveTokens } = require("../utils/generateTokens");
const jwt = require("jsonwebtoken");

// Cookie options — httpOnly so JS can't access it (security)
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

// ─── REGISTER ────────────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;

  // Check all fields present
  if (!name || !username || !email || !password) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username: username.toLowerCase() }],
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new ApiError(409, "Email already registered");
    }
    throw new ApiError(409, "Username already taken");
  }

  // Create user (password hashed automatically via User model pre-save hook)
  const user = await User.create({
    name,
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    password,
  });

  // Generate tokens
  const { accessToken, refreshToken } = await generateAndSaveTokens(user._id);

  // Return user without sensitive fields
  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  return res
    .status(201)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })
    .json(new ApiResponse(201, { user: createdUser, accessToken }, "Account created successfully"));
});

// ─── LOGIN ────────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { emailOrUsername, password } = req.body;

  // Type guard is intentionally duplicated here (validator middleware also
  // checks this) — controllers should never trust upstream middleware alone
  // for a query that touches the DB directly.
  if (typeof emailOrUsername !== "string" || typeof password !== "string" || !emailOrUsername || !password) {
    throw new ApiError(400, "Email/username and password are required");
  }

  // Find user by email or username, include password for comparison
  const user = await User.findOne({
    $or: [
      { email: emailOrUsername.toLowerCase() },
      { username: emailOrUsername.toLowerCase() },
    ],
  }).select("+password");

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Compare passwords
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Update online status
  user.isOnline = true;
  user.lastSeen = new Date();
  await user.save({ validateBeforeSave: false });

  const { accessToken, refreshToken } = await generateAndSaveTokens(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })
    .json(new ApiResponse(200, { user: loggedInUser, accessToken }, "Login successful"));
});

// ─── LOGOUT ───────────────────────────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  // Clear refresh token from DB
  await User.findByIdAndUpdate(req.user._id, {
    $unset: { refreshToken: 1 },
    isOnline: false,
    lastSeen: new Date(),
  });

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

// ─── REFRESH TOKEN ────────────────────────────────────────────────
const refreshAccessToken = asyncHandler(async (req, res) => {
  // Get refresh token from cookie or body
  const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token not found");
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  // Find user and check saved refresh token matches
  const user = await User.findById(decoded._id).select("+refreshToken");
  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Refresh token mismatch");
  }

  const { accessToken, refreshToken } = await generateAndSaveTokens(user._id);

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 })
    .json(new ApiResponse(200, { accessToken }, "Access token refreshed"));
});

// ─── GET CURRENT USER ─────────────────────────────────────────────
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched"));
});

module.exports = { register, login, logout, refreshAccessToken, getCurrentUser };