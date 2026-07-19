import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, ArrowRight, Compass, Swords, Sparkles, Star, Crown, Flame, Zap } from "lucide-react";
import api from "../services/api";
import { COLORS } from "../constants/theme";

const TIER_COLORS = { Wanderer: "#6b6a80", Vanguard: "#4d8cff", Oracle: "#a06bff", Ascendant: "#4caf82", Sovereign: "#7c5cff", Conqueror: "#ff5c7c", Immortal: "#00e5ff" };
const TIER_ICONS = { Wanderer: Compass, Vanguard: Swords, Oracle: Sparkles, Ascendant: Star, Sovereign: Crown, Conqueror: Flame, Immortal: Zap };

const SearchUsers = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const search = async (q) => {
    setLoading(true);
    try {
      const res = await api.get(`/users/search?q=${q}`);
      setResults(res.data.data || []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", fontFamily: "Inter, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "3rem 1.5rem" }}>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: COLORS.accent2, letterSpacing: "0.2em", marginBottom: "0.5rem" }}>FIND LEGENDS</div>
        <h1 style={{ fontFamily: "Inter, sans-serif", fontSize: "2rem", fontWeight: 800, color: COLORS.text, marginBottom: "1.8rem" }}>Search</h1>

        {/* Big underline search, not a boxed pill input */}
        <div style={{ position: "relative", marginBottom: "0.4rem" }}>
          <Search size={18} color={COLORS.textFaint} style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or username..." autoFocus
            style={{
              width: "100%", padding: "0.8rem 2rem 0.8rem 2rem", background: "transparent",
              border: "none", borderBottom: `1px solid ${COLORS.borderStrong}`, color: COLORS.text,
              fontFamily: "Inter, sans-serif", fontSize: "1.1rem", outline: "none",
            }}
          />
          {loading && (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)" }}
            ><Loader2 size={16} color={COLORS.accent2} /></motion.div>
          )}
        </div>
        <div style={{ fontSize: "0.7rem", color: COLORS.textFaint, marginBottom: "2rem" }}>Type at least 2 characters</div>

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.62rem", color: COLORS.textFaint, letterSpacing: "0.12em", marginBottom: "0.8rem" }}>
                {results.length} RESULT{results.length !== 1 ? "S" : ""}
              </div>
              {results.map((player, i) => {
                const tierColor = TIER_COLORS[player.tier] || "#6b6a80";
                const TierIcon = TIER_ICONS[player.tier] || Compass;
                return (
                  <motion.div key={player._id}
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    whileHover={{ x: 4 }} data-cursor="hover" onClick={() => navigate(`/profile/${player.username}`)}
                    style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 0", borderTop: `1px solid ${COLORS.border}`, cursor: "pointer" }}
                  >
                    <div style={{
                      width: 42, height: 42, borderRadius: "50%", background: COLORS.bgElevated,
                      border: `1.5px solid ${tierColor}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      {player.profileImage
                        ? <img src={player.profileImage} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} alt="" />
                        : <TierIcon size={16} color={tierColor} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.9rem", fontWeight: 600, color: COLORS.text }}>{player.name}</div>
                      <div style={{ fontSize: "0.75rem", color: COLORS.textFaint }}>@{player.username}{player.country ? ` · ${player.country}` : ""}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: tierColor, fontWeight: 600 }}>{player.tier}</div>
                      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.72rem", color: COLORS.accent2 }}>{player.elo} ELO</div>
                    </div>
                    <ArrowRight size={15} color={COLORS.textFaint} />
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {!loading && query.trim().length >= 2 && results.length === 0 && (
          <div style={{ textAlign: "center", padding: "2rem 0", color: COLORS.textFaint, fontSize: "0.85rem" }}>No players found.</div>
        )}
      </div>
    </div>
  );
};

export default SearchUsers;