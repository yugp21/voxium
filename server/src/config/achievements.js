// Achievement definitions. Each `check` runs against the user's stats
// AFTER a debate result is applied. Adding a new achievement = adding one
// entry here; checkAchievements.js handles dedup + awarding automatically.
const ACHIEVEMENTS = [
  {
    id: "first_blood",
    title: "First Blood",
    description: "Win your first debate",
    icon: "🩸",
    check: (stats) => stats.wins >= 1,
  },
  {
    id: "debate_novice",
    title: "Debate Novice",
    description: "Complete 10 debates",
    icon: "📘",
    check: (stats) => stats.totalDebates >= 10,
  },
  {
    id: "debate_veteran",
    title: "Debate Veteran",
    description: "Complete 50 debates",
    icon: "📚",
    check: (stats) => stats.totalDebates >= 50,
  },
  {
    id: "century_club",
    title: "Century Club",
    description: "Complete 100 debates",
    icon: "💯",
    check: (stats) => stats.totalDebates >= 100,
  },
  {
    id: "hot_streak",
    title: "Hot Streak",
    description: "Win 3 debates in a row",
    icon: "🔥",
    check: (stats) => stats.currentStreak >= 3,
  },
  {
    id: "unstoppable",
    title: "Unstoppable",
    description: "Win 5 debates in a row",
    icon: "⚡",
    check: (stats) => stats.currentStreak >= 5,
  },
  {
    id: "legendary_streak",
    title: "Legendary Streak",
    description: "Win 10 debates in a row",
    icon: "👑",
    check: (stats) => stats.currentStreak >= 10,
  },
  {
    id: "rising_star",
    title: "Rising Star",
    description: "Reach Ascendant tier",
    icon: "🌟",
    check: (stats, tier) => ["Ascendant", "Sovereign", "Conqueror", "Immortal"].includes(tier),
  },
  {
    id: "sovereign_rank",
    title: "Sovereign",
    description: "Reach Sovereign tier",
    icon: "🏆",
    check: (stats, tier) => ["Sovereign", "Conqueror", "Immortal"].includes(tier),
  },
  {
    id: "immortal_rank",
    title: "Immortal",
    description: "Reach the Immortal tier — the top of the arena",
    icon: "♾️",
    check: (stats, tier) => tier === "Immortal",
  },
];

module.exports = ACHIEVEMENTS;