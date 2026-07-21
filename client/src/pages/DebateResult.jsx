import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import api from "../services/api";
import toast from "react-hot-toast";
import { Trophy, Skull, Scale, Target, Dna, Swords, Sparkles, Check, TrendingUp } from "lucide-react";
import { COLORS } from "../constants/theme";

const useR = () => {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return { isMobile: w < 640 };
};

// ─── RADAR CHART — recolored to theme, structure unchanged ────────
const RadarChart = ({ dna }) => {
  if (!dna) return null;
  const traits = [
    { key: "aggressive", label: "Aggressive", color: "#ff5c7c" },
    { key: "analytical", label: "Analytical", color: "#4d8cff" },
    { key: "emotional", label: "Emotional", color: "#a06bff" },
    { key: "logical", label: "Logical", color: "#4caf82" },
    { key: "creative", label: "Creative", color: COLORS.accent2 },
  ];
  const cx = 120, cy = 120, r = 80;
  const angle = (i) => (i * 2 * Math.PI) / traits.length - Math.PI / 2;
  const points = traits.map((t, i) => ({
    x: cx + r * ((dna[t.key] || 0) / 100) * Math.cos(angle(i)),
    y: cy + r * ((dna[t.key] || 0) / 100) * Math.sin(angle(i)),
  }));
  const outerPoints = traits.map((_, i) => ({ x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) }));
  const labelPoints = traits.map((_, i) => ({ x: cx + (r + 22) * Math.cos(angle(i)), y: cy + (r + 22) * Math.sin(angle(i)) }));

  return (
    <svg width="240" height="240" style={{ margin: "0 auto", display: "block" }}>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={outerPoints.map((p) => `${cx + (p.x - cx) * f},${cy + (p.y - cy) * f}`).join(" ")} fill="none" stroke={COLORS.border} strokeWidth="1" />
      ))}
      {outerPoints.map((p, i) => <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={COLORS.border} strokeWidth="1" />)}
      <motion.polygon
        initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}
        points={points.map((p) => `${p.x},${p.y}`).join(" ")}
        fill={`${COLORS.accent2}20`} stroke={COLORS.accent2} strokeWidth="2"
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      {traits.map((t, i) => (
        <text key={t.key} x={labelPoints[i].x} y={labelPoints[i].y} textAnchor="middle" dominantBaseline="middle"
          style={{ fontFamily: "Inter,sans-serif", fontSize: "8px", fill: t.color, fontWeight: 600 }}
        >{t.label}</text>
      ))}
      <circle cx={cx} cy={cy} r="3" fill={COLORS.accent2} />
    </svg>
  );
};

// ─── AI UNLOCK PANEL — the empty/CTA state shared by all 3 AI tabs ──
const AIUnlockPanel = ({ icon: Icon, title, description, onGenerate, loadingLabel, isLoading }) => (
  <div style={{ textAlign: "center", padding: "3rem 1.5rem", borderTop: `1px solid ${COLORS.border}` }}>
    <Icon size={36} color={COLORS.textFaint} strokeWidth={1.5} style={{ marginBottom: "1rem" }} />
    <div style={{ fontFamily: "Inter,sans-serif", fontSize: "1.05rem", fontWeight: 700, color: COLORS.text, marginBottom: "0.5rem" }}>{title}</div>
    <div style={{ fontSize: "0.8rem", color: COLORS.textDim, maxWidth: 360, margin: "0 auto 1.5rem", lineHeight: 1.6 }}>{description}</div>
    <motion.button data-cursor="hover" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
      onClick={onGenerate} disabled={isLoading}
      style={{
        padding: "0.85rem 2.2rem", background: `linear-gradient(135deg,${COLORS.accent},#5a3fd6)`,
        border: "none", borderRadius: 8, color: "#fff", fontFamily: "Inter,sans-serif",
        fontSize: "0.85rem", fontWeight: 700, cursor: isLoading ? "not-allowed" : "pointer",
      }}
    >{isLoading ? loadingLabel : "Generate"}</motion.button>
  </div>
);

