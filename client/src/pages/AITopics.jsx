import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Feather, FlaskConical, Landmark, Gamepad2, Clapperboard, Zap, Swords, Loader2, Check } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";
import { COLORS } from "../constants/theme";

const DIVISIONS = ["Philosophy", "Science", "Politics", "Gaming", "Cinema", "Sports"];
const DIV_ICONS = { Philosophy: Feather, Science: FlaskConical, Politics: Landmark, Gaming: Gamepad2, Cinema: Clapperboard, Sports: Zap };
const DIV_COLORS = { Philosophy: "#a06bff", Science: "#4caf82", Politics: "#4d8cff", Gaming: "#ff5c7c", Cinema: "#7c5cff", Sports: "#00e5ff" };

const AITopics = () => {
  const navigate = useNavigate();
  const [w] = useState(window.innerWidth);
  const isMobile = w < 640;
  const [division, setDivision] = useState("Philosophy");
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  const generateTopics = async () => {
    setLoading(true);
    setTopics([]);
    setSelected(null);
    try {
      const res = await api.get(`/ai/topics?division=${division}&count=6`);
      setTopics(res.data.data || []);
      toast.success("Fresh topics generated!");
    } catch {
      toast.error("AI unavailable. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const divColor = DIV_COLORS[division];

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", fontFamily: "Inter, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: isMobile ? "2.5rem 1.2rem" : "3rem 2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: COLORS.accent2, letterSpacing: "0.2em", marginBottom: "0.6rem" }}>
          <Sparkles size={12} /> POWERED BY GEMINI
        </div>
        <h1 style={{ fontFamily: "Inter, sans-serif", fontSize: isMobile ? "1.8rem" : "2.3rem", fontWeight: 800, color: COLORS.text, marginBottom: "0.4rem" }}>
          Topic Generator
        </h1>
        <p style={{ color: COLORS.textFaint, fontSize: "0.85rem", marginBottom: "2.2rem" }}>Fresh, controversial debate topics for every division.</p>

        {/* Division selector — icon buttons, no card wrapper */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3,1fr)" : "repeat(6,1fr)", gap: "0.6rem", marginBottom: "1.8rem" }}>
          {DIVISIONS.map((d) => {
            const Icon = DIV_ICONS[d];
            const active = division === d;
            return (
              <motion.button key={d} data-cursor="hover" whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
                onClick={() => { setDivision(d); setTopics([]); setSelected(null); }}
                style={{
                  padding: "0.9rem 0.4rem", borderRadius: 10, cursor: "pointer", textAlign: "center",
                  background: active ? `${DIV_COLORS[d]}12` : "transparent",
                  border: active ? `1px solid ${DIV_COLORS[d]}50` : `1px solid ${COLORS.border}`,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem",
                }}
              >
                <Icon size={18} color={active ? DIV_COLORS[d] : COLORS.textFaint} strokeWidth={1.75} />
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", fontWeight: 600, color: active ? DIV_COLORS[d] : COLORS.textFaint }}>{d}</div>
              </motion.button>
            );
          })}
        </div>

        <motion.button data-cursor="hover" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={generateTopics} disabled={loading}
          style={{
            width: "100%", padding: "1rem", marginBottom: "1.8rem",
            background: loading ? COLORS.borderStrong : `linear-gradient(135deg,${COLORS.accent},#5a3fd6)`,
            border: "none", borderRadius: 10, color: "#fff", fontFamily: "Inter,sans-serif",
            fontSize: "0.9rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
          }}
        >{loading ? (
          <>
            <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ display: "flex" }}>
              <Loader2 size={16} />
            </motion.span>
            Generating...
          </>
        ) : <><Sparkles size={16} /> Generate Topics</>}</motion.button>

        <AnimatePresence>
          {topics.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.62rem", color: COLORS.textFaint, letterSpacing: "0.12em", marginBottom: "0.8rem" }}>
                CLICK A TOPIC TO SELECT
              </div>
              {topics.map((topic, i) => {
                const isSelected = selected === i;
                return (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                    data-cursor="hover" onClick={() => setSelected(i)}
                    style={{
                      display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 0",
                      borderTop: `1px solid ${COLORS.border}`, cursor: "pointer",
                      background: isSelected ? `${divColor}08` : "transparent",
                    }}
                  >
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                      background: isSelected ? divColor : COLORS.bgElevated,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", fontWeight: 700,
                      color: isSelected ? "#fff" : COLORS.textFaint,
                    }}>{isSelected ? <Check size={13} /> : i + 1}</div>
                    <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.88rem", color: isSelected ? COLORS.text : COLORS.textDim, lineHeight: 1.5, flex: 1 }}>{topic}</div>
                  </motion.div>
                );
              })}

              {selected !== null && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: "1.5rem" }}>
                  <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: divColor, letterSpacing: "0.15em", marginBottom: "0.5rem" }}>SELECTED</div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.95rem", color: COLORS.text, marginBottom: "1.2rem", fontStyle: "italic" }}>"{topics[selected]}"</div>
                  <motion.button data-cursor="hover" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={() => navigate("/matchmaking")}
                    style={{
                      width: "100%", padding: "0.9rem", background: `linear-gradient(135deg,${COLORS.accent},#5a3fd6)`,
                      border: "none", borderRadius: 8, color: "#fff", fontFamily: "Inter,sans-serif",
                      fontSize: "0.85rem", fontWeight: 700, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                    }}
                  ><Swords size={15} /> Debate This Topic</motion.button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AITopics;