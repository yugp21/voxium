import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "../redux/slices/authSlice";
import api from "../services/api";
import toast from "react-hot-toast";
 
const COUNTRIES = ["India","United States","United Kingdom","Canada","Australia","Germany","France","Japan","Brazil","South Africa","Singapore","UAE","Pakistan","Bangladesh","Nigeria","Kenya","Philippines","Indonesia","Malaysia","Other"];
const LANGUAGES = ["English","Hindi","Spanish","French","Arabic","Portuguese","German","Japanese","Mandarin","Bengali","Urdu","Tamil","Telugu","Gujarati","Marathi","Punjabi","Kannada","Malayalam","Odia","Assamese","Other"];
const STYLES = [
  { id: "Aggressive", icon: "⚔️", desc: "Attack hard, dominate fast" },
  { id: "Analytical", icon: "🔬", desc: "Logic, data, precision" },
  { id: "Emotional", icon: "❤️", desc: "Connect, inspire, move" },
  { id: "Logical", icon: "🧠", desc: "Structure, clarity, reason" },
  { id: "Creative", icon: "✨", desc: "Unexpected angles, big ideas" },
];
 
const StepDot = ({ current, total }) => (
  <div style={{ display:"flex", gap:"0.5rem", justifyContent:"center", marginBottom:"2rem" }}>
    {Array.from({length:total}).map((_,i) => (
      <motion.div key={i}
        animate={{ width: i===current ? 24 : 8, background: i<=current ? "#c9a84c" : "#2a2a2a" }}
        style={{ height:8, borderRadius:4 }}
        transition={{ duration:0.3 }}
      />
    ))}
  </div>
);
 
const Onboarding = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    country: "", state: "", district: "", languages: [], playingStyle: "", bio: "",
  });
 
  const toggleLanguage = (lang) => {
    setForm(f => ({
      ...f,
      languages: f.languages.includes(lang)
        ? f.languages.filter(l => l !== lang)
        : [...f.languages, lang],
    }));
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
 
  return (
    <div style={{
      minHeight:"100vh", background:"#0a0a0a",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:"1.5rem", position:"relative", overflow:"hidden",
    }}>
      <div style={{
        position:"fixed", inset:0, pointerEvents:"none",
        backgroundImage:`linear-gradient(#c9a84c04 1px,transparent 1px),linear-gradient(90deg,#c9a84c04 1px,transparent 1px)`,
        backgroundSize:"60px 60px",
      }}/>
      <div style={{
        position:"fixed", top:"20%", left:"50%", transform:"translateX(-50%)",
        width:600, height:600,
        background:"radial-gradient(circle,#c9a84c07 0%,transparent 70%)",
        pointerEvents:"none",
      }}/>
 
      <motion.div
        initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.6 }}
        style={{
          width:"100%", maxWidth:520,
          background:"#111", border:"1px solid #2a2a2a",
          borderRadius:16, padding:"clamp(1.5rem,5vw,2.5rem)",
          position:"relative", zIndex:1,
        }}
      >
        <div style={{
          position:"absolute", top:0, left:"10%", right:"10%", height:1,
          background:"linear-gradient(90deg,transparent,#c9a84c,transparent)",
        }}/>
 
        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:"1.5rem" }}>
          <div style={{
            fontFamily:"Cinzel Decorative, serif", fontSize:"1rem",
            color:"#c9a84c", letterSpacing:"0.2em", marginBottom:"1rem",
          }}>VOXIUM</div>
          <h1 style={{
            fontFamily:"Cinzel, serif", fontSize:"clamp(1.1rem,4vw,1.4rem)",
            color:"#f5f0e8", fontWeight:700, marginBottom:"0.4rem",
          }}>
            {step===0 && "Where Are You From?"}
            {step===1 && "What Languages Do You Speak?"}
            {step===2 && "Choose Your Fighting Style"}
            {step===3 && "Tell the Arena About Yourself"}
          </h1>
          <p style={{ color:"#8a8070", fontSize:"0.78rem", fontFamily:"Inter, sans-serif" }}>
            Step {step+1} of 4
          </p>
        </div>
 
        <StepDot current={step} total={4} />
 
        <AnimatePresence mode="wait">
 
          {/* STEP 0 — Country */}
          {step===0 && (
            <motion.div key="s0"
              initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}}
              transition={{duration:0.3}}
            >
              <div style={{
                display:"grid",
                gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr",
                gap:"0.6rem", maxHeight:320, overflowY:"auto",
                paddingRight:"0.3rem",
              }}>
                {COUNTRIES.map(c => (
                  <motion.button key={c}
                    whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                    onClick={() => setForm({...form, country:c})}
                    style={{
                      padding:"0.65rem 0.5rem", borderRadius:8, cursor:"pointer",
                      background: form.country===c ? "linear-gradient(135deg,#c9a84c,#a07830)" : "#0d0d0d",
                      border: form.country===c ? "1px solid #c9a84c" : "1px solid #2a2a2a",
                      color: form.country===c ? "#0a0a0a" : "#8a8070",
                      fontFamily:"Inter, sans-serif", fontSize:"0.75rem",
                      fontWeight: form.country===c ? 600 : 400,
                      transition:"all 0.2s",
                    }}
                  >{c}</motion.button>
                ))}
              </div>

              {/* State/district — free text since regions vary by country;
                  optional, so it doesn't block anyone who'd rather skip it */}
              <div style={{ display:"flex", gap:"0.6rem", marginTop:"0.8rem" }}>
                <input
                  value={form.state}
                  onChange={e => setForm({...form, state:e.target.value})}
                  placeholder="State / Province (optional)"
                  style={{
                    flex:1, padding:"0.65rem 0.8rem", background:"#0d0d0d",
                    border:"1px solid #2a2a2a", borderRadius:8, color:"#f5f0e8",
                    fontFamily:"Inter, sans-serif", fontSize:"0.78rem", outline:"none",
                  }}
                />
                <input
                  value={form.district}
                  onChange={e => setForm({...form, district:e.target.value})}
                  placeholder="District / City (optional)"
                  style={{
                    flex:1, padding:"0.65rem 0.8rem", background:"#0d0d0d",
                    border:"1px solid #2a2a2a", borderRadius:8, color:"#f5f0e8",
                    fontFamily:"Inter, sans-serif", fontSize:"0.78rem", outline:"none",
                  }}
                />
              </div>
            </motion.div>
          )}
 
          {/* STEP 1 — Languages */}
          {step===1 && (
            <motion.div key="s1"
              initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}}
              transition={{duration:0.3}}
            >
              <p style={{ color:"#4a4540", fontSize:"0.72rem", fontFamily:"Inter, sans-serif", marginBottom:"1rem", textAlign:"center" }}>
                Select all that apply
              </p>
              <div style={{
                display:"grid",
                gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr",
                gap:"0.6rem",
              }}>
                {LANGUAGES.map(l => {
                  const selected = form.languages.includes(l);
                  return (
                    <motion.button key={l}
                      whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                      onClick={() => toggleLanguage(l)}
                      style={{
                        padding:"0.65rem 0.5rem", borderRadius:8, cursor:"pointer",
                        background: selected ? "linear-gradient(135deg,#c9a84c,#a07830)" : "#0d0d0d",
                        border: selected ? "1px solid #c9a84c" : "1px solid #2a2a2a",
                        color: selected ? "#0a0a0a" : "#8a8070",
                        fontFamily:"Inter, sans-serif", fontSize:"0.75rem",
                        fontWeight: selected ? 600 : 400,
                        transition:"all 0.2s",
                      }}
                    >{l}</motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
 
          {/* STEP 2 — Style */}
          {step===2 && (
            <motion.div key="s2"
              initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}}
              transition={{duration:0.3}}
            >
              <div style={{ display:"flex", flexDirection:"column", gap:"0.7rem" }}>
                {STYLES.map(s => {
                  const selected = form.playingStyle===s.id;
                  return (
                    <motion.button key={s.id}
                      whileHover={{scale:1.02, x:4}} whileTap={{scale:0.98}}
                      onClick={() => setForm({...form, playingStyle:s.id})}
                      style={{
                        display:"flex", alignItems:"center", gap:"1rem",
                        padding:"1rem 1.2rem", borderRadius:10, cursor:"pointer",
                        background: selected ? "#1a1408" : "#0d0d0d",
                        border: selected ? "1px solid #c9a84c" : "1px solid #2a2a2a",
                        transition:"all 0.2s", textAlign:"left",
                      }}
                    >
                      <span style={{ fontSize:"1.5rem" }}>{s.icon}</span>
                      <div>
                        <div style={{
                          fontFamily:"Cinzel, serif", fontSize:"0.85rem",
                          color: selected ? "#c9a84c" : "#f5f0e8",
                          fontWeight:600, marginBottom:"0.2rem",
                        }}>{s.id}</div>
                        <div style={{ fontSize:"0.72rem", color:"#8a8070", fontFamily:"Inter, sans-serif" }}>
                          {s.desc}
                        </div>
                      </div>
                      {selected && (
                        <div style={{ marginLeft:"auto", color:"#c9a84c", fontSize:"0.8rem" }}>✓</div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
 
          {/* STEP 3 — Bio */}
          {step===3 && (
            <motion.div key="s3"
              initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}}
              transition={{duration:0.3}}
            >
              <label style={{
                display:"block", fontFamily:"Cinzel, serif",
                fontSize:"0.65rem", color:"#8a8070",
                letterSpacing:"0.12em", marginBottom:"0.5rem",
              }}>YOUR BIO (OPTIONAL)</label>
              <textarea
                value={form.bio}
                onChange={e => setForm({...form, bio:e.target.value})}
                placeholder="Tell the arena who you are. What drives you? What do you fight for?"
                maxLength={200}
                rows={5}
                style={{
                  width:"100%", padding:"0.85rem 1rem",
                  background:"#0d0d0d", border:"1px solid #2a2a2a",
                  borderRadius:8, color:"#f5f0e8",
                  fontFamily:"Inter, sans-serif", fontSize:"0.85rem",
                  outline:"none", resize:"none", lineHeight:1.7,
                  transition:"border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor="#c9a84c50"}
                onBlur={e => e.target.style.borderColor="#2a2a2a"}
              />
              <div style={{
                textAlign:"right", fontSize:"0.68rem",
                color:"#4a4540", marginTop:"0.3rem", fontFamily:"Inter, sans-serif",
              }}>{form.bio.length}/200</div>
 
              {/* Summary */}
              <div style={{
                background:"#0d0d0d", border:"1px solid #1a1a1a",
                borderRadius:10, padding:"1rem", marginTop:"1rem",
              }}>
                <div style={{
                  fontFamily:"Cinzel, serif", fontSize:"0.68rem",
                  color:"#c9a84c", letterSpacing:"0.1em", marginBottom:"0.8rem",
                }}>YOUR LEGEND PROFILE</div>
                {[
                  { label:"Country", value:form.country },
                  { label:"State/District", value:[form.state, form.district].filter(Boolean).join(", ") || "—" },
                  { label:"Languages", value:form.languages.join(", ") },
                  { label:"Style", value:form.playingStyle },
                ].map(item => (
                  <div key={item.label} style={{
                    display:"flex", justifyContent:"space-between",
                    fontSize:"0.78rem", marginBottom:"0.4rem",
                  }}>
                    <span style={{ color:"#4a4540", fontFamily:"Inter, sans-serif" }}>{item.label}</span>
                    <span style={{ color:"#f5f0e8", fontFamily:"Inter, sans-serif" }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
 
        {/* Navigation */}
        <div style={{ display:"flex", gap:"0.8rem", marginTop:"1.5rem" }}>
          {step > 0 && (
            <motion.button
              whileHover={{scale:1.02}} whileTap={{scale:0.98}}
              onClick={() => setStep(s => s-1)}
              style={{
                flex:1, padding:"0.85rem",
                background:"transparent", border:"1px solid #2a2a2a",
                borderRadius:8, color:"#8a8070",
                fontFamily:"Cinzel, serif", fontSize:"0.75rem",
                letterSpacing:"0.1em", cursor:"pointer",
              }}
            >← BACK</motion.button>
          )}
          <motion.button
            whileHover={{scale:1.02, boxShadow:"0 0 25px #c9a84c25"}}
            whileTap={{scale:0.98}}
            onClick={step===3 ? handleFinish : () => {
              if(step===0 && !form.country) return toast.error("Select your country");
              if(step===1 && form.languages.length===0) return toast.error("Select at least one language");
              if(step===2 && !form.playingStyle) return toast.error("Choose your style");
              setStep(s => s+1);
            }}
            disabled={loading}
            style={{
              flex: step===0 ? 1 : 2, padding:"0.85rem",
              background: loading ? "#5a4a20" : "linear-gradient(135deg,#c9a84c,#a07830)",
              border:"none", borderRadius:8, color:"#0a0a0a",
              fontFamily:"Cinzel, serif", fontSize:"0.82rem",
              letterSpacing:"0.12em", cursor: loading ? "not-allowed" : "pointer",
              fontWeight:700,
            }}
          >
            {step===3 ? (loading ? "ENTERING..." : "ENTER THE ARENA ⚔️") : "CONTINUE →"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
 
export default Onboarding;