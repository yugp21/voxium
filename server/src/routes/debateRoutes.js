const express = require("express");
const router = express.Router();
const { getDebate, getDebateHistory, createDebate } = require("../controllers/debateController");
const { verifyJWT } = require("../middlewares/authMiddleware");
 
router.use(verifyJWT);
router.get("/history/:userId", getDebateHistory);
router.get("/:id", getDebate);
router.post("/", createDebate);
 
module.exports = router;