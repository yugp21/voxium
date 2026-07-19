import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import {
  Compass, Swords, Sparkles, Star, Crown, Flame, Zap,
  ArrowUpRight, User, Trophy, Bell,
} from "lucide-react";
import api from "../services/api";
import { COLORS } from "../constants/theme";

// ─── RESPONSIVE ───────────────────────────────────────────────────
const useResponsive = () => {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return { isMobile: w < 720, isDesktop: w >= 1080 };
};

const TIER_DATA = {
  Wanderer:  { color: "#6b6a80", next: "Vanguard",  nextElo: 500,  icon: Compass },
  Vanguard:  { color: "#4d8cff", next: "Oracle",    nextElo: 1000, icon: Swords },
  Oracle:    { color: "#a06bff", next: "Ascendant", nextElo: 1500, icon: Sparkles },
  Ascendant: { color: "#4caf82", next: "Sovereign", nextElo: 2000, icon: Star },
  Sovereign: { color: "#7c5cff", next: "Conqueror", nextElo: 2500, icon: Crown },
  Conqueror: { color: "#ff5c7c", next: "Immortal",  nextElo: 3000, icon: Flame },
  Immortal:  { color: "#00e5ff", next: null,        nextElo: null, icon: Zap },
};
const TIER_ORDER = Object.keys(TIER_DATA);