const DebateResult = () => {
  const { debateId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { isMobile } = useR();

  const [debate, setDebate] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [coaching, setCoaching] = useState(null);
  const [dna, setDna] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("result");
  const [aiLoading, setAiLoading] = useState({ verdict: false, coaching: false, dna: false });

  const myRole = debate?.player1?._id?.toString() === user?._id?.toString() ? "player1" : "player2";
  const won = debate?.winner?._id?.toString() === user?._id?.toString() || debate?.winner?.toString() === user?._id?.toString();
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

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fetchAIVerdict = async () => {
    setAiLoading((p) => ({ ...p, verdict: true }));
    try { const res = await api.get(`/ai/judge/${debateId}`); setVerdict(res.data.data); toast.success("AI Judge verdict ready!"); }
    catch { toast.error("AI Judge unavailable"); }
    finally { setAiLoading((p) => ({ ...p, verdict: false })); }
  };
  const fetchCoaching = async () => {
    setAiLoading((p) => ({ ...p, coaching: true }));
    try { const res = await api.get(`/ai/coach/${debateId}`); setCoaching(res.data.data); toast.success("AI Coach feedback ready!"); }
    catch { toast.error("AI Coach unavailable"); }
    finally { setAiLoading((p) => ({ ...p, coaching: false })); }
  };
  const fetchDNA = async () => {
    setAiLoading((p) => ({ ...p, dna: true }));
    try { const res = await api.get(`/ai/dna/${user?._id}`); setDna(res.data.data); toast.success("Debate DNA analyzed!"); }
    catch { toast.error("DNA analysis unavailable"); }
    finally { setAiLoading((p) => ({ ...p, dna: false })); }
  };

  const TABS = [
    { id: "result", label: "Result", icon: Trophy },
    { id: "verdict", label: "AI Judge", icon: Scale },
    { id: "coaching", label: "AI Coach", icon: Target },
    { id: "dna", label: "Debate DNA", icon: Dna },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "JetBrains Mono,monospace", color: COLORS.textFaint, letterSpacing: "0.2em", fontSize: "0.75rem" }}>LOADING RESULTS...</div>
      </div>
    );
  }

  const resultColor = won ? "#4caf82" : debate?.result === "draw" ? COLORS.textFaint : "#ff5c7c";

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", fontFamily: "Inter, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: isMobile ? "2rem 1.2rem" : "3rem 2rem" }}>

        {/* Result hero — editorial headline, not a bordered card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} style={{ marginBottom: "1rem" }}>
            {won ? <Trophy size={48} color={resultColor} strokeWidth={1.5} style={{ margin: "0 auto" }} /> : <Skull size={48} color={resultColor} strokeWidth={1.5} style={{ margin: "0 auto" }} />}
          </motion.div>
          <div style={{ fontFamily: "Inter,sans-serif", fontSize: isMobile ? "2rem" : "2.8rem", fontWeight: 800, color: resultColor, marginBottom: "0.4rem" }}>
            {won ? "Victory" : debate?.result === "draw" ? "Draw" : "Defeat"}
          </div>
          <div style={{ fontSize: "0.85rem", color: COLORS.textFaint, marginBottom: "1.2rem" }}>
            vs @{opponent?.username} · {debate?.division} · {debate?.mode}
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.4rem",
            fontFamily: "JetBrains Mono,monospace", fontSize: "1.1rem", fontWeight: 700,
            color: eloChange >= 0 ? "#4caf82" : "#ff5c7c",
          }}><TrendingUp size={16} /> {eloChange >= 0 ? "+" : ""}{eloChange} ELO</div>

          <div style={{ display: "flex", justifyContent: "center", gap: "3rem", marginTop: "1.8rem" }}>
            {[
              { name: debate?.player1?.username, score: debate?.score?.player1, color: COLORS.accent2 },
              { name: debate?.player2?.username, score: debate?.score?.player2, color: "#ff5c7c" },
            ].map((p) => (
              <div key={p.name} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "Inter,sans-serif", fontSize: "2rem", fontWeight: 800, color: p.color }}>{p.score || 0}</div>
                <div style={{ fontSize: "0.72rem", color: COLORS.textFaint }}>@{p.name}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tabs — underline style, consistent with the rest of V2 */}
        <div style={{ display: "flex", gap: isMobile ? "1rem" : "1.8rem", borderBottom: `1px solid ${COLORS.border}`, marginBottom: "0.5rem", overflowX: "auto" }}>
          {TABS.map((tab) => (
            <button key={tab.id} data-cursor="hover" onClick={() => setActiveTab(tab.id)} style={{
              background: "transparent", border: "none", cursor: "pointer", padding: "0.7rem 0",
              display: "flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap",
              fontFamily: "Inter, sans-serif", fontSize: "0.82rem", fontWeight: 600,
              color: activeTab === tab.id ? COLORS.text : COLORS.textFaint,
              borderBottom: activeTab === tab.id ? `2px solid ${COLORS.accent2}` : "2px solid transparent", marginBottom: -1,
            }}><tab.icon size={14} /> {tab.label}</button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* RESULT TAB */}
          {activeTab === "result" && (
            <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div style={{ padding: "1.5rem 0", borderTop: `1px solid ${COLORS.border}` }}>
                <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.62rem", color: COLORS.accent2, letterSpacing: "0.15em", marginBottom: "0.6rem" }}>DEBATE TOPIC</div>
                <div style={{ fontFamily: "Inter,sans-serif", fontSize: "0.95rem", color: COLORS.text, lineHeight: 1.6, fontStyle: "italic" }}>"{debate?.topic}"</div>
              </div>
              {[
                { label: "Division", value: debate?.division },
                { label: "Mode", value: debate?.mode },
                { label: "Language", value: debate?.language },
                { label: "Total Votes", value: `${(debate?.score?.player1 || 0) + (debate?.score?.player2 || 0)}` },
              ].map((s) => (
                <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.7rem 0", borderTop: `1px solid ${COLORS.border}` }}>
                  <span style={{ fontSize: "0.8rem", color: COLORS.textFaint }}>{s.label}</span>
                  <span style={{ fontSize: "0.85rem", color: COLORS.text, fontWeight: 600 }}>{s.value}</span>
                </div>
              ))}
              <div style={{ display: "flex", gap: "0.8rem", marginTop: "2rem" }}>
                <motion.button data-cursor="hover" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/matchmaking")}
                  style={{ flex: 1, padding: "0.9rem", background: `linear-gradient(135deg,${COLORS.accent},#5a3fd6)`, border: "none", borderRadius: 8, color: "#fff", fontFamily: "Inter,sans-serif", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                ><Swords size={15} /> Play Again</motion.button>
                <motion.button data-cursor="hover" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/profile/${user?.username}`)}
                  style={{ flex: 1, padding: "0.9rem", background: "transparent", border: `1px solid ${COLORS.borderStrong}`, borderRadius: 8, color: COLORS.textDim, fontFamily: "Inter,sans-serif", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}
                >View Profile</motion.button>
              </div>
            </motion.div>
          )}

          {/* AI JUDGE TAB */}
          {activeTab === "verdict" && (
            <motion.div key="verdict" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {!verdict ? (
                <AIUnlockPanel icon={Scale} title="Get AI Judge Verdict" description="Gemini AI analyzes the debate and provides an independent verdict with detailed reasoning." onGenerate={fetchAIVerdict} isLoading={aiLoading.verdict} loadingLabel="Analyzing..." />
              ) : (
                <div>
                  <div style={{ padding: "1.5rem 0", borderTop: `1px solid ${COLORS.border}`, textAlign: "center" }}>
                    <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.6rem", color: COLORS.accent2, letterSpacing: "0.25em", marginBottom: "0.5rem" }}>VERDICT</div>
                    <div style={{ fontFamily: "Inter,sans-serif", fontSize: "1.4rem", fontWeight: 800, color: COLORS.text, marginBottom: "0.4rem" }}>{verdict.winner}</div>
                    <div style={{ fontSize: "0.78rem", color: "#4caf82", marginBottom: "1rem" }}>Confidence: {verdict.confidence}%</div>
                    <div style={{ fontSize: "0.85rem", color: COLORS.textDim, lineHeight: 1.7, maxWidth: 500, margin: "0 auto" }}>{verdict.reasoning}</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1.5rem", padding: "1.5rem 0", borderTop: `1px solid ${COLORS.border}` }}>
                    {[
                      { name: debate?.player1?.username, analysis: verdict.player1Analysis, color: COLORS.accent2 },
                      { name: debate?.player2?.username, analysis: verdict.player2Analysis, color: "#ff5c7c" },
                    ].map((p) => (
                      <div key={p.name}>
                        <div style={{ fontFamily: "Inter,sans-serif", fontSize: "0.85rem", color: p.color, marginBottom: "0.8rem", fontWeight: 700 }}>@{p.name} — {p.analysis?.score}/100</div>
                        <div style={{ fontSize: "0.65rem", color: "#4caf82", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>STRENGTHS</div>
                        {p.analysis?.strengths?.map((s, i) => (
                          <div key={i} style={{ fontSize: "0.78rem", color: COLORS.textDim, marginBottom: "0.3rem", display: "flex", alignItems: "flex-start", gap: "0.4rem" }}>
                            <Check size={12} color="#4caf82" style={{ marginTop: 2, flexShrink: 0 }} /> {s}
                          </div>
                        ))}
                        <div style={{ fontSize: "0.65rem", color: "#ffb454", letterSpacing: "0.1em", margin: "0.6rem 0 0.4rem" }}>IMPROVE</div>
                        {p.analysis?.weaknesses?.map((w, i) => (
                          <div key={i} style={{ fontSize: "0.78rem", color: COLORS.textDim, marginBottom: "0.3rem" }}>↗ {w}</div>
                        ))}
                      </div>
                    ))}
                  </div>
                  {verdict.highlightMoment && (
                    <div style={{ padding: "1.2rem 0", borderTop: `1px solid ${COLORS.border}`, textAlign: "center" }}>
                      <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.6rem", color: COLORS.accent2, letterSpacing: "0.2em", marginBottom: "0.4rem" }}>KEY MOMENT</div>
                      <div style={{ fontSize: "0.85rem", color: COLORS.text, fontStyle: "italic" }}>"{verdict.highlightMoment}"</div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* AI COACH TAB */}
          {activeTab === "coaching" && (
            <motion.div key="coaching" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {!coaching ? (
                <AIUnlockPanel icon={Target} title="Get Personal AI Coaching" description="Personalized post-debate feedback on your strengths and how to improve." onGenerate={fetchCoaching} isLoading={aiLoading.coaching} loadingLabel="Coaching..." />
              ) : (
                <div>
                  <div style={{ padding: "1.5rem 0", borderTop: `1px solid ${COLORS.border}`, textAlign: "center" }}>
                    <div style={{ fontFamily: "Inter,sans-serif", fontSize: "1.1rem", fontWeight: 700, color: COLORS.accent2, marginBottom: "0.4rem" }}>{coaching.headline}</div>
                    <div style={{ fontFamily: "Inter,sans-serif", fontSize: "1.6rem", fontWeight: 800, color: COLORS.text }}>{coaching.overallRating}/100</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1.5rem", padding: "1.5rem 0", borderTop: `1px solid ${COLORS.border}` }}>
                    <div>
                      <div style={{ fontSize: "0.65rem", color: "#4caf82", letterSpacing: "0.12em", marginBottom: "0.8rem" }}>YOUR STRENGTHS</div>
                      {coaching.strengths?.map((s, i) => (
                        <div key={i} style={{ marginBottom: "0.8rem" }}>
                          <div style={{ fontFamily: "Inter,sans-serif", fontSize: "0.82rem", color: COLORS.text, fontWeight: 600, marginBottom: "0.2rem" }}>{s.title}</div>
                          <div style={{ fontSize: "0.75rem", color: COLORS.textFaint }}>{s.detail}</div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div style={{ fontSize: "0.65rem", color: "#ffb454", letterSpacing: "0.12em", marginBottom: "0.8rem" }}>AREAS TO IMPROVE</div>
                      {coaching.improvements?.map((s, i) => (
                        <div key={i} style={{ marginBottom: "0.8rem" }}>
                          <div style={{ fontFamily: "Inter,sans-serif", fontSize: "0.82rem", color: COLORS.text, fontWeight: 600, marginBottom: "0.2rem" }}>{s.title}</div>
                          <div style={{ fontSize: "0.75rem", color: COLORS.textFaint }}>{s.detail}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {coaching.motivationalClose && (
                    <div style={{ padding: "1.2rem 0", borderTop: `1px solid ${COLORS.border}`, textAlign: "center" }}>
                      <div style={{ fontSize: "0.9rem", color: COLORS.accent2, fontStyle: "italic", lineHeight: 1.6 }}>"{coaching.motivationalClose}"</div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* DNA TAB */}
          {activeTab === "dna" && (
            <motion.div key="dna" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {!dna ? (
                <AIUnlockPanel icon={Dna} title="Analyze Your Debate DNA" description="Discover your unique debate style across 5 dimensions." onGenerate={fetchDNA} isLoading={aiLoading.dna} loadingLabel="Analyzing..." />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ padding: "1.5rem 0", borderTop: `1px solid ${COLORS.border}`, textAlign: "center", width: "100%" }}>
                    <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.6rem", color: COLORS.accent2, letterSpacing: "0.25em", marginBottom: "0.5rem" }}>DEBATE DNA</div>
                    <div style={{ fontFamily: "Inter,sans-serif", fontSize: "1.2rem", fontWeight: 800, color: COLORS.text, marginBottom: "0.3rem" }}>{dna.legendTitle}</div>
                    <div style={{ fontSize: "0.8rem", color: COLORS.textFaint }}>{dna.styleDescription}</div>
                  </div>
                  <RadarChart dna={dna.dna} />
                  <div style={{ width: "100%", paddingTop: "1rem" }}>
                    {Object.entries(dna.dna || {}).map(([key, val]) => {
                      const colors = { aggressive: "#ff5c7c", analytical: "#4d8cff", emotional: "#a06bff", logical: "#4caf82", creative: COLORS.accent2 };
                      return (
                        <div key={key} style={{ marginBottom: "0.9rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                            <span style={{ fontFamily: "Inter,sans-serif", fontSize: "0.78rem", color: colors[key], textTransform: "capitalize", fontWeight: 600 }}>{key}</span>
                            <span style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.75rem", color: colors[key] }}>{val}</span>
                          </div>
                          <div style={{ background: COLORS.border, borderRadius: 4, height: 5, overflow: "hidden" }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${val}%` }} transition={{ duration: 1, delay: 0.2 }} style={{ height: "100%", background: colors[key], borderRadius: 4 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {dna.evolutionTip && (
                    <div style={{ width: "100%", paddingTop: "1.2rem", borderTop: `1px solid ${COLORS.border}`, textAlign: "center" }}>
                      <div style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.6rem", color: COLORS.accent2, letterSpacing: "0.2em", marginBottom: "0.4rem" }}>EVOLUTION TIP</div>
                      <div style={{ fontSize: "0.85rem", color: COLORS.text }}>{dna.evolutionTip}</div>
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