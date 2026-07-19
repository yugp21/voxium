import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { Compass, Swords, Sparkles, Star, Crown, Flame, Zap, Landmark } from "lucide-react";
import api from "../services/api";
import { COLORS } from "../constants/theme";

const useResponsive = () => {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => { const h = () => setW(window.innerWidth); window.addEventListener("resize",h); return()=>window.removeEventListener("resize",h); },[]);
  return { isMobile: w<720 };
};

const TIER_COLORS = { Wanderer:"#6b6a80", Vanguard:"#4d8cff", Oracle:"#a06bff", Ascendant:"#4caf82", Sovereign:"#7c5cff", Conqueror:"#ff5c7c", Immortal:"#00e5ff" };
const TIER_ICONS = { Wanderer:Compass, Vanguard:Swords, Oracle:Sparkles, Ascendant:Star, Sovereign:Crown, Conqueror:Flame, Immortal:Zap };

// ─── RANKED ROW ─────────────────────────────────────────────────────
// The rank number itself is the dominant visual element — huge, thin,
// editorial numerals — rather than a small badge or medal icon buried
// in a card. This is the leaderboard's own structural idea, distinct
// from Dashboard's ladder rail: rank expressed through TYPE SCALE.
const RankedRow = ({ player, index, isMe, isMobile }) => {
  const navigate = useNavigate();
  const tierColor = TIER_COLORS[player.tier] || "#6b6a80";
  const TierIcon = TIER_ICONS[player.tier] || Compass;
  const isTopThree = player.rank <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}
      data-cursor="hover" onClick={() => navigate(`/profile/${player.username}`)}
      style={{
        display: "flex", alignItems: "center", gap: isMobile ? "1rem" : "1.8rem",
        padding: isMobile ? "1rem 0" : "1.3rem 0.5rem",
        borderTop: `1px solid ${COLORS.border}`, cursor: "pointer",
        background: isMe ? `${COLORS.accent}08` : "transparent",
      }}
    >
      <div style={{
        fontFamily: "Inter, sans-serif", fontWeight: 200,
        fontSize: isMobile ? "1.6rem" : "2.4rem", minWidth: isMobile ? 44 : 70,
        color: isTopThree ? tierColor : COLORS.textFaint, lineHeight: 1, flexShrink: 0,
      }}>{String(player.rank).padStart(2, "0")}</div>

      <div style={{
        width: isMobile ? 34 : 44, height: isMobile ? 34 : 44, borderRadius: "50%",
        overflow: "hidden", background: COLORS.bgElevated, border: `1px solid ${tierColor}40`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {player.profileImage
          ? <img src={player.profileImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <TierIcon size={16} color={tierColor} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: isMobile ? "0.85rem" : "0.95rem", fontWeight: 600, color: COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {player.name} {isMe && <span style={{ color: COLORS.accent2, fontWeight: 500 }}>(you)</span>}
        </div>
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: COLORS.textFaint }}>
          @{player.username}{player.country ? ` · ${player.country}` : ""}
        </div>
      </div>

      {!isMobile && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", minWidth: 110 }}>
          <TierIcon size={14} color={tierColor} />
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", fontWeight: 600, color: tierColor }}>{player.tier}</span>
        </div>
      )}

      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.68rem", color: COLORS.textDim, minWidth: 50, textAlign: "right" }}>
        {player.stats?.winRate || 0}%
      </div>

      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: isMobile ? "0.85rem" : "0.95rem", fontWeight: 700, color: COLORS.text, minWidth: 60, textAlign: "right" }}>
        {player.elo}
      </div>
    </motion.div>
  );
};

// ─── MAIN ─────────────────────────────────────────────────────────
const Leaderboard = () => {
  const { user } = useSelector((s) => s.auth);
  const { isMobile } = useResponsive();
  const [tab, setTab] = useState("Global");
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState(null);

  useEffect(() => { fetchLeaderboard(); }, [tab]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = tab === "Global"
        ? await api.get("/leaderboard/global")
        : await api.get(`/leaderboard/country/${user?.country || "India"}`);
      setPlayers(res.data.data || []);
      if (user?._id) {
        const rankRes = await api.get(`/leaderboard/rank/${user._id}`);
        setMyRank(rankRes.data.data?.rank);
      }
    } catch {
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", fontFamily: "Inter, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: isMobile ? "2rem 1.2rem" : "3rem 2rem" }}>

        {/* Header — editorial, not a card */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
          <div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: COLORS.accent2, letterSpacing: "0.2em", marginBottom: "0.5rem" }}>
              THE STANDINGS
            </div>
            <h1 style={{ fontFamily: "Inter, sans-serif", fontSize: isMobile ? "1.8rem" : "2.4rem", fontWeight: 800, color: COLORS.text, letterSpacing: "-0.02em" }}>
              Leaderboard
            </h1>
          </div>
          {myRank && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: COLORS.textFaint, letterSpacing: "0.12em" }}>YOUR RANK</div>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.6rem", fontWeight: 700, color: COLORS.accent2 }}>#{myRank}</div>
            </div>
          )}
        </div>

        {/* Tab toggle — minimal underline, not pill buttons on a card */}
        <div style={{ display: "flex", gap: "1.5rem", borderBottom: `1px solid ${COLORS.border}`, marginBottom: "0.5rem" }}>
          {["Global", "Country"].map((t) => (
            <button key={t} data-cursor="hover" onClick={() => setTab(t)}
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                padding: "0.7rem 0", fontFamily: "Inter, sans-serif", fontSize: "0.85rem", fontWeight: 600,
                color: tab === t ? COLORS.text : COLORS.textFaint,
                borderBottom: tab === t ? `2px solid ${COLORS.accent2}` : "2px solid transparent",
                marginBottom: -1,
              }}
            >{t}</button>
          ))}
        </div>

        {/* Column labels */}
        {!isMobile && !loading && players.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "1.8rem", padding: "0.8rem 0.5rem 0", fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: COLORS.textFaint, letterSpacing: "0.1em" }}>
            <div style={{ minWidth: 70 }}>RANK</div>
            <div style={{ width: 44 }} />
            <div style={{ flex: 1 }}>PLAYER</div>
            <div style={{ minWidth: 110 }}>TIER</div>
            <div style={{ minWidth: 50, textAlign: "right" }}>WIN%</div>
            <div style={{ minWidth: 60, textAlign: "right" }}>ELO</div>
          </div>
        )}

        {loading ? (
          <div style={{ padding: "3rem 0", textAlign: "center", color: COLORS.textFaint, fontFamily: "JetBrains Mono, monospace", fontSize: "0.75rem" }}>
            LOADING STANDINGS...
          </div>
        ) : players.length === 0 ? (
          <div style={{ padding: "3rem 0", textAlign: "center" }}>
            <Landmark size={36} color={COLORS.textFaint} strokeWidth={1.5} style={{ marginBottom: "0.8rem" }} />
            <div style={{ fontFamily: "Inter, sans-serif", color: COLORS.textDim, fontSize: "0.85rem" }}>No rankings yet for this view.</div>
          </div>
        ) : (
          <AnimatePresence>
            {players.map((p, i) => (
              <RankedRow key={p._id} player={p} index={i} isMe={p._id === user?._id} isMobile={isMobile} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;