const rateLimit = require("express-rate-limit");

// Strict limiter for login/register — these are brute-force / spam targets.
// 10 attempts per 15 min per IP is generous for a real user, painful for a script.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please try again in a few minutes.",
    errors: [],
  },
});

// Looser limiter for general API traffic (protects against abuse without
// bothering normal usage patterns like polling notifications).
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please slow down.",
    errors: [],
  },
});

module.exports = { authLimiter, apiLimiter };