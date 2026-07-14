const express = require("express");
const router = express.Router();
const { getAIJudgeVerdict, getAICoaching, getDebateDNA, getAITopics, getDebateSummary } = require("../controllers/aiController");
const { verifyJWT } = require("../middlewares/authMiddleware");

router.use(verifyJWT);
router.get("/judge/:debateId", getAIJudgeVerdict);
router.get("/coach/:debateId", getAICoaching);
router.get("/dna/:userId", getDebateDNA);
router.get("/topics", getAITopics);
router.get("/summary/:debateId", getDebateSummary);

module.exports = router;