// This IS the layout reinvention: no card grid at all. A vertical rail
// of every tier (current one expanded, others collapsed to a thin dot),
// running the full height of the screen as a permanent spine — your
// rank is always visible as *position on a ladder*, not a stat in a box.
const TierRail = ({ currentTier, elo }) => {
  const currentIndex = TIER_ORDER.indexOf(currentTier);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      <div style={{ position: "absolute", left: 15, top: 8, bottom: 8, width: 1, background: COLORS.border }} />
      {TIER_ORDER.map((tierName, i) => {
        const t = TIER_DATA[tierName];
        const isCurrent = tierName === currentTier;
        const isPast = i < currentIndex;
        const Icon = t.icon;
        return (
          <div key={tierName} style={{
            display: "flex", alignItems: "center", gap: "0.9rem",
            padding: isCurrent ? "1.1rem 0" : "0.6rem 0",
            position: "relative", opacity: isCurrent ? 1 : isPast ? 0.55 : 0.3,
          }}>
            <div style={{
              width: isCurrent ? 32 : 12, height: isCurrent ? 32 : 12, borderRadius: "50%",
              background: isCurrent ? `${t.color}18` : COLORS.bg,
              border: `1.5px solid ${isCurrent ? t.color : COLORS.borderStrong}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, zIndex: 1, transition: "all 0.3s",
            }}>
              {isCurrent && <Icon size={16} color={t.color} strokeWidth={2} />}
            </div>
            {isCurrent && (
              <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.95rem", fontWeight: 700, color: t.color }}>{tierName}</div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.68rem", color: COLORS.textFaint }}>{elo} ELO</div>
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── MAIN ─────────────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { isMobile, isDesktop } = useResponsive();
  const [recentDebates, setRecentDebates] = useState([]);
  const [loadingDebates, setLoadingDebates] = useState(true);

  const tier = TIER_DATA[user?.tier] || TIER_DATA.Wanderer;
  const tierIndex = TIER_ORDER.indexOf(user?.tier || "Wanderer");
  const currentTierMinElo = [0, 500, 1000, 1500, 2000, 2500, 3000][tierIndex] || 0;
  const nextTierElo = tier.nextElo || (user?.elo || 0) + 100;
  const eloProgress = Math.min(((user?.elo - currentTierMinElo) / (nextTierElo - currentTierMinElo)) * 100, 100);

  useEffect(() => {
    const fetchDebates = async () => {
      try {
        const res = await api.get(`/debates/history/${user?._id}`);
        setRecentDebates(res.data.data?.slice(0, 6) || []);
      } catch {
        setRecentDebates([]);
      } finally {
        setLoadingDebates(false);
      }
    };
    if (user?._id) fetchDebates();
  }, [user]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "MORNING BRIEFING";
    if (h < 17) return "AFTERNOON STATUS";
    return "EVENING DEBRIEF";
  };

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", fontFamily: "Inter, -apple-system, sans-serif" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: isDesktop ? "220px 1fr 320px" : "1fr",
        minHeight: "100vh",
      }}>

        {/* ── LEFT: PERMANENT TIER RAIL (desktop only) ────────── */}
        {isDesktop && (
          <div style={{ borderRight: `1px solid ${COLORS.border}`, padding: "2rem 1.5rem" }}>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.62rem", color: COLORS.textFaint, letterSpacing: "0.15em", marginBottom: "2rem" }}>
              RANK LADDER
            </div>
            <TierRail currentTier={user?.tier || "Wanderer"} elo={user?.elo || 0} />
          </div>
        )}

        {/* ── CENTER: THE ACTUAL DASHBOARD ─────────────────────── */}
        <div style={{ padding: isMobile ? "1.5rem 1.2rem" : "2.5rem 3rem", borderRight: isDesktop ? `1px solid ${COLORS.border}` : "none" }}>

          {/* Header — no card, just editorial type + a hairline rule */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: tier.color, letterSpacing: "0.2em", marginBottom: "0.6rem" }}>
              {getGreeting()}
            </div>
            <h1 style={{
              fontFamily: "Inter, sans-serif", fontSize: isMobile ? "2rem" : "2.6rem",
              fontWeight: 800, color: COLORS.text, letterSpacing: "-0.02em", lineHeight: 1.1,
            }}>{user?.name?.split(" ")[0] || "Legend"}</h1>
          </motion.div>
          <div style={{ height: 1, background: COLORS.border, margin: "1.8rem 0" }} />

          {/* Mobile-only compact tier readout (rail is desktop-only) */}
          {!isDesktop && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", marginBottom: "1.8rem" }}>
              <tier.icon size={20} color={tier.color} />
              <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, color: tier.color }}>{user?.tier}</span>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.75rem", color: COLORS.textFaint }}>{user?.elo || 0} ELO</span>
            </div>
          )}

          {/* Big dominant "next action" panel — one huge editorial block,
              not a small card among many equal cards */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            data-cursor="hover" onClick={() => navigate("/matchmaking")}
            style={{
              border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: isMobile ? "1.8rem" : "2.6rem",
              marginBottom: "2rem", cursor: "pointer", position: "relative", overflow: "hidden",
              background: `linear-gradient(135deg, ${tier.color}08, transparent 60%)`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: COLORS.textFaint, letterSpacing: "0.15em", marginBottom: "0.8rem" }}>
                  NEXT ACTION
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: isMobile ? "1.6rem" : "2.1rem", fontWeight: 700, color: COLORS.text, lineHeight: 1.15, maxWidth: 420 }}>
                  Find your next opponent
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: COLORS.textDim, marginTop: "0.6rem" }}>
                  {nextTierElo - (user?.elo || 0)} ELO from {tier.next || "the top"}
                </div>
              </div>
              <div style={{
                width: 56, height: 56, borderRadius: "50%", border: `1px solid ${tier.color}50`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}><ArrowUpRight size={22} color={tier.color} /></div>
            </div>
            <div style={{ background: COLORS.border, height: 2, borderRadius: 2, marginTop: "1.8rem", overflow: "hidden" }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${eloProgress}%` }} transition={{ duration: 1, delay: 0.3 }}
                style={{ height: "100%", background: tier.color }} />
            </div>
          </motion.div>

          {/* Stats — a single dense row of numbers, not four separate boxes */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            style={{ display: "flex", gap: isMobile ? "1.5rem" : "3rem", flexWrap: "wrap", marginBottom: "2.5rem" }}
          >
            {[
              { label: "WINS", value: user?.stats?.wins || 0 },
              { label: "LOSSES", value: user?.stats?.losses || 0 },
              { label: "WIN RATE", value: `${user?.stats?.winRate || 0}%` },
              { label: "DEBATES", value: user?.stats?.totalDebates || 0 },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.6rem", fontWeight: 700, color: COLORS.text }}>{s.value}</div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: COLORS.textFaint, letterSpacing: "0.12em" }}>{s.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Recent debates — a manifest/log list, not cards */}
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: COLORS.textFaint, letterSpacing: "0.15em", marginBottom: "1rem" }}>
            DEBATE LOG
          </div>
          {loadingDebates ? (
            <div style={{ color: COLORS.textFaint, fontSize: "0.85rem" }}>Loading...</div>
          ) : recentDebates.length === 0 ? (
            <div style={{ color: COLORS.textDim, fontSize: "0.85rem", padding: "1.5rem 0", borderTop: `1px solid ${COLORS.border}` }}>
              No entries yet. Your first debate starts the log.
            </div>
          ) : (
            recentDebates.map((d, i) => (
              <motion.div key={d._id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                data-cursor="hover" onClick={() => navigate(`/result/${d._id}`)}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "0.9rem 0", borderTop: `1px solid ${COLORS.border}`, cursor: "pointer",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.topic}</div>
                  <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: COLORS.textFaint }}>{new Date(d.createdAt).toLocaleDateString()}</div>
                </div>
                <div style={{
                  fontFamily: "JetBrains Mono, monospace", fontSize: "0.68rem", fontWeight: 700, flexShrink: 0,
                  color: d.status === "completed" ? (d.winner?.toString() === user?._id?.toString() ? "#4caf82" : "#ff5c7c") : COLORS.textFaint,
                }}>
                  {d.status === "completed" ? (d.winner?.toString() === user?._id?.toString() ? "WIN" : "LOSS") : d.status.toUpperCase()}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* ── RIGHT: QUICK ACCESS RAIL ─────────────────────────── */}
        {isDesktop && (
          <div style={{ padding: "2.5rem 1.8rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.62rem", color: COLORS.textFaint, letterSpacing: "0.15em", marginBottom: "1.2rem" }}>
              QUICK ACCESS
            </div>
            {[
              { icon: User, label: "Profile", path: `/profile/${user?.username}` },
              { icon: Trophy, label: "Leaderboard", path: "/leaderboard" },
              { icon: Bell, label: "Notifications", path: "/notifications" },
            ].map((item) => (
              <motion.button key={item.label} data-cursor="hover" whileHover={{ x: 4 }}
                onClick={() => navigate(item.path)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.8rem", background: "transparent",
                  border: "none", borderBottom: `1px solid ${COLORS.border}`, padding: "0.9rem 0.2rem",
                  color: COLORS.textDim, cursor: "pointer", fontFamily: "Inter, sans-serif", fontSize: "0.85rem", textAlign: "left",
                }}
              >
                <item.icon size={16} strokeWidth={1.75} />
                {item.label}
              </motion.button>
            ))}

            {user?.playingStyle && (
              <div style={{ marginTop: "2rem" }}>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.62rem", color: COLORS.textFaint, letterSpacing: "0.15em", marginBottom: "0.6rem" }}>
                  DEBATE STYLE
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.1rem", fontWeight: 700, color: tier.color }}>{user.playingStyle}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;