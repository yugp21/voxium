// AI Service — Gemini powers all AI features
// Why: AI Judge, Coach, DNA, Topics all go through here
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { callGeminiJSON } = require("../utils/geminiHelpers");

let genAI = null;

const getAI = () => {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

const getModel = () => getAI().getGenerativeModel({ model: "gemini-1.5-flash" });

// ── AI JUDGE ─────────────────────────────────────────────────────
// Analyzes debate and gives a winner verdict with detailed reasoning
const judgeDebate = async ({ topic, division, player1Name, player2Name, player1Notes, player2Notes, audienceVotes }) => {
  const prompt = `
You are an expert debate judge for UDA, the world's first competitive debate esport.

DEBATE DETAILS:
- Topic: "${topic}"
- Division: ${division}
- Player 1: ${player1Name}
- Player 2: ${player2Name}
- Audience Votes: Player 1 got ${audienceVotes?.player1 || 0} votes, Player 2 got ${audienceVotes?.player2 || 0} votes

${player1Notes ? `Player 1 Arguments: ${player1Notes}` : ""}
${player2Notes ? `Player 2 Arguments: ${player2Notes}` : ""}

Analyze this debate and respond in this EXACT JSON format:
{
  "winner": "${player1Name} or ${player2Name} or Draw",
  "winnerKey": "player1 or player2 or draw",
  "confidence": 75,
  "reasoning": "2-3 sentence explanation of why this player won",
  "player1Analysis": {
    "strengths": ["strength 1", "strength 2"],
    "weaknesses": ["weakness 1"],
    "score": 78
  },
  "player2Analysis": {
    "strengths": ["strength 1"],
    "weaknesses": ["weakness 1", "weakness 2"],
    "score": 65
  },
  "highlightMoment": "The key turning point of the debate in one sentence"
}

Return ONLY valid JSON, no markdown, no extra text.
`;
  const verdict = await callGeminiJSON(getModel(), prompt, { label: "AI Judge" });
  if (verdict && !["player1", "player2", "draw"].includes(verdict.winnerKey)) {
    console.error("AI Judge returned malformed winnerKey:", verdict.winnerKey);
    return null;
  }
  return verdict;
};

// ── AI COACH ─────────────────────────────────────────────────────
// Post-debate personal coaching feedback
const coachPlayer = async ({ playerName, topic, division, won, playerNotes, opponentNotes, audienceVotes }) => {
  const prompt = `
You are an elite debate coach for UDA, the world's first competitive debate esport.

Give personalized coaching feedback to ${playerName} who just ${won ? "WON" : "LOST"} a debate.

CONTEXT:
- Topic: "${topic}"
- Division: ${division}
- Result: ${won ? "Victory" : "Defeat"}
${playerNotes ? `- Their notes: ${playerNotes}` : ""}
${opponentNotes ? `- Opponent used: ${opponentNotes}` : ""}

Respond in this EXACT JSON format:
{
  "headline": "One powerful motivational sentence (max 10 words)",
  "overallRating": 78,
  "strengths": [
    {"title": "Strong Opening", "detail": "One sentence explanation"},
    {"title": "Clear Examples", "detail": "One sentence explanation"}
  ],
  "improvements": [
    {"title": "Rebuttal Speed", "detail": "Specific actionable tip"},
    {"title": "Evidence Quality", "detail": "Specific actionable tip"}
  ],
  "nextTopicSuggestion": "A debate topic to practice next",
  "styleAdvice": "One sentence about their debate DNA/style",
  "motivationalClose": "One powerful closing sentence to inspire them"
}

Return ONLY valid JSON, no markdown, no extra text.
`;
  return callGeminiJSON(getModel(), prompt, { label: "AI Coach" });
};

// ── DEBATE DNA ANALYZER ───────────────────────────────────────────
// Analyzes player's debate history to determine their style DNA
const analyzeDebateDNA = async ({ playerName, debateHistory, totalWins, totalLosses }) => {
  const prompt = `
You are analyzing the debate style DNA of ${playerName} on UDA.

Stats: ${totalWins} wins, ${totalLosses} losses
Recent debates: ${JSON.stringify(debateHistory?.slice(0, 5) || [])}

Analyze and assign scores (0-100) for each style trait based on their history.

Respond in this EXACT JSON format:
{
  "dominantStyle": "Analytical",
  "styleDescription": "One sentence describing their unique debate personality",
  "dna": {
    "aggressive": 65,
    "analytical": 85,
    "emotional": 40,
    "logical": 90,
    "creative": 55
  },
  "legendTitle": "The Logic Machine",
  "evolutionTip": "One specific tip to evolve their style"
}

Return ONLY valid JSON, no markdown, no extra text.
`;
  return callGeminiJSON(getModel(), prompt, { label: "AI DNA" });
};

// ── AI TOPIC GENERATOR ───────────────────────────────────────────
// Generates fresh, engaging debate topics by division
const generateTopics = async (division, count = 5) => {
  const prompt = `
Generate ${count} fresh, controversial, and engaging debate topics for the ${division} division on UDA debate platform.

Topics should be:
- Thought-provoking and controversial
- Suitable for competitive debate
- Current and relevant
- Clear and debatable (not one-sided)

Respond in this EXACT JSON format:
{
  "topics": [
    "Topic 1 here",
    "Topic 2 here",
    "Topic 3 here",
    "Topic 4 here",
    "Topic 5 here"
  ]
}

Return ONLY valid JSON, no markdown, no extra text.
`;
  const parsed = await callGeminiJSON(getModel(), prompt, { label: "AI Topics" });
  return parsed?.topics || [];
};

// ── AI DEBATE SUMMARY ────────────────────────────────────────────
// Creates a shareable summary of a completed debate
const summarizeDebate = async ({ topic, player1Name, player2Name, winner, score, division }) => {
  const prompt = `
Create a dramatic, engaging debate summary for UDA (competitive debate esport).

DEBATE:
- Topic: "${topic}"
- Division: ${division}
- ${player1Name} vs ${player2Name}
- Winner: ${winner}
- Score: ${JSON.stringify(score)}

Write a 2-3 sentence dramatic summary like a sports commentator would. Make it exciting.

Respond in this EXACT JSON format:
{
  "summary": "The dramatic 2-3 sentence summary here",
  "headline": "Short punchy headline (max 8 words)",
  "mvpQuote": "A fictional powerful quote the winner might have said"
}

Return ONLY valid JSON, no markdown, no extra text.
`;
  return callGeminiJSON(getModel(), prompt, { label: "AI Summary" });
};

module.exports = { judgeDebate, coachPlayer, analyzeDebateDNA, generateTopics, summarizeDebate };