const TIERS = {
  WANDERER: { name: "Wanderer", minElo: 0, maxElo: 499, kFactor: 32 },
  VANGUARD: { name: "Vanguard", minElo: 500, maxElo: 999, kFactor: 32 },
  ORACLE: { name: "Oracle", minElo: 1000, maxElo: 1499, kFactor: 24 },
  ASCENDANT: { name: "Ascendant", minElo: 1500, maxElo: 1999, kFactor: 24 },
  SOVEREIGN: { name: "Sovereign", minElo: 2000, maxElo: 2499, kFactor: 16 },
  CONQUEROR: { name: "Conqueror", minElo: 2500, maxElo: 2999, kFactor: 16 },
  IMMORTAL: { name: "Immortal", minElo: 3000, maxElo: Infinity, kFactor: 10 },
};
 
const DIVISIONS = {
  PHILOSOPHY: { name: "Philosophy", title: "Oracle" },
  SCIENCE: { name: "Science", title: "Visionary" },
  POLITICS: { name: "Politics", title: "Iron Speaker" },
  SPORTS: { name: "Sports", title: "Titan" },
  CINEMA: { name: "Cinema", title: "Luminary" },
  GAMING: { name: "Gaming", title: "Warlord" },
};
 
const DEBATE_MODES = {
  RANKED: "ranked",
  CASUAL: "casual",
};
 
const DEBATE_STATUS = {
  UPCOMING: "upcoming",
  ONGOING: "ongoing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};
 
const ROUND_TYPES = {
  OPENING: "opening",
  REBUTTAL: "rebuttal",
  CLOSING: "closing",
};
 
// Round durations in seconds
const ROUND_DURATIONS = {
  opening: 120,   // 2 minutes
  rebuttal: 120,  // 2 minutes
  closing: 60,    // 1 minute
};
 
const PREP_WINDOW_DURATION = 90; // seconds
 
const VOTE_TYPES = {
  AUDIENCE: "audience",
  JURY: "jury",
  AI: "ai",
};
 
// Tier based on ELO number
const getTierFromElo = (elo) => {
  for (const tier of Object.values(TIERS)) {
    if (elo >= tier.minElo && elo <= tier.maxElo) {
      return tier.name;
    }
  }
  return "Wanderer";
};
 
// K factor based on tier
const getKFactor = (tier) => {
  const found = Object.values(TIERS).find((t) => t.name === tier);
  return found ? found.kFactor : 32;
};
 
module.exports = {
  TIERS,
  DIVISIONS,
  DEBATE_MODES,
  DEBATE_STATUS,
  ROUND_TYPES,
  ROUND_DURATIONS,
  PREP_WINDOW_DURATION,
  VOTE_TYPES,
  getTierFromElo,
  getKFactor,
};
 