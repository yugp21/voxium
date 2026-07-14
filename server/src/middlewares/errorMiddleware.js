const ApiError = require("../utils/ApiError");

const errorMiddleware = (err, req, res, next) => {
  // If it's our custom ApiError, use its values
  // Otherwise default to 500 internal server error
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Log error in development
  if (process.env.NODE_ENV === "development") {
    console.error("❌ ERROR:", err);
  }

  // Mongoose duplicate key error (e.g. username/email already exists)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
      errors: [],
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
      errors: [],
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
      errors: [],
    });
  }

  // Send final error response
  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || [],
  });
};

module.exports = errorMiddleware;