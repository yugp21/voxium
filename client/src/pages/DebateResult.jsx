import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import api from "../services/api";
import toast from "react-hot-toast";

const useR = () => {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return { isMobile: w < 640, isTablet: w >= 640 && w < 1024 };
};

const RadarChart = ({ dna }) => {
  if (!dna) return null;
  const traits = [
    { key: "aggressive", label: "Aggressive", color: "#e8604c" },
    { key: "analytical", label: "Analytical", color: "#6b9fb8" },
    { key: "emotional",  label: "Emotional",  color: "#9b7fd4" },
    { key: "logical",    label: "Logical",    color: "#4caf82" },
    { key: "creative",   label: "Creative",   color: "#c9a84c" },
  ];
  const cx = 120, cy = 120, r = 80;
  const angle = (i) => (i * 2 * Math.PI) / traits.length - Math.PI / 2;
  const points = traits.map((t, i) => ({
    x: cx + r * ((dna[t.key] || 0) / 100) * Math.cos(angle(i)),
    y: cy + r * ((dna[t.key] || 0) / 100) * Math.sin(angle(i)),
  }));
  const outerPoints = traits.map((_, i) => ({
    x: cx + r * Math.cos(angle(i)),
    y: cy + r * Math.sin(angle(i)),
  }));
  const labelPoints = traits.map((_, i) => ({
    x: cx + (r + 22) * Math.cos(angle(i)),
    y: cy + (r + 22) * Math.sin(angle(i)),
  }));

  return (
    <svg width="240" height="240" style={{ margin: "0 auto", display: "block" }}>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f}
          points={outerPoints.map((p) => `${cx + (p.x - cx) * f},${cy + (p.y - cy) * f}`).join(" ")}
          fill="none" stroke="#2a2a2a" strokeWidth="1"
        />
      ))}
      {outerPoints.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#2a2a2a" strokeWidth="1" />
      ))}
      <motion.polygon
        initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        points={points.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="#c9a84c20" stroke="#c9a84c" strokeWidth="2"
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      {traits.map((t, i) => (
        <text key={t.key} x={labelPoints[i].x} y={labelPoints[i].y}
          textAnchor="middle" dominantBaseline="middle"
          style={{ fontFamily: "Cinzel,serif", fontSize: "8px", fill: t.color }}
        >{t.label}</text>
      ))}
      <circle cx={cx} cy={cy} r="3" fill="#c9a84c" />
    </svg>
  );
};

const DebateResult = () => {
  const { debateId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { isMobile } = useR();

  const [debate, setDebate]       = useState(null);
  const [verdict, setVerdict]     = useState(null);
  const [coaching, setCoaching]   = useState(null);
  const [dna, setDna]             = useState(null);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState("result");
  const [aiLoading, setAiLoading] = useState({ verdict: false, coaching: false, dna: false });

  const myRole = debate?.player1?._id?.toString() === user?._id?.toString() ? "player1" : "player2";
  const won = debate?.winner?._id?.toString() === user?._id?.toString() ||
              debate?.winner?.toString() === user?._id?.toString();
  const opponent = myRole === "player1" ? debate?.player2 : debate?.player1;
  const eloChange = debate?.eloChange?.[myRole] || 0;

  const fetchAll = useCallback(async () => {
    try {
      const res = await api.get(`/debates/${debateId}`);
      setDebate(res.data.data);
      if (res.data.data?.aiVerdict) setVerdict(res.data.data.aiVerdict);
    } catch {
      toast.error("Debate not found");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [debateId, navigate]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; setState only fires after the await, not synchronously in the effect body
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fetchAIVerdict = async () => {
    setAiLoading((p) => ({ ...p, verdict: true }));
    try {
      const res = await api.get(`/ai/judge/${debateId}`);
      setVerdict(res.data.data);
      toast.success("AI Judge verdict ready!");
    } catch { toast.error("AI Judge unavailable"); }
    finally { setAiLoading((p) => ({ ...p, verdict: false })); }
  };

  const fetchCoaching = async () => {
    setAiLoading((p) => ({ ...p, coaching: true }));
    try {
      const res = await api.get(`/ai/coach/${debateId}`);
      setCoaching(res.data.data);
      toast.success("AI Coach feedback ready!");
    } catch { toast.error("AI Coach unavailable"); }
    finally { setAiLoading((p) => ({ ...p, coaching: false })); }
  };

  const fetchDNA = async () => {
    setAiLoading((p) => ({ ...p, dna: true }));
    try {
      const res = await api.get(`/ai/dna/${user?._id}`);
      setDna(res.data.data);
      toast.success("Debate DNA analyzed!");
    } catch { toast.error("DNA analysis unavailable"); }
    finally { setAiLoading((p) => ({ ...p, dna: false })); }
  };

  const TABS = [
    { id: "result",   label: "Result",     icon: "🏆" },
    { id: "verdict",  label: "AI Judge",   icon: "⚖️" },
    { id: "coaching", label: "AI Coach",   icon: "🎯" },
    { id: "dna",      label: "Debate DNA", icon: "🧬" },
  ];

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
        style={{ fontFamily: "Cinzel,serif", color: "#c9a84c", letterSpacing: "0.2em" }}
      >LOADING RESULTS...</motion.div>
    </div>
  );

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh" }}>
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: isMobile ? "0.9rem 1.2rem" : "0.9rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0f0f0fF0", backdropFilter: "blur(12px)", borderBottom: "1px solid #1a1a1a" }}>
        <div style={{ fontFamily: "Cinzel Decorative,serif", fontSize: isMobile ? "0.85rem" : "1rem", color: "#c9a84c", letterSpacing: "0.2em", cursor: "pointer" }} onClick={() => navigate("/dashboard")}>UDA</div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/dashboard")}
          style={{ background: "transparent", border: "1px solid #2a2a2a", color: "#8a8070", padding: "0.4rem 1rem", fontFamily: "Cinzel,serif", fontSize: "0.68rem", letterSpacing: "0.1em", cursor: "pointer", borderRadius: 6 }}
        >← DASHBOARD</motion.button>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "5rem 1rem 2rem" : "5rem 2rem 2rem" }}>
        {/* Result Hero */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", marginBottom: "2rem", padding: "2rem", background: "#111", border: `1px solid ${won ? "#c9a84c30" : "#e8604c30"}`, borderRadius: 16, position: "relative", overflow: "hidden" }}
        >
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,transparent,${won ? "#c9a84c" : "#e8604c"},transparent)` }} />
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }} style={{ fontSize: "4rem", marginBottom: "1rem" }}>{won ? "🏆" : "💀"}</motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{ fontFamily: "Cinzel Decorative,serif", fontSize: isMobile ? "1.5rem" : "2.5rem", color: won ? "#c9a84c" : "#e8604c", fontWeight: 900, marginBottom: "0.5rem" }}
          >{won ? "VICTORY!" : debate?.result === "draw" ? "DRAW" : "DEFEAT"}</motion.div>
          <div style={{ fontFamily: "Inter,sans-serif", fontSize: "0.85rem", color: "#8a8070", marginBottom: "1.5rem" }}>
            vs @{opponent?.username} · {debate?.division} · {debate?.mode}
          </div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: eloChange >= 0 ? "#1a2a1a" : "#2a1a1a", border: `1px solid ${eloChange >= 0 ? "#4caf8240" : "#e8604c40"}`, borderRadius: 8, padding: "0.5rem 1.5rem" }}
          >
            <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "1.2rem", color: eloChange >= 0 ? "#4caf82" : "#e8604c", fontWeight: 700 }}>
              {eloChange >= 0 ? "+" : ""}{eloChange} ELO
            </span>
          </motion.div>
          <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
            {[
              { name: debate?.player1?.username, score: debate?.score?.player1, color: "#c9a84c" },
              { name: debate?.player2?.username, score: debate?.score?.player2, color: "#e8604c" },
            ].map((p) => (
              <div key={p.name} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "Cinzel,serif", fontSize: "2rem", color: p.color, fontWeight: 700 }}>{p.score || 0}</div>
                <div style={{ fontSize: "0.72rem", color: "#4a4540", fontFamily: "Inter,sans-serif" }}>@{p.name}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {TABS.map((tab) => (
            <motion.button key={tab.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab(tab.id)}
              style={{ padding: isMobile ? "0.5rem 0.8rem" : "0.5rem 1.2rem", borderRadius: 8, cursor: "pointer", background: activeTab === tab.id ? "linear-gradient(135deg,#c9a84c,#a07830)" : "#111", border: activeTab === tab.id ? "none" : "1px solid #2a2a2a", color: activeTab === tab.id ? "#0a0a0a" : "#8a8070", fontFamily: "Cinzel,serif", fontSize: isMobile ? "0.62rem" : "0.7rem", letterSpacing: "0.08em", fontWeight: activeTab === tab.id ? 700 : 400, display: "flex", alignItems: "center", gap: "0.4rem" }}
            >{tab.icon} {tab.label}</motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* RESULT */}
          {activeTab === "result" && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: "1.5rem" }}>
                  <div style={{ fontFamily: "Cinzel,serif", fontSize: "0.68rem", color: "#c9a84c", letterSpacing: "0.1em", marginBottom: "0.8rem" }}>DEBATE TOPIC</div>
                  <div style={{ fontFamily: "Inter,sans-serif", fontSize: "0.9rem", color: "#f5f0e8", lineHeight: 1.6 }}>"{debate?.topic}"</div>
                </div>
                <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: "1.5rem" }}>
                  <div style={{ fontFamily: "Cinzel,serif", fontSize: "0.68rem", color: "#c9a84c", letterSpacing: "0.1em", marginBottom: "0.8rem" }}>MATCH STATS</div>
                  {[
                    { label: "Division", value: debate?.division },
                    { label: "Mode", value: debate?.mode },
                    { label: "Language", value: debate?.language },
                    { label: "Total Votes", value: `${(debate?.score?.player1 || 0) + (debate?.score?.player2 || 0)}` },
                  ].map((s) => (
                    <div key={s.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.72rem", color: "#4a4540", fontFamily: "Inter,sans-serif" }}>{s.label}</span>
                      <span style={{ fontSize: "0.75rem", color: "#f5f0e8", fontFamily: "Cinzel,serif" }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
                <motion.button whileHover={{ scale: 1.04, boxShadow: "0 0 25px #c9a84c25" }} whileTap={{ scale: 0.96 }}
                  onClick={() => navigate("/matchmaking")}
                  style={{ flex: 1, minWidth: 140, padding: "0.85rem", background: "linear-gradient(135deg,#c9a84c,#a07830)", border: "none", borderRadius: 8, color: "#0a0a0a", fontFamily: "Cinzel,serif", fontSize: "0.78rem", letterSpacing: "0.12em", cursor: "pointer", fontWeight: 700 }}
                >PLAY AGAIN ⚔️</motion.button>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => navigate(`/profile/${user?.username}`)}
                  style={{ flex: 1, minWidth: 140, padding: "0.85rem", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 8, color: "#8a8070", fontFamily: "Cinzel,serif", fontSize: "0.78rem", letterSpacing: "0.12em", cursor: "pointer" }}
                >VIEW PROFILE</motion.button>
              </div>
            </motion.div>
          )}

          {/* AI JUDGE */}
          {activeTab === "verdict" && (
            <motion.div key="verdict" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {!verdict ? (
                <div style={{ textAlign: "center", padding: "3rem", background: "#111", border: "1px solid #1e1e1e", borderRadius: 12 }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚖️</div>
                  <div style={{ fontFamily: "Cinzel,serif", fontSize: "1rem", color: "#f5f0e8", marginBottom: "0.5rem" }}>Get AI Judge Verdict</div>
                  <div style={{ fontSize: "0.78rem", color: "#8a8070", fontFamily: "Inter,sans-serif", maxWidth: 360, margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
                    Gemini AI analyzes the debate and provides an independent verdict with detailed reasoning
                  </div>
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={fetchAIVerdict} disabled={aiLoading.verdict}
                    style={{ padding: "0.85rem 2.5rem", background: "linear-gradient(135deg,#c9a84c,#a07830)", border: "none", borderRadius: 8, color: "#0a0a0a", fontFamily: "Cinzel,serif", fontSize: "0.82rem", letterSpacing: "0.12em", cursor: aiLoading.verdict ? "not-allowed" : "pointer", fontWeight: 700 }}
                  >{aiLoading.verdict ? "🤖 Analyzing..." : "GET AI VERDICT"}</motion.button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ background: "#111", border: "1px solid #c9a84c25", borderRadius: 12, padding: "1.5rem", textAlign: "center" }}>
                    <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.62rem", color: "#c9a84c", letterSpacing: "0.3em", marginBottom: "0.5rem" }}>AI JUDGE VERDICT</div>
                    <div style={{ fontFamily: "Cinzel,serif", fontSize: "1.3rem", color: "#f5f0e8", fontWeight: 700, marginBottom: "0.5rem" }}>{verdict.winner}</div>
                    <div style={{ fontSize: "0.78rem", color: "#4caf82", fontFamily: "Inter,sans-serif", marginBottom: "1rem" }}>Confidence: {verdict.confidence}%</div>
                    <div style={{ fontSize: "0.85rem", color: "#8a8070", fontFamily: "Inter,sans-serif", lineHeight: 1.7, maxWidth: 500, margin: "0 auto" }}>{verdict.reasoning}</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1rem" }}>
                    {[
                      { name: debate?.player1?.username, analysis: verdict.player1Analysis, color: "#c9a84c" },
                      { name: debate?.player2?.username, analysis: verdict.player2Analysis, color: "#e8604c" },
                    ].map((p) => (
                      <div key={p.name} style={{ background: "#111", border: `1px solid ${p.color}25`, borderRadius: 12, padding: "1.2rem" }}>
                        <div style={{ fontFamily: "Cinzel,serif", fontSize: "0.75rem", color: p.color, marginBottom: "0.8rem", fontWeight: 600 }}>@{p.name} — {p.analysis?.score}/100</div>
                        <div style={{ marginBottom: "0.5rem" }}>
                          <div style={{ fontSize: "0.62rem", color: "#4caf82", fontFamily: "Inter,sans-serif", letterSpacing: "0.1em", marginBottom: "0.3rem" }}>STRENGTHS</div>
                          {p.analysis?.strengths?.map((s, i) => <div key={i} style={{ fontSize: "0.72rem", color: "#f5f0e8", fontFamily: "Inter,sans-serif", marginBottom: "0.2rem" }}>✓ {s}</div>)}
                        </div>
                        <div>
                          <div style={{ fontSize: "0.62rem", color: "#e8604c", fontFamily: "Inter,sans-serif", letterSpacing: "0.1em", marginBottom: "0.3rem" }}>IMPROVE</div>
                          {p.analysis?.weaknesses?.map((w, i) => <div key={i} style={{ fontSize: "0.72rem", color: "#8a8070", fontFamily: "Inter,sans-serif", marginBottom: "0.2rem" }}>↗ {w}</div>)}
                        </div>
                      </div>
                    ))}
                  </div>
                  {verdict.highlightMoment && (
                    <div style={{ background: "#1a1408", border: "1px solid #c9a84c20", borderRadius: 10, padding: "1rem", textAlign: "center" }}>
                      <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.6rem", color: "#c9a84c", letterSpacing: "0.2em", marginBottom: "0.4rem" }}>KEY MOMENT</div>
                      <div style={{ fontFamily: "Inter,sans-serif", fontSize: "0.82rem", color: "#f5f0e8", fontStyle: "italic" }}>"{verdict.highlightMoment}"</div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* AI COACH */}
          {activeTab === "coaching" && (
            <motion.div key="coaching" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {!coaching ? (
                <div style={{ textAlign: "center", padding: "3rem", background: "#111", border: "1px solid #1e1e1e", borderRadius: 12 }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎯</div>
                  <div style={{ fontFamily: "Cinzel,serif", fontSize: "1rem", color: "#f5f0e8", marginBottom: "0.5rem" }}>Get Personal AI Coaching</div>
                  <div style={{ fontSize: "0.78rem", color: "#8a8070", fontFamily: "Inter,sans-serif", maxWidth: 360, margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
                    Personalized post-debate feedback on your strengths and how to improve
                  </div>
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={fetchCoaching} disabled={aiLoading.coaching}
                    style={{ padding: "0.85rem 2.5rem", background: "linear-gradient(135deg,#c9a84c,#a07830)", border: "none", borderRadius: 8, color: "#0a0a0a", fontFamily: "Cinzel,serif", fontSize: "0.82rem", letterSpacing: "0.12em", cursor: aiLoading.coaching ? "not-allowed" : "pointer", fontWeight: 700 }}
                  >{aiLoading.coaching ? "🤖 Coaching..." : "GET COACHING"}</motion.button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ background: "#111", border: "1px solid #c9a84c25", borderRadius: 12, padding: "1.5rem", textAlign: "center" }}>
                    <div style={{ fontFamily: "Cinzel,serif", fontSize: "1.1rem", color: "#c9a84c", fontWeight: 700, marginBottom: "0.5rem" }}>{coaching.headline}</div>
                    <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "1.5rem", color: "#f5f0e8", fontWeight: 700 }}>{coaching.overallRating}/100</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1rem" }}>
                    <div style={{ background: "#111", border: "1px solid #4caf8225", borderRadius: 12, padding: "1.2rem" }}>
                      <div style={{ fontFamily: "Cinzel,serif", fontSize: "0.7rem", color: "#4caf82", letterSpacing: "0.1em", marginBottom: "0.8rem" }}>YOUR STRENGTHS</div>
                      {coaching.strengths?.map((s, i) => (
                        <div key={i} style={{ marginBottom: "0.7rem" }}>
                          <div style={{ fontFamily: "Cinzel,serif", fontSize: "0.75rem", color: "#f5f0e8", marginBottom: "0.2rem" }}>✓ {s.title}</div>
                          <div style={{ fontSize: "0.7rem", color: "#8a8070", fontFamily: "Inter,sans-serif" }}>{s.detail}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: "#111", border: "1px solid #f39c1225", borderRadius: 12, padding: "1.2rem" }}>
                      <div style={{ fontFamily: "Cinzel,serif", fontSize: "0.7rem", color: "#f39c12", letterSpacing: "0.1em", marginBottom: "0.8rem" }}>AREAS TO IMPROVE</div>
                      {coaching.improvements?.map((s, i) => (
                        <div key={i} style={{ marginBottom: "0.7rem" }}>
                          <div style={{ fontFamily: "Cinzel,serif", fontSize: "0.75rem", color: "#f5f0e8", marginBottom: "0.2rem" }}>↗ {s.title}</div>
                          <div style={{ fontSize: "0.7rem", color: "#8a8070", fontFamily: "Inter,sans-serif" }}>{s.detail}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {coaching.motivationalClose && (
                    <div style={{ background: "#1a1408", border: "1px solid #c9a84c20", borderRadius: 10, padding: "1.2rem", textAlign: "center" }}>
                      <div style={{ fontFamily: "Inter,sans-serif", fontSize: "0.88rem", color: "#c9a84c", fontStyle: "italic", lineHeight: 1.6 }}>"{coaching.motivationalClose}"</div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* DNA */}
          {activeTab === "dna" && (
            <motion.div key="dna" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {!dna ? (
                <div style={{ textAlign: "center", padding: "3rem", background: "#111", border: "1px solid #1e1e1e", borderRadius: 12 }}>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🧬</div>
                  <div style={{ fontFamily: "Cinzel,serif", fontSize: "1rem", color: "#f5f0e8", marginBottom: "0.5rem" }}>Analyze Your Debate DNA</div>
                  <div style={{ fontSize: "0.78rem", color: "#8a8070", fontFamily: "Inter,sans-serif", maxWidth: 360, margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
                    Discover your unique debate style across 5 dimensions
                  </div>
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={fetchDNA} disabled={aiLoading.dna}
                    style={{ padding: "0.85rem 2.5rem", background: "linear-gradient(135deg,#c9a84c,#a07830)", border: "none", borderRadius: 8, color: "#0a0a0a", fontFamily: "Cinzel,serif", fontSize: "0.82rem", letterSpacing: "0.12em", cursor: aiLoading.dna ? "not-allowed" : "pointer", fontWeight: 700 }}
                  >{aiLoading.dna ? "🧬 Analyzing..." : "ANALYZE MY DNA"}</motion.button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
                  <div style={{ background: "#111", border: "1px solid #c9a84c25", borderRadius: 12, padding: "1.5rem", textAlign: "center", width: "100%" }}>
                    <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.62rem", color: "#c9a84c", letterSpacing: "0.3em", marginBottom: "0.5rem" }}>DEBATE DNA</div>
                    <div style={{ fontFamily: "Cinzel,serif", fontSize: "1.2rem", color: "#f5f0e8", fontWeight: 700, marginBottom: "0.3rem" }}>{dna.legendTitle}</div>
                    <div style={{ fontSize: "0.78rem", color: "#8a8070", fontFamily: "Inter,sans-serif" }}>{dna.styleDescription}</div>
                  </div>
                  <RadarChart dna={dna.dna} />
                  <div style={{ width: "100%", background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, padding: "1.5rem" }}>
                    {Object.entries(dna.dna || {}).map(([key, val]) => {
                      const colors = { aggressive: "#e8604c", analytical: "#6b9fb8", emotional: "#9b7fd4", logical: "#4caf82", creative: "#c9a84c" };
                      return (
                        <div key={key} style={{ marginBottom: "0.8rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                            <span style={{ fontFamily: "Cinzel,serif", fontSize: "0.7rem", color: colors[key], textTransform: "capitalize" }}>{key}</span>
                            <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.7rem", color: colors[key] }}>{val}</span>
                          </div>
                          <div style={{ background: "#1a1a1a", borderRadius: 4, height: 6, overflow: "hidden" }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${val}%` }} transition={{ duration: 1, delay: 0.2 }}
                              style={{ height: "100%", background: colors[key], borderRadius: 4 }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {dna.evolutionTip && (
                    <div style={{ width: "100%", background: "#1a1408", border: "1px solid #c9a84c20", borderRadius: 10, padding: "1rem", textAlign: "center" }}>
                      <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.6rem", color: "#c9a84c", letterSpacing: "0.2em", marginBottom: "0.4rem" }}>EVOLUTION TIP</div>
                      <div style={{ fontFamily: "Inter,sans-serif", fontSize: "0.82rem", color: "#f5f0e8" }}>{dna.evolutionTip}</div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DebateResult;