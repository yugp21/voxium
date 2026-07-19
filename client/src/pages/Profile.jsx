import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import api from "../services/api";
import toast from "react-hot-toast";
import TrophyCase from "../components/TrophyCase";
import { Compass, Swords, Sparkles, Star, Crown, Flame, Zap, ArrowLeft, Settings2 } from "lucide-react";
import { COLORS } from "../constants/theme";

const useResponsive = () => {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => { const h = () => setW(window.innerWidth); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return { isMobile: w < 720, isDesktop: w >= 960 };
};

const TIER_COLORS = { Wanderer: "#6b6a80", Vanguard: "#4d8cff", Oracle: "#a06bff", Ascendant: "#4caf82", Sovereign: "#7c5cff", Conqueror: "#ff5c7c", Immortal: "#00e5ff" };
const TIER_ICONS = { Wanderer: Compass, Vanguard: Swords, Oracle: Sparkles, Ascendant: Star, Sovereign: Crown, Conqueror: Flame, Immortal: Zap };

// ─── MAIN PROFILE ─────────────────────────────────────────────────
// Structural idea: a fixed "ID card" left column (avatar, tier, follow
// action, key stats as a vertical stack) that stays put, with the
// debate log scrolling independently on the right — like an identity
// badge next to a case file, not a stacked hero + grid of boxes.
const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: me } = useSelector(s => s.auth);
  const { isMobile, isDesktop } = useResponsive();

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
      const debRes = await api.get(`/debates/history/${res.data.data.user._id}`);
      setDebates(debRes.data.data?.slice(0, 10) || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Player not found");
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
      if (status === 409) setIsFollowing(true);
      else if (status === 404 && err.response?.data?.message?.toLowerCase().includes("not following")) setIsFollowing(false);
      else toast.error(err.response?.data?.message || "Error");
    } finally {
      setFollowLoading(false);
    }
  };

  const tierColor = TIER_COLORS[profile?.tier] || "#6b6a80";
  const TierIcon = TIER_ICONS[profile?.tier] || Compass;

  if (loading) {
    return (
      <div style={{ background: COLORS.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.75rem", color: COLORS.textFaint, letterSpacing: "0.15em" }}>LOADING PROFILE...</div>
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", fontFamily: "Inter, -apple-system, sans-serif" }}>
      <div style={{
        display: "grid", gridTemplateColumns: isDesktop ? "320px 1fr" : "1fr",
        maxWidth: 1000, margin: "0 auto", minHeight: "100vh",
      }}>

        {/* ── LEFT: FIXED ID CARD ──────────────────────────────── */}
        <div style={{
          padding: isMobile ? "1.5rem 1.2rem" : "2.5rem 2rem",
          borderRight: isDesktop ? `1px solid ${COLORS.border}` : "none",
          borderBottom: !isDesktop ? `1px solid ${COLORS.border}` : "none",
          position: isDesktop ? "sticky" : "static", top: 0, height: isDesktop ? "100vh" : "auto",
        }}>
          <button data-cursor="hover" onClick={() => navigate(-1)} style={{
            display: "flex", alignItems: "center", gap: "0.4rem", background: "transparent", border: "none",
            color: COLORS.textFaint, fontFamily: "Inter, sans-serif", fontSize: "0.78rem", cursor: "pointer", marginBottom: "2rem", padding: 0,
          }}><ArrowLeft size={14} /> Back</button>

          <div style={{
            width: 88, height: 88, borderRadius: "50%", overflow: "hidden",
            background: COLORS.bgElevated, border: `2px solid ${tierColor}50`,
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.2rem",
          }}>
            {profile?.profileImage
              ? <img src={profile.profileImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <TierIcon size={34} color={tierColor} strokeWidth={1.5} />}
          </div>

          <h1 style={{ fontFamily: "Inter, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: COLORS.text, letterSpacing: "-0.01em" }}>{profile?.name}</h1>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: COLORS.textFaint, marginBottom: "1rem" }}>@{profile?.username}</div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <TierIcon size={16} color={tierColor} />
            <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", fontWeight: 700, color: tierColor }}>{profile?.tier}</span>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.72rem", color: COLORS.textDim }}>{profile?.elo} ELO</span>
          </div>

          {profile?.bio && (
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: COLORS.textDim, lineHeight: 1.6, margin: "1rem 0" }}>{profile.bio}</p>
          )}

          <div style={{ display: "flex", gap: "1.5rem", margin: "1.2rem 0" }}>
            <div data-cursor="hover" onClick={() => navigate(`/profile/${username}/connections?tab=followers`)} style={{ cursor: "pointer" }}>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.1rem", fontWeight: 700, color: COLORS.text }}>{profile?.stats?.followersCount || 0}</div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: COLORS.textFaint, letterSpacing: "0.08em" }}>FOLLOWERS</div>
            </div>
            <div data-cursor="hover" onClick={() => navigate(`/profile/${username}/connections?tab=following`)} style={{ cursor: "pointer" }}>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.1rem", fontWeight: 700, color: COLORS.text }}>{profile?.stats?.supportersCount || 0}</div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: COLORS.textFaint, letterSpacing: "0.08em" }}>FOLLOWING</div>
            </div>
          </div>

          {isMyProfile ? (
            <button data-cursor="hover" onClick={() => navigate("/settings")} style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              padding: "0.7rem", background: "transparent", border: `1px solid ${COLORS.borderStrong}`, borderRadius: 8,
              color: COLORS.textDim, fontFamily: "Inter, sans-serif", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
            }}><Settings2 size={14} /> Edit Profile</button>
          ) : (
            <>
              <button data-cursor="hover" onClick={handleFollow} disabled={followLoading} style={{
                width: "100%", padding: "0.7rem",
                background: isFollowing ? "transparent" : `linear-gradient(135deg,${COLORS.accent},#5a3fd6)`,
                border: isFollowing ? `1px solid ${COLORS.accent}` : "none",
                borderRadius: 8, color: isFollowing ? COLORS.accent2 : "#fff",
                fontFamily: "Inter, sans-serif", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer",
              }}>{followLoading ? "..." : isFollowing ? "Following" : followsYou ? "Follow Back" : "Follow"}</button>
              {isFollowing && followsYou && (
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.68rem", color: COLORS.accent2, textAlign: "center", marginTop: "0.5rem" }}>
                  You both follow each other
                </div>
              )}
            </>
          )}

          {/* Stat stack — vertical, part of the ID card, not separate boxes */}
          <div style={{ marginTop: "2rem" }}>
            {[
              { label: "Wins", value: profile?.stats?.wins || 0 },
              { label: "Losses", value: profile?.stats?.losses || 0 },
              { label: "Win Rate", value: `${profile?.stats?.winRate || 0}%` },
              { label: "Streak", value: profile?.stats?.longestStreak || 0 },
            ].map((s) => (
              <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderTop: `1px solid ${COLORS.border}` }}>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: COLORS.textFaint }}>{s.label}</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.85rem", fontWeight: 700, color: COLORS.text }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: SCROLLING CASE FILE ───────────────────────── */}
        <div style={{ padding: isMobile ? "1.5rem 1.2rem" : "2.5rem 2rem" }}>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: COLORS.textFaint, letterSpacing: "0.15em", marginBottom: "1.2rem" }}>
            DEBATE HISTORY
          </div>
          {debates.length === 0 ? (
            <div style={{ padding: "2rem 0", color: COLORS.textDim, fontSize: "0.85rem", borderTop: `1px solid ${COLORS.border}` }}>
              No debates yet.
            </div>
          ) : (
            debates.map((d, i) => {
              const won = d.winner?.toString() === profile?._id?.toString();
              const isCompleted = d.status === "completed";
              return (
                <motion.div key={d._id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 0", borderTop: `1px solid ${COLORS.border}` }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.topic}</div>
                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: COLORS.textFaint, marginTop: "0.2rem" }}>
                      {d.division} · {new Date(d.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{
                    fontFamily: "JetBrains Mono, monospace", fontSize: "0.7rem", fontWeight: 700, flexShrink: 0,
                    color: !isCompleted ? "#ffb454" : won ? "#4caf82" : "#ff5c7c",
                  }}>{!isCompleted ? d.status.toUpperCase() : won ? "WIN" : "LOSS"}</div>
                </motion.div>
              );
            })
          )}

          {profile?.username && <div style={{ marginTop: "2rem" }}><TrophyCase username={profile.username} /></div>}
        </div>
      </div>
    </div>
  );
};

export default Profile;