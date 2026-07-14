const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const verifyJWT = asyncHandler(async (req, res, next) => {
  // Get token from cookie OR Authorization header
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized - No token provided");
  }

  // Verify the token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    throw new ApiError(401, "Unauthorized - Invalid or expired token");
  }

  // Find the user
  const user = await User.findById(decoded._id);
  if (!user) {
    throw new ApiError(401, "Unauthorized - User not found");
  }

  // Attach user to request — available in all controllers as req.user
  req.user = user;
  next();
});

module.exports = { verifyJWT };