import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import api from "../services/api";
import toast from "react-hot-toast";
import TrophyCase from "../components/TrophyCase";
import { Compass, Swords, Sparkles, Star, Crown, Flame, Zap, ScrollText } from "lucide-react";

const useResponsive = () => {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => { const h = () => setW(window.innerWidth); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return { isMobile: w < 640, isTablet: w >= 640 && w < 1024 };
};

const TIER_COLORS = { Wanderer: "#8a8070", Vanguard: "#6b9fb8", Oracle: "#9b7fd4", Ascendant: "#4caf82", Sovereign: "#c9a84c", Conqueror: "#e8604c", Immortal: "#ffffff" };
const TIER_ICONS = { Wanderer: Compass, Vanguard: Swords, Oracle: Sparkles, Ascendant: Star, Sovereign: Crown, Conqueror: Flame, Immortal: Zap };

// ─── STAT BOX ─────────────────────────────────────────────────────
const StatBox = ({ label, value, color }) => (
  <div style={{
    background: "#0d0d0d", border: "1px solid #1a1a1a",
    borderRadius: 10, padding: "1rem", textAlign: "center",
  }}>
    <div style={{
      fontFamily: "Cinzel,serif", fontSize: "clamp(1.2rem,3vw,1.8rem)",
      color: color || "#f5f0e8", fontWeight: 700, lineHeight: 1,
    }}>{value}</div>
    <div style={{
      fontFamily: "Inter,sans-serif", fontSize: "0.68rem",
      color: "#4a4540", marginTop: "0.4rem", letterSpacing: "0.08em",
      textTransform: "uppercase",
    }}>{label}</div>
  </div>
);

// ─── DEBATE ROW ───────────────────────────────────────────────────
const DebateRow = ({ debate, userId, isMobile }) => {
  const won = debate.winner?.toString() === userId?.toString();
  const isCompleted = debate.status === "completed";
  return (
    <div style={{
      display: "flex", alignItems: "center",
      gap: isMobile ? "0.8rem" : "1.2rem",
      padding: isMobile ? "0.8rem" : "0.9rem 1rem",
      background: "#0d0d0d", borderRadius: 8,
      border: "1px solid #1a1a1a",
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
        background: !isCompleted ? "#f39c12" : won ? "#4caf82" : "#e8604c",
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "Inter,sans-serif", fontSize: isMobile ? "0.75rem" : "0.82rem",
          color: "#f5f0e8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{debate.topic}</div>
        <div style={{ fontSize: "0.65rem", color: "#4a4540", marginTop: "0.2rem" }}>
          {debate.division} · {new Date(debate.createdAt).toLocaleDateString()}
        </div>
      </div>
      <div style={{
        fontFamily: "Cinzel,serif", fontSize: "0.68rem",
        color: !isCompleted ? "#f39c12" : won ? "#4caf82" : "#e8604c",
        letterSpacing: "0.08em", flexShrink: 0,
      }}>
        {!isCompleted ? debate.status.toUpperCase() : won ? "WIN" : "LOSS"}
      </div>
    </div>
  );
};

// ─── MAIN PROFILE ─────────────────────────────────────────────────
const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: me } = useSelector(s => s.auth);
  const { isMobile, isTablet } = useResponsive();

  const [profile, setProfile] = useState(null);
  const [debates, setDebates] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followsYou, setFollowsYou] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  const isMyProfile = me?.username === username;

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/${username}`);
      setProfile(res.data.data.user);
      setIsFollowing(res.data.data.isFollowing);
      setFollowsYou(res.data.data.followsYou);

      // Fetch debates
      const debRes = await api.get(`/debates/history/${res.data.data.user._id}`);
      setDebates(debRes.data.data?.slice(0, 10) || []);
    } catch (err) {
      const msg = err.response?.data?.message || "Player not found";
      toast.error(msg);
      setTimeout(() => navigate("/dashboard"), 1500);
    } finally {
      setLoading(false);
    }
  }, [username, navigate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchProfile's first line (setLoading(true)) runs synchronously the instant it's called, before its own first await; this correctly resets the loading spinner when navigating between profiles ([username] changes)
    fetchProfile();
  }, [fetchProfile]);

  const handleFollow = async () => {
    if (!profile || followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await api.delete(`/users/${profile._id}/follow`);
        setIsFollowing(false);
        setProfile(p => ({ ...p, stats: { ...p.stats, followersCount: (p.stats.followersCount || 1) - 1 } }));
        toast.success("Unfollowed");
      } else {
        await api.post(`/users/${profile._id}/follow`);
        setIsFollowing(true);
        setProfile(p => ({ ...p, stats: { ...p.stats, followersCount: (p.stats.followersCount || 0) + 1 } }));
        toast.success("Following!");
      }
    } catch (err) {
      const status = err.response?.status;
      // 409 "already following" / 404 "not following" mean our local state
      // was already stale before this click — self-correct instead of just
      // showing an error, so the button can't be mashed into a loop of
      // identical failing requests.
      if (status === 409) {
        setIsFollowing(true);
      } else if (status === 404 && err.response?.data?.message?.toLowerCase().includes("not following")) {
        setIsFollowing(false);
      } else {
        toast.error(err.response?.data?.message || "Error");
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const tierColor = TIER_COLORS[profile?.tier] || "#8a8070";
  const TierIcon = TIER_ICONS[profile?.tier] || Compass;

  if (loading) return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0a",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
        style={{ fontFamily: "Cinzel,serif", color: "#c9a84c", letterSpacing: "0.2em" }}
      >LOADING LEGEND...</motion.div>
    </div>
  );

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh" }}>
      <div style={{
        maxWidth: 900, margin: "0 auto",
        padding: isMobile ? "2rem 1rem 2rem" : "2rem 2rem 2rem",
      }}>

        {/* ── PROFILE HERO ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: "#111", border: `1px solid ${tierColor}20`,
            borderRadius: 16, padding: isMobile ? "1.5rem" : "2rem",
            marginBottom: "1.5rem", position: "relative", overflow: "hidden",
          }}
        >
          {/* Gold top line */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg,transparent,${tierColor},transparent)`,
          }} />

          <div style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "center" : "flex-start",
            gap: "1.5rem",
            textAlign: isMobile ? "center" : "left",
          }}>
            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{
                width: isMobile ? 80 : 100, height: isMobile ? 80 : 100,
                borderRadius: "50%", overflow: "hidden",
                border: `3px solid ${tierColor}60`,
                background: "#1a1a1a",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {profile?.profileImage ? (
                  <img src={profile.profileImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <TierIcon size={40} color={tierColor} strokeWidth={1.5} />
                )}
              </div>
              {/* Online indicator */}
              {profile?.isOnline && (
                <div style={{
                  position: "absolute", bottom: 4, right: 4,
                  width: 12, height: 12, borderRadius: "50%",
                  background: "#4caf82", border: "2px solid #111",
                }} />
              )}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: "Cinzel,serif",
                fontSize: isMobile ? "1.3rem" : "1.8rem",
                color: "#f5f0e8", fontWeight: 700, lineHeight: 1.2,
                marginBottom: "0.3rem",
              }}>{profile?.name}</div>
              <div style={{
                fontFamily: "Inter,sans-serif", fontSize: "0.82rem",
                color: "#4a4540", marginBottom: "0.8rem",
              }}>@{profile?.username} · {profile?.country}</div>

              {/* Tier badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                background: `${tierColor}15`, border: `1px solid ${tierColor}30`,
                borderRadius: 6, padding: "0.3rem 0.8rem", marginBottom: "0.8rem",
              }}>
                <TierIcon size={14} color={tierColor} />
                <span style={{
                  fontFamily: "Cinzel,serif", fontSize: "0.72rem",
                  color: tierColor, letterSpacing: "0.1em",
                }}>{profile?.tier}</span>
                <span style={{
                  fontFamily: "JetBrains Mono,monospace", fontSize: "0.72rem",
                  color: tierColor, opacity: 0.7,
                }}>{profile?.elo} ELO</span>
              </div>

              {/* Bio */}
              {profile?.bio && (
                <p style={{
                  fontSize: "0.82rem", color: "#8a8070",
                  fontFamily: "Inter,sans-serif", lineHeight: 1.7,
                  maxWidth: 500,
                }}>{profile.bio}</p>
              )}

              {/* Style + Languages */}
              <div style={{
                display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.8rem",
                justifyContent: isMobile ? "center" : "flex-start",
              }}>
                {profile?.playingStyle && (
                  <span style={{
                    background: "#1a1a1a", border: "1px solid #2a2a2a",
                    borderRadius: 20, padding: "0.2rem 0.8rem",
                    fontSize: "0.68rem", color: "#c9a84c",
                    fontFamily: "Cinzel,serif", letterSpacing: "0.08em",
                  }}>{profile.playingStyle}</span>
                )}
                {profile?.languages?.map(l => (
                  <span key={l} style={{
                    background: "#1a1a1a", border: "1px solid #2a2a2a",
                    borderRadius: 20, padding: "0.2rem 0.8rem",
                    fontSize: "0.68rem", color: "#8a8070",
                    fontFamily: "Inter,sans-serif",
                  }}>{l}</span>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", flexShrink: 0 }}>
              {!isMyProfile ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={handleFollow}
                    disabled={followLoading}
                    style={{
                      padding: "0.6rem 1.5rem",
                      background: isFollowing ? "transparent" : "linear-gradient(135deg,#c9a84c,#a07830)",
                      border: isFollowing ? "1px solid #c9a84c" : "none",
                      borderRadius: 8, color: isFollowing ? "#c9a84c" : "#0a0a0a",
                      fontFamily: "Cinzel,serif", fontSize: "0.72rem",
                      letterSpacing: "0.1em", cursor: "pointer", fontWeight: 700,
                      minWidth: 120,
                    }}
                  >{followLoading ? "..." : isFollowing ? "FOLLOWING" : followsYou ? "FOLLOW BACK" : "FOLLOW"}</motion.button>
                  {isFollowing && followsYou && (
                    <div style={{ fontFamily: "Inter,sans-serif", fontSize: "0.65rem", color: "#c9a84c", textAlign: "center" }}>
                      <Swords size={11} style={{ display: "inline", verticalAlign: "-1px", marginRight: 4 }} /> You both follow each other
                    </div>
                  )}
                </>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => navigate("/settings")}
                  style={{
                    padding: "0.6rem 1.5rem",
                    background: "transparent", border: "1px solid #2a2a2a",
                    borderRadius: 8, color: "#8a8070",
                    fontFamily: "Cinzel,serif", fontSize: "0.72rem",
                    letterSpacing: "0.1em", cursor: "pointer",
                  }}
                >EDIT PROFILE</motion.button>
              )}

              {/* Followers / Following */}
              <div style={{ display: "flex", gap: "1.2rem" }}>
                <div
                  onClick={() => navigate(`/profile/${profile?.username}/connections?tab=followers`)}
                  style={{ textAlign: "center", cursor: "pointer" }}
                >
                  <div style={{
                    fontFamily: "Cinzel,serif", fontSize: "1rem",
                    color: "#f5f0e8", fontWeight: 700,
                  }}>{profile?.stats?.followersCount || 0}</div>
                  <div style={{ fontSize: "0.62rem", color: "#4a4540", fontFamily: "Inter,sans-serif" }}>
                    followers
                  </div>
                </div>
                <div
                  onClick={() => navigate(`/profile/${profile?.username}/connections?tab=following`)}
                  style={{ textAlign: "center", cursor: "pointer" }}
                >
                  <div style={{
                    fontFamily: "Cinzel,serif", fontSize: "1rem",
                    color: "#f5f0e8", fontWeight: 700,
                  }}>{profile?.stats?.supportersCount || 0}</div>
                  <div style={{ fontSize: "0.62rem", color: "#4a4540", fontFamily: "Inter,sans-serif" }}>
                    following
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── STATS GRID ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2,1fr)" : isTablet ? "repeat(3,1fr)" : "repeat(5,1fr)",
            gap: "0.8rem", marginBottom: "1.5rem",
          }}
        >
          <StatBox label="Wins" value={profile?.stats?.wins || 0} color="#4caf82" />
          <StatBox label="Losses" value={profile?.stats?.losses || 0} color="#e8604c" />
          <StatBox label="Win Rate" value={`${profile?.stats?.winRate || 0}%`} color="#c9a84c" />
          <StatBox label="Debates" value={profile?.stats?.totalDebates || 0} color="#9b7fd4" />
          <StatBox label="Streak" value={profile?.stats?.longestStreak || 0} color="#6b9fb8" />
        </motion.div>

        {profile?.username && <TrophyCase username={profile.username} />}

        {/* ── DEBATE HISTORY ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{
            background: "#111", border: "1px solid #1e1e1e",
            borderRadius: 12, padding: "1.5rem",
          }}
        >
          <div style={{
            fontFamily: "Cinzel,serif", fontSize: "0.82rem",
            color: "#f5f0e8", letterSpacing: "0.1em",
            marginBottom: "1.2rem", fontWeight: 600,
          }}>DEBATE HISTORY</div>

          {debates.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem" }}>
              <div style={{ marginBottom:"0.8rem", display:"flex", justifyContent:"center" }}><ScrollText size={32} color="#4a4540" strokeWidth={1.5} /></div>
              <div style={{ fontFamily: "Cinzel,serif", color: "#4a4540", fontSize: "0.82rem" }}>
                No battles recorded yet
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {debates.map((debate, i) => (
                <motion.div key={debate._id}
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <DebateRow debate={debate} userId={profile?._id} isMobile={isMobile} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── DIVISION TITLES ──────────────────────────────── */}
        {profile?.divisionTitles?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            style={{
              background: "#111", border: "1px solid #1e1e1e",
              borderRadius: 12, padding: "1.5rem", marginTop: "1rem",
            }}
          >
            <div style={{
              fontFamily: "Cinzel,serif", fontSize: "0.82rem",
              color: "#f5f0e8", letterSpacing: "0.1em",
              marginBottom: "1rem", fontWeight: 600,
            }}>DIVISION TITLES</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
              {profile.divisionTitles.map(title => (
                <span key={title} style={{
                  background: "linear-gradient(135deg,#1a1408,#111)",
                  border: "1px solid #c9a84c30",
                  borderRadius: 6, padding: "0.4rem 1rem",
                  fontFamily: "Cinzel,serif", fontSize: "0.72rem",
                  color: "#c9a84c", letterSpacing: "0.1em",
                }}><Crown size={12} style={{ display: "inline", verticalAlign: "-1px", marginRight: 4 }} /> {title}</span>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Profile;