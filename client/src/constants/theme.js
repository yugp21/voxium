// Central theme tokens. Previously every page hardcoded its own hex values
// (#c9a84c gold, #0a0a0a background, etc.) independently — this is the
// single source of truth going forward. Import COLORS instead of typing
// hex codes directly, so the next palette change is a one-file edit.
export const COLORS = {
  bg: "#08080c",
  bgElevated: "#111116",
  surface: "#0d0d12",
  border: "#1e1e26",
  borderStrong: "#2a2a35",

  // Primary accent (was gold #c9a84c) — violet, the "AI startup" signal color
  accent: "#7c5cff",
  accentDim: "#7c5cff30",
  accentSoft: "#7c5cff15",

  // Secondary accent for highlights/glow — electric cyan
  accent2: "#00e5ff",
  accent2Dim: "#00e5ff30",

  text: "#f2f0f8",
  textDim: "#6b6a80",
  textFaint: "#3a3a48",

  success: "#4caf82",
  danger: "#ff5c7c",
  warning: "#ffb454",
};

// Tier colors keep their own distinct hues (that's the point — visually
// differentiating rank), but Sovereign's color moves off gold to stay
// consistent with the new palette.
export const TIER_COLORS = {
  Wanderer: "#6b6a80",
  Vanguard: "#4d8cff",
  Oracle: "#a06bff",
  Ascendant: "#4caf82",
  Sovereign: "#7c5cff",
  Conqueror: "#ff5c7c",
  Immortal: "#00e5ff",
};