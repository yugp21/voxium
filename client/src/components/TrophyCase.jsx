import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Lock } from "lucide-react";
import api from "../services/api";

const TrophyCase = ({ username }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets loading state before a fresh fetch; the rest of the async work is deferred in .then/.catch/.finally below
    setLoading(true);
    api.get(`/achievements/${username}`)
      .then((res) => { if (!cancelled) setData(res.data.data); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [username]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "1.5rem" }}>
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.3, repeat: Infinity }}
          style={{ fontFamily: "Cinzel,serif", color: "#c9a84c", fontSize: "0.7rem", letterSpacing: "0.12em" }}
        >LOADING TROPHIES...</motion.div>
      </div>
    );
  }

  if (!data) return null;

  const { earned, locked, totalEarned, totalAvailable } = data;

  return (
    <div style={{
      background: "#111", border: "1px solid #1e1e1e", borderRadius: 14,
      padding: "1.4rem", marginTop: "1.2rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h3 style={{ fontFamily: "Cinzel,serif", fontSize: "0.85rem", color: "#f5f0e8", letterSpacing: "0.05em" }}>
          <Trophy size={16} style={{ display: "inline", verticalAlign: "-2px", marginRight: 6 }} /> Trophy Case
        </h3>
        <span style={{ fontFamily: "Inter,sans-serif", fontSize: "0.72rem", color: "#4a4540" }}>
          {totalEarned}/{totalAvailable}
        </span>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
        gap: "0.7rem",
      }}>
        {earned.map((a, i) => (
          <motion.div
            key={a._id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            title={a.description}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: "0.35rem", padding: "0.7rem 0.4rem",
              background: "linear-gradient(160deg,#1a1610,#0e0c08)",
              border: "1px solid #c9a84c40", borderRadius: 10,
              cursor: "default",
            }}
          >
            <span style={{ fontSize: "1.5rem", filter: "drop-shadow(0 0 6px #c9a84c60)" }}>{a.icon}</span>
            <span style={{
              fontFamily: "Cinzel,serif", fontSize: "0.6rem", color: "#c9a84c",
              textAlign: "center", lineHeight: 1.3,
            }}>{a.title}</span>
          </motion.div>
        ))}

        {locked.map((a) => (
          <div
            key={a.title}
            title={a.description}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: "0.35rem", padding: "0.7rem 0.4rem",
              background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 10,
              opacity: 0.45, cursor: "default",
            }}
          >
            <Lock size={20} color="#4a4540" strokeWidth={1.75} />
            <span style={{
              fontFamily: "Cinzel,serif", fontSize: "0.6rem", color: "#5a5550",
              textAlign: "center", lineHeight: 1.3,
            }}>{a.title}</span>
          </div>
        ))}
      </div>

      {earned.length === 0 && (
        <p style={{ fontFamily: "Inter,sans-serif", fontSize: "0.72rem", color: "#4a4540", textAlign: "center", marginTop: "0.8rem" }}>
          No trophies yet — win your first debate to start the collection.
        </p>
      )}
    </div>
  );
};

export default TrophyCase;