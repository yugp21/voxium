export const ROUTES = {
  // Public
  LANDING: "/",
  LOGIN: "/login",
  REGISTER: "/register",
 
  // Auth required
  ONBOARDING: "/onboarding",
  DASHBOARD: "/dashboard",
  MATCHMAKING: "/matchmaking",
  PREP_WINDOW: "/prep/:debateId",
  DEBATE_ROOM: "/debate/:debateId",
  PROFILE: "/profile/:username",
  LEADERBOARD: "/leaderboard",
  NOTIFICATIONS: "/notifications",
 
  // Helpers
  toPrepWindow: (id) => `/prep/${id}`,
  toDebateRoom: (id) => `/debate/${id}`,
  toProfile: (username) => `/profile/${username}`,
};