const { body, validationResult } = require("express-validator");
const ApiError = require("../../utils/ApiError");

// Runs after the rule chains below; turns express-validator's error
// collection into the same ApiError shape the rest of the app expects.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const messages = errors.array().map((e) => e.msg);
  throw new ApiError(400, messages[0], messages);
};

const registerValidator = [
  body("name").trim().notEmpty().withMessage("Name is required")
    .isLength({ max: 50 }).withMessage("Name cannot exceed 50 characters"),
  body("username").trim().notEmpty().withMessage("Username is required")
    .isLength({ min: 3, max: 20 }).withMessage("Username must be 3-20 characters")
    .matches(/^[a-zA-Z0-9_]+$/).withMessage("Username can only contain letters, numbers, underscores"),
  body("email").trim().notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please enter a valid email").normalizeEmail(),
  body("password").isString().withMessage("Password must be text")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  validate,
];

const loginValidator = [
  // isString first — this is the actual NoSQL-injection guard. It rejects
  // objects/arrays in the body before they ever reach the User.findOne query.
  body("emailOrUsername").isString().withMessage("Invalid credentials")
    .trim().notEmpty().withMessage("Email/username is required"),
  body("password").isString().withMessage("Invalid credentials")
    .notEmpty().withMessage("Password is required"),
  validate,
];

module.exports = { registerValidator, loginValidator };