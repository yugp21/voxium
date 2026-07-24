import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "../redux/slices/authSlice";
import api from "../services/api";
import toast from "react-hot-toast";
import { Swords, FlaskConical, Heart, Brain, Sparkles, ArrowRight, Check } from "lucide-react";
import { COLORS } from "../constants/theme";

const COUNTRIES = ["India","United States","United Kingdom","Canada","Australia","Germany","France","Japan","Brazil","South Africa","Singapore","UAE","Pakistan","Bangladesh","Nigeria","Kenya","Philippines","Indonesia","Malaysia","Other"];
const LANGUAGES = ["English","Hindi","Spanish","French","Arabic","Portuguese","German","Japanese","Mandarin","Bengali","Urdu","Tamil","Telugu","Gujarati","Marathi","Punjabi","Kannada","Malayalam","Odia","Assamese","Other"];
const STYLES = [
  { id: "Aggressive", icon: Swords, desc: "Attack hard, dominate fast" },
  { id: "Analytical", icon: FlaskConical, desc: "Logic, data, precision" },
  { id: "Emotional", icon: Heart, desc: "Connect, inspire, move" },
  { id: "Logical", icon: Brain, desc: "Structure, clarity, reason" },
  { id: "Creative", icon: Sparkles, desc: "Unexpected angles, big ideas" },
];

const StepDots = ({ current, total }) => (
  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginBottom: "2.2rem" }}>
    {Array.from({ length: total }).map((_, i) => (
      <motion.div key={i} animate={{ width: i === current ? 24 : 8, background: i <= current ? COLORS.accent2 : COLORS.border }} style={{ height: 4, borderRadius: 4 }} transition={{ duration: 0.3 }} />
    ))}
  </div>
);

const underlineInput = {
  width: "100%", padding: "0.6rem 0", background: "transparent", border: "none",
  borderBottom: `1px solid ${COLORS.borderStrong}`, color: COLORS.text,
  fontFamily: "Inter,sans-serif", fontSize: "0.9rem", outline: "none",
};

const Onboarding = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ country: "", state: "", district: "", languages: [], playingStyle: "", bio: "" });

  const toggleLanguage = (lang) => {
    setForm(f => ({ ...f, languages: f.languages.includes(lang) ? f.languages.filter(l => l !== lang) : [...f.languages, lang] }));
  };

  const handleFinish = async () => {
    if (!form.country) return toast.error("Please select your country");
    if (form.languages.length === 0) return toast.error("Select at least one language");
    if (!form.playingStyle) return toast.error("Choose your debate style");
    setLoading(true);
    try {
      const res = await api.put("/users/profile/onboarding", form);
      dispatch(setUser(res.data.data));
      toast.success("Welcome to the arena, " + (user?.name || "Legend") + "!");
      navigate("/dashboard");
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const isMobile = window.innerWidth < 640;
  const STEPS = ["Location", "Style", "Summary"];

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", fontFamily: "Inter, -apple-system, sans-serif" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <h1 style={{ fontFamily: "Inter, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: COLORS.text, marginBottom: "0.3rem" }}>{STEPS[step]}</h1>
          <p style={{ color: COLORS.textFaint, fontSize: "0.82rem" }}>Step {step + 1} of 3 — building your arena identity</p>
        </div>

        <StepDots current={step} total={3} />

        <AnimatePresence mode="wait">
          {/* STEP 0 — LOCATION */}
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: COLORS.textFaint, letterSpacing: "0.14em", marginBottom: "0.7rem" }}>COUNTRY</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.5rem", marginBottom: "1.2rem" }}>
                {COUNTRIES.map(c => (
                  <motion.button key={c} data-cursor="hover" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setForm({ ...form, country: c })}
                    style={{
                      padding: "0.6rem 0.4rem", borderRadius: 8, cursor: "pointer",
                      background: form.country === c ? `${COLORS.accent2}12` : "transparent",
                      border: form.country === c ? `1px solid ${COLORS.accent2}` : `1px solid ${COLORS.border}`,
                      color: form.country === c ? COLORS.accent2 : COLORS.textFaint,
                      fontFamily: "Inter, sans-serif", fontSize: "0.7rem", fontWeight: form.country === c ? 700 : 400,
                    }}
                  >{c}</motion.button>
                ))}
              </div>
              <div style={{ display: "flex", gap: "1.2rem", marginBottom: "1.5rem" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: COLORS.textFaint, letterSpacing: "0.12em", marginBottom: "0.5rem" }}>STATE (OPTIONAL)</div>
                  <input style={underlineInput} value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="Province" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: COLORS.textFaint, letterSpacing: "0.12em", marginBottom: "0.5rem" }}>DISTRICT</div>
                  <input style={underlineInput} value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} placeholder="City" />
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={() => { if (!form.country) return toast.error("Please select your country"); setStep(1); }}
                style={{ width: "100%", padding: "0.9rem", background: `linear-gradient(135deg,${COLORS.accent},#5a3fd6)`, border: "none", borderRadius: 8, color: "#fff", fontFamily: "Inter,sans-serif", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
              >Continue <ArrowRight size={15} /></motion.button>
            </motion.div>
          )}

          {/* STEP 1 — STYLE */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: COLORS.textFaint, letterSpacing: "0.14em", marginBottom: "0.7rem" }}>LANGUAGES</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
                {LANGUAGES.map(l => {
                  const active = form.languages.includes(l);
                  return (
                    <button key={l} data-cursor="hover" onClick={() => toggleLanguage(l)} style={{
                      padding: "0.35rem 0.9rem", borderRadius: 20, cursor: "pointer",
                      border: active ? `1px solid ${COLORS.accent2}` : `1px solid ${COLORS.border}`,
                      background: active ? `${COLORS.accent2}12` : "transparent",
                      color: active ? COLORS.accent2 : COLORS.textFaint, fontFamily: "Inter,sans-serif", fontSize: "0.75rem",
                    }}>{l}</button>
                  );
                })}
              </div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: COLORS.textFaint, letterSpacing: "0.14em", marginBottom: "0.7rem" }}>DEBATE STYLE</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
                {STYLES.map(s => {
                  const active = form.playingStyle === s.id;
                  return (
                    <motion.button key={s.id} data-cursor="hover" whileHover={{ x: 3 }}
                      onClick={() => setForm({ ...form, playingStyle: s.id })}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.9rem", padding: "0.8rem",
                        borderRadius: 10, cursor: "pointer", textAlign: "left",
                        border: active ? `1px solid ${COLORS.accent2}` : `1px solid ${COLORS.border}`,
                        background: active ? `${COLORS.accent2}0a` : "transparent",
                      }}
                    >
                      <s.icon size={20} color={active ? COLORS.accent2 : COLORS.textFaint} strokeWidth={1.75} />
                      <div>
                        <div style={{ fontFamily: "Inter,sans-serif", fontSize: "0.85rem", fontWeight: 700, color: active ? COLORS.accent2 : COLORS.text }}>{s.id}</div>
                        <div style={{ fontSize: "0.72rem", color: COLORS.textFaint }}>{s.desc}</div>
                      </div>
                      {active && <Check size={16} color={COLORS.accent2} style={{ marginLeft: "auto" }} />}
                    </motion.button>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: "0.8rem" }}>
                <button onClick={() => setStep(0)} style={{ flex: 1, padding: "0.9rem", background: "transparent", border: `1px solid ${COLORS.borderStrong}`, borderRadius: 8, color: COLORS.textDim, fontFamily: "Inter,sans-serif", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>Back</button>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (form.languages.length === 0) return toast.error("Select at least one language");
                    if (!form.playingStyle) return toast.error("Choose your debate style");
                    setStep(2);
                  }}
                  style={{ flex: 2, padding: "0.9rem", background: `linear-gradient(135deg,${COLORS.accent},#5a3fd6)`, border: "none", borderRadius: 8, color: "#fff", fontFamily: "Inter,sans-serif", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                >Continue <ArrowRight size={15} /></motion.button>
              </div>
            </motion.div>
          )}

          {/* STEP 2 — BIO + SUMMARY */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: COLORS.textFaint, letterSpacing: "0.14em", marginBottom: "0.5rem" }}>YOUR BIO (OPTIONAL)</div>
              <textarea
                value={form.bio} maxLength={200} onChange={e => setForm({ ...form, bio: e.target.value })}
                placeholder="Tell the arena who you are..."
                style={{ ...underlineInput, resize: "vertical", minHeight: 60, marginBottom: "1.5rem" }}
              />

              <div style={{ padding: "1rem 0", borderTop: `1px solid ${COLORS.border}`, marginBottom: "1.5rem" }}>
                {[
                  { label: "Country", value: form.country },
                  { label: "State/District", value: [form.state, form.district].filter(Boolean).join(", ") || "—" },
                  { label: "Languages", value: form.languages.join(", ") },
                  { label: "Style", value: form.playingStyle },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0" }}>
                    <span style={{ fontSize: "0.78rem", color: COLORS.textFaint }}>{item.label}</span>
                    <span style={{ fontSize: "0.82rem", color: COLORS.text, fontWeight: 600, textAlign: "right" }}>{item.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "0.8rem" }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: "0.9rem", background: "transparent", border: `1px solid ${COLORS.borderStrong}`, borderRadius: 8, color: COLORS.textDim, fontFamily: "Inter,sans-serif", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>Back</button>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleFinish} disabled={loading}
                  style={{ flex: 2, padding: "0.9rem", background: loading ? COLORS.borderStrong : `linear-gradient(135deg,${COLORS.accent},#5a3fd6)`, border: "none", borderRadius: 8, color: "#fff", fontFamily: "Inter,sans-serif", fontSize: "0.82rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}
                >{loading ? "Entering..." : "Enter The Arena"}</motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Onboarding;