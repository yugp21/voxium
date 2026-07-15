// Shared helper for every Gemini JSON call in aiService.js.
// Exists because judgeDebate/coachPlayer/analyzeDebateDNA/generateTopics/
// summarizeDebate were each duplicating fragile inline JSON parsing with
// no timeout and no retry — meaning a single stray sentence from Gemini,
// a slow response, or a transient API error silently killed the feature.

// Gemini is instructed to return ONLY JSON, but models don't always comply
// perfectly (a leading "Here's the analysis:" is common). Instead of just
// stripping code fences, pull out the first {...} or [...] block directly.
const extractJSON = (text) => {
  const stripped = text.replace(/```json\n?|```\n?/g, "").trim();
  const match = stripped.match(/[{[][\s\S]*[}\]]/);
  if (!match) throw new Error("No JSON object found in model response");
  return JSON.parse(match[0]);
};

const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);

// Calls model.generateContent(prompt), enforces a timeout, retries once on
// failure (network blip / bad JSON / timeout), and returns parsed JSON.
// Returns null only if both the original attempt and the retry fail —
// callers already treat null as "feature unavailable" and respond 503/500.
const callGeminiJSON = async (model, prompt, { label = "Gemini call", timeoutMs = 15000 } = {}) => {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await withTimeout(model.generateContent(prompt), timeoutMs, label);
      const text = result.response.text().trim();
      return extractJSON(text);
    } catch (err) {
      console.error(`${label} attempt ${attempt} failed:`, err.message);
      if (attempt === 2) return null;
      // brief backoff before the retry
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return null;
};

module.exports = { callGeminiJSON };