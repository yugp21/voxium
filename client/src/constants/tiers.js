
export const TIERS = [
  {
    id: "wanderer",
    name: "Wanderer",
    minElo: 0,
    maxElo: 499,
    color: "#8a8070",
    description: "The journey begins. Every legend starts here.",
    icon: "🗺️",
  },
  {
    id: "vanguard",
    name: "Vanguard",
    minElo: 500,
    maxElo: 999,
    color: "#6b9fb8",
    description: "You've found your voice. Now sharpen it.",
    icon: "⚔️",
  },
  {
    id: "oracle",
    name: "Oracle",
    minElo: 1000,
    maxElo: 1499,
    color: "#9b7fd4",
    description: "Words flow like prophecy. Truth is your weapon.",
    icon: "🔮",
  },
  {
    id: "ascendant",
    name: "Ascendant",
    minElo: 1500,
    maxElo: 1999,
    color: "#4caf82",
    description: "Rising above the rest. Logic and fire combined.",
    icon: "🌟",
  },
  {
    id: "sovereign",
    name: "Sovereign",
    minElo: 2000,
    maxElo: 2499,
    color: "#c9a84c",
    description: "You command the arena. Opponents bow before your words.",
    icon: "👑",
  },
  {
    id: "conqueror",
    name: "Conqueror",
    minElo: 2500,
    maxElo: 2999,
    color: "#e8604c",
    description: "Unstoppable. Undefeated. A force of nature.",
    icon: "🔥",
  },
  {
    id: "immortal",
    name: "Immortal",
    minElo: 3000,
    maxElo: Infinity,
    color: "#ffffff",
    description: "Top 100 globally. Your name echoes through history.",
    icon: "⚡",
  },
];
 
export const getTierFromElo = (elo) => {
  return TIERS.find((t) => elo >= t.minElo && elo <= t.maxElo) || TIERS[0];
};
 
export const getTierColor = (tierName) => {
  const tier = TIERS.find((t) => t.name === tierName);
  return tier?.color || "#8a8070";
};