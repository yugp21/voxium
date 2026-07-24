import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import {
  Feather, FlaskConical, Landmark, Gamepad2, Clapperboard, Zap,
  Swords, Target, ArrowLeft, User, Plug, Frown, Check,
} from "lucide-react";
import { COLORS } from "../constants/theme";

const useResponsive = () => {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => { const h=()=>setW(window.innerWidth); window.addEventListener("resize",h); return()=>window.removeEventListener("resize",h); },[]);
  return { isMobile:w<640 };
};

const DIVISIONS = [
  { name:"Philosophy", icon:Feather, color:"#a06bff", desc:"Ideas, ethics, existence" },
  { name:"Science", icon:FlaskConical, color:"#4caf82", desc:"Facts, theory, discovery" },
  { name:"Politics", icon:Landmark, color:"#4d8cff", desc:"Power, policy, society" },
  { name:"Gaming", icon:Gamepad2, color:"#ff5c7c", desc:"Culture, competition, tech" },
  { name:"Cinema", icon:Clapperboard, color:"#7c5cff", desc:"Art, story, expression" },
  { name:"Sports", icon:Zap, color:"#00e5ff", desc:"Performance, legacy, spirit" },
];
const LANGUAGES = ["English","Hindi","Spanish","French","Arabic","Portuguese","German","Japanese","Other"];
const MODES = [
  { id:"ranked", icon:Swords, label:"Ranked", desc:"ELO at stake. Real glory." },
  { id:"casual", icon:Target, label:"Casual", desc:"Practice. No ELO change." },
];

const Matchmaking = () => {
  const navigate = useNavigate();
  const { user } = useSelector(s=>s.auth);
  const { isMobile } = useResponsive();
  const socketRef   = useRef(null);
  const timeoutRef  = useRef(null);
  const timerRef    = useRef(null);

  const [phase, setPhase]         = useState("select");
  const [division, setDivision]   = useState("Philosophy");
  const [language, setLanguage]   = useState("English");
  const [mode, setMode]           = useState("ranked");
  const [queueTime, setQueueTime] = useState(0);
  const [matchData, setMatchData] = useState(null);
  const [errorMsg, setErrorMsg]   = useState("");

  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  useEffect(() => {
    if (phase==="searching") {
      timerRef.current = setInterval(()=>setQueueTime(t=>t+1), 1000);
    } else {
      clearInterval(timerRef.current);
      if (phase!=="found") setQueueTime(0);
    }
    return ()=>clearInterval(timerRef.current);
  }, [phase]);

  useEffect(() => () => {
    clearTimeout(timeoutRef.current);
    clearInterval(timerRef.current);
    socketRef.current?.disconnect();
  }, []);

  const cleanup = () => {
    clearTimeout(timeoutRef.current);
    clearInterval(timerRef.current);
    socketRef.current?.emit("leave_queue");
    socketRef.current?.disconnect();
    socketRef.current = null;
  };

  const handleFindMatch = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) { toast.error("Not authenticated"); return; }

    const socket = io(import.meta.env.VITE_SOCKET_URL||"http://localhost:5000", { auth:{token} });
    socketRef.current = socket;

    socket.on("connect", () => {
      setPhase("searching");
      socket.emit("join_queue", { tier:user?.tier, division, language, mode });
      timeoutRef.current = setTimeout(() => { cleanup(); setPhase("timeout"); }, 120000);
    });

    socket.on("queue_joined", () => toast.success("Searching for opponent..."));

    socket.on("match_found", (data) => {
      clearTimeout(timeoutRef.current);
      clearInterval(timerRef.current);
      setMatchData(data);
      setPhase("found");
      setTimeout(()=>navigate(`/prep/${data.debateId}`), 3000);
    });

    socket.on("connect_error", () => {
      cleanup();
      setErrorMsg("Could not connect to server. Check your internet connection.");
      setPhase("error");
    });

    socket.on("disconnect", (reason) => {
      if (reason==="io server disconnect") {
        cleanup();
        setErrorMsg("Disconnected from server.");
        setPhase("error");
      }
    });
  };

  const handleCancel = () => { cleanup(); setPhase("select"); toast("Left the queue"); };
  const handleRetry = () => { setPhase("select"); setErrorMsg(""); setQueueTime(0); };

  return (
    <div style={{ background: COLORS.bg, minHeight:"100vh", fontFamily: "Inter, -apple-system, sans-serif" }}>
      <div style={{ maxWidth:800, margin:"0 auto", padding:isMobile?"2.5rem 1.2rem":"3rem 2rem" }}>
        {phase==="select" && (
          <button data-cursor="hover" onClick={()=>navigate("/dashboard")} style={{
            display: "flex", alignItems: "center", gap: "0.4rem", background: "transparent", border: "none",
            color: COLORS.textFaint, fontFamily: "Inter, sans-serif", fontSize: "0.78rem", cursor: "pointer", marginBottom: "1.5rem", padding: 0,
          }}><ArrowLeft size={14} /> Dashboard</button>
        )}
        <AnimatePresence mode="wait">

          {/* ── SELECT ───────────────────────────────────────── */}
          {phase==="select" && (
            <motion.div key="select" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}}>
              <div style={{ marginBottom:"2.2rem" }}>
                <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.62rem", color:COLORS.accent2, letterSpacing:"0.2em", marginBottom:"0.5rem" }}>ENTER THE ARENA</div>
                <h1 style={{ fontFamily:"Inter,sans-serif", fontSize:isMobile?"1.7rem":"2.2rem", color:COLORS.text, fontWeight:800 }}>Find Your Opponent</h1>
                <p style={{ color:COLORS.textFaint, fontSize:"0.82rem", marginTop:"0.3rem" }}>{user?.tier} · {user?.elo||0} ELO</p>
              </div>

              <div style={{ marginBottom:"2rem" }}>
                <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.62rem", color:COLORS.textFaint, letterSpacing:"0.15em", marginBottom:"0.8rem" }}>BATTLE MODE</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.8rem" }}>
                  {MODES.map(m=>(
                    <motion.button key={m.id} data-cursor="hover" whileHover={{scale:1.02}} whileTap={{scale:0.98}}
                      onClick={()=>setMode(m.id)}
                      style={{ padding:"1rem", borderRadius:10, cursor:"pointer", textAlign:"left", background:mode===m.id?`${COLORS.accent2}0c`:"transparent", border:mode===m.id?`1px solid ${COLORS.accent2}50`:`1px solid ${COLORS.border}` }}
                    >
                      <m.icon size={20} color={mode===m.id ? COLORS.accent2 : COLORS.textFaint} strokeWidth={1.75} style={{ marginBottom:"0.5rem" }} />
                      <div style={{ fontFamily:"Inter,sans-serif", fontSize:"0.85rem", color:mode===m.id?COLORS.accent2:COLORS.text, fontWeight:700, marginBottom:"0.15rem" }}>{m.label}</div>
                      <div style={{ fontSize:"0.7rem", color:COLORS.textFaint }}>{m.desc}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom:"2rem" }}>
                <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.62rem", color:COLORS.textFaint, letterSpacing:"0.15em", marginBottom:"0.8rem" }}>CHOOSE DIVISION</div>
                <div style={{ display:"grid", gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(3,1fr)", gap:"0.7rem" }}>
                  {DIVISIONS.map(d=>(
                    <motion.button key={d.name} data-cursor="hover" whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                      onClick={()=>setDivision(d.name)}
                      style={{ padding:"1rem 0.8rem", borderRadius:10, cursor:"pointer", textAlign:"left", background:division===d.name?`${d.color}12`:"transparent", border:division===d.name?`1px solid ${d.color}50`:`1px solid ${COLORS.border}` }}
                    >
                      <d.icon size={18} color={division===d.name ? d.color : COLORS.textFaint} strokeWidth={1.75} style={{ marginBottom:"0.4rem" }} />
                      <div style={{ fontFamily:"Inter,sans-serif", fontSize:"0.8rem", color:division===d.name?d.color:COLORS.text, fontWeight:700, marginBottom:"0.1rem" }}>{d.name}</div>
                      <div style={{ fontSize:"0.65rem", color:COLORS.textFaint }}>{d.desc}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom:"2.2rem" }}>
                <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.62rem", color:COLORS.textFaint, letterSpacing:"0.15em", marginBottom:"0.8rem" }}>DEBATE LANGUAGE</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem" }}>
                  {LANGUAGES.map(l=>(
                    <button key={l} data-cursor="hover" onClick={()=>setLanguage(l)}
                      style={{ padding:"0.5rem 1rem", borderRadius:20, cursor:"pointer", background:language===l?`linear-gradient(135deg,${COLORS.accent},#5a3fd6)`:"transparent", border:language===l?"none":`1px solid ${COLORS.border}`, color:language===l?"#fff":COLORS.textFaint, fontFamily:"Inter,sans-serif", fontSize:"0.75rem", fontWeight:language===l?600:400 }}
                    >{l}</button>
                  ))}
                </div>
              </div>

              <div style={{ borderTop:`1px solid ${COLORS.border}`, paddingTop:"1.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem" }}>
                <div style={{ display:"flex", gap:"1.5rem", flexWrap:"wrap" }}>
                  {[{label:"Mode",value:mode.charAt(0).toUpperCase()+mode.slice(1)},{label:"Division",value:division},{label:"Language",value:language}].map(item=>(
                    <div key={item.label}>
                      <div style={{ fontSize:"0.6rem", color:COLORS.textFaint, letterSpacing:"0.1em" }}>{item.label}</div>
                      <div style={{ fontFamily:"Inter,sans-serif", fontSize:"0.82rem", color:COLORS.accent2, marginTop:"0.15rem", fontWeight:600 }}>{item.value}</div>
                    </div>
                  ))}
                </div>
                <motion.button data-cursor="hover" whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                  onClick={handleFindMatch}
                  style={{ padding:"0.85rem 2.2rem", background:`linear-gradient(135deg,${COLORS.accent},#5a3fd6)`, border:"none", borderRadius:8, color:"#fff", fontFamily:"Inter,sans-serif", fontSize:"0.85rem", cursor:"pointer", fontWeight:700, display:"flex", alignItems:"center", gap:"0.5rem" }}
                ><Swords size={16} /> Find Match</motion.button>
              </div>
            </motion.div>
          )}

          {/* ── SEARCHING ────────────────────────────────────── */}
          {phase==="searching" && (
            <motion.div key="searching" initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.9}} style={{ textAlign:"center", paddingTop:"3rem" }}>
              <div style={{ position:"relative", width:180, height:180, margin:"0 auto 2.5rem" }}>
                {[0,1,2].map(i=>(
                  <motion.div key={i}
                    animate={{ scale:[1,1.4+i*0.3,1], opacity:[0.6,0,0.6] }}
                    transition={{ duration:2, repeat:Infinity, delay:i*0.6, ease:"easeInOut" }}
                    style={{ position:"absolute", inset:`${i*18}px`, border:`1px solid ${COLORS.accent2}`, borderRadius:"50%" }}
                  />
                ))}
                <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <motion.div animate={{rotate:360}} transition={{duration:6,repeat:Infinity,ease:"linear"}}>
                    <Swords size={44} color={COLORS.accent2} strokeWidth={1.5} />
                  </motion.div>
                </div>
              </div>

              <motion.div animate={{opacity:[0.5,1,0.5]}} transition={{duration:2,repeat:Infinity}}
                style={{ fontFamily:"Inter,sans-serif", fontSize:isMobile?"1.1rem":"1.5rem", color:COLORS.text, fontWeight:700, marginBottom:"0.5rem" }}
              >Searching for Opponent...</motion.div>

              <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"1.8rem", color:COLORS.accent2, marginBottom:"0.5rem" }}>{formatTime(queueTime)}</div>
              <div style={{ fontSize:"0.78rem", color:COLORS.textFaint, marginBottom:"0.5rem" }}>{division} · {language} · {mode}</div>

              {queueTime>=90 && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}}
                  style={{ background:"#2a0f14", border:"1px solid #ff5c7c30", borderRadius:8, padding:"0.6rem 1.2rem", margin:"0.5rem auto 1rem", maxWidth:320, fontSize:"0.75rem", color:"#ff5c7c" }}
                >Still searching... queue will timeout at 2:00</motion.div>
              )}

              <div style={{ display:"flex", gap:"0.8rem", justifyContent:"center", marginBottom:"2.5rem", flexWrap: "wrap" }}>
                {["Scanning arena","Checking rank","Finding opponent"].map((s,i)=>(
                  <motion.div key={s} animate={{opacity:[0.3,1,0.3]}} transition={{duration:1.5,repeat:Infinity,delay:i*0.5}}
                    style={{ fontSize:"0.62rem", color:COLORS.accent2, fontFamily:"JetBrains Mono,monospace" }}
                  >◆ {s}</motion.div>
                ))}
              </div>

              <button data-cursor="hover" onClick={handleCancel} style={{ padding:"0.7rem 2rem", background:"transparent", border:`1px solid ${COLORS.border}`, borderRadius:8, color:COLORS.textDim, fontFamily:"Inter,sans-serif", fontSize:"0.8rem", cursor:"pointer" }}>Leave Queue</button>
            </motion.div>
          )}

          {/* ── TIMEOUT ──────────────────────────────────────── */}
          {phase==="timeout" && (
            <motion.div key="timeout" initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} exit={{opacity:0}} style={{ textAlign:"center", paddingTop:"4rem" }}>
              <Frown size={44} color={COLORS.textFaint} strokeWidth={1.5} style={{ margin: "0 auto 1.5rem" }} />
              <h2 style={{ fontFamily:"Inter,sans-serif", fontSize:isMobile?"1.4rem":"1.8rem", color:COLORS.text, fontWeight:800, marginBottom:"0.8rem" }}>No Opponent Found</h2>
              <p style={{ color:COLORS.textDim, fontSize:"0.85rem", maxWidth:360, margin:"0 auto 0.8rem", lineHeight:1.7 }}>
                No players at your rank are available in <strong style={{color:COLORS.accent2}}>{division}</strong> right now.
              </p>
              <p style={{ color:COLORS.textFaint, fontSize:"0.78rem", maxWidth:320, margin:"0 auto 2.2rem", lineHeight:1.6 }}>
                Try switching to Casual mode, a different division, or check back in a few minutes.
              </p>
              <div style={{ display:"flex", gap:"1rem", justifyContent:"center", flexWrap:"wrap" }}>
                <button data-cursor="hover" onClick={handleRetry} style={{ padding:"0.85rem 2.2rem", background:`linear-gradient(135deg,${COLORS.accent},#5a3fd6)`, border:"none", borderRadius:8, color:"#fff", fontFamily:"Inter,sans-serif", fontSize:"0.85rem", cursor:"pointer", fontWeight:700 }}>Try Again</button>
                <button data-cursor="hover" onClick={()=>navigate("/dashboard")} style={{ padding:"0.85rem 2.2rem", background:"transparent", border:`1px solid ${COLORS.border}`, borderRadius:8, color:COLORS.textDim, fontFamily:"Inter,sans-serif", fontSize:"0.85rem", cursor:"pointer" }}>Dashboard</button>
              </div>
            </motion.div>
          )}

          {/* ── CONNECTION ERROR ──────────────────────────────── */}
          {phase==="error" && (
            <motion.div key="error" initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} exit={{opacity:0}} style={{ textAlign:"center", paddingTop:"4rem" }}>
              <Plug size={44} color="#ff5c7c" strokeWidth={1.5} style={{ margin: "0 auto 1.5rem" }} />
              <h2 style={{ fontFamily:"Inter,sans-serif", fontSize:isMobile?"1.4rem":"1.8rem", color:"#ff5c7c", fontWeight:800, marginBottom:"0.8rem" }}>Connection Error</h2>
              <p style={{ color:COLORS.textDim, fontSize:"0.85rem", maxWidth:360, margin:"0 auto 2.2rem", lineHeight:1.7 }}>
                {errorMsg || "Something went wrong. Check your internet and try again."}
              </p>
              <div style={{ display:"flex", gap:"1rem", justifyContent:"center", flexWrap:"wrap" }}>
                <button data-cursor="hover" onClick={handleRetry} style={{ padding:"0.85rem 2.2rem", background:`linear-gradient(135deg,${COLORS.accent},#5a3fd6)`, border:"none", borderRadius:8, color:"#fff", fontFamily:"Inter,sans-serif", fontSize:"0.85rem", cursor:"pointer", fontWeight:700 }}>Retry</button>
                <button data-cursor="hover" onClick={()=>navigate("/dashboard")} style={{ padding:"0.85rem 2.2rem", background:"transparent", border:`1px solid ${COLORS.border}`, borderRadius:8, color:COLORS.textDim, fontFamily:"Inter,sans-serif", fontSize:"0.85rem", cursor:"pointer" }}>Dashboard</button>
              </div>
            </motion.div>
          )}

          {/* ── MATCH FOUND ───────────────────────────────────── */}
          {phase==="found" && matchData && (
            <motion.div key="found" initial={{opacity:0,scale:0.85}} animate={{opacity:1,scale:1}} style={{ textAlign:"center", paddingTop:"3rem" }}>
              <motion.div animate={{scale:[1,1.05,1]}} transition={{duration:0.5,repeat:3}}
                style={{ fontFamily:"Inter,sans-serif", fontSize:isMobile?"1.4rem":"2.2rem", color:COLORS.accent2, marginBottom:"1rem", fontWeight:800 }}
              >Match Found!</motion.div>

              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"2rem", margin:"2rem 0", flexWrap:"wrap" }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ width:64,height:64,borderRadius:"50%",background:COLORS.bgElevated,border:`2px solid ${COLORS.accent2}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 0.5rem" }}><User size={26} color={COLORS.accent2} /></div>
                  <div style={{ fontFamily:"Inter,sans-serif", fontSize:"0.85rem", color:COLORS.text, fontWeight:600 }}>{user?.username}</div>
                  <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.72rem", color:COLORS.accent2 }}>{user?.elo||0} ELO</div>
                </div>
                <motion.div animate={{scale:[1,1.2,1]}} transition={{duration:0.8,repeat:Infinity}} style={{ fontFamily:"Inter,sans-serif", fontSize:"1.3rem", color:COLORS.text, fontWeight:800 }}>VS</motion.div>
                <div style={{ textAlign:"center" }}>
                  <div style={{ width:64,height:64,borderRadius:"50%",background:COLORS.bgElevated,border:"2px solid #ff5c7c",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 0.5rem" }}><Swords size={24} color="#ff5c7c" /></div>
                  <div style={{ fontFamily:"Inter,sans-serif", fontSize:"0.85rem", color:COLORS.text, fontWeight:600 }}>{matchData.opponent?.username}</div>
                  <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.72rem", color:"#ff5c7c" }}>{matchData.opponent?.elo||0} ELO</div>
                </div>
              </div>

              <div style={{ border:`1px solid ${COLORS.border}`, borderRadius:10, padding:"1rem", maxWidth:320, margin:"0 auto 2rem" }}>
                <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.62rem", color:COLORS.textFaint, letterSpacing:"0.1em", marginBottom:"0.5rem" }}>TOPIC</div>
                <div style={{ fontFamily:"Inter,sans-serif", fontSize:"0.88rem", color:COLORS.text, lineHeight:1.5, fontStyle: "italic" }}>"{matchData.topic}"</div>
              </div>

              <motion.div animate={{opacity:[0.5,1,0.5]}} transition={{duration:1,repeat:Infinity}}
                style={{ fontFamily:"Inter,sans-serif", fontSize:"0.82rem", color:COLORS.accent2, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
              ><Check size={14} /> Entering prep room in 3 seconds...</motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Matchmaking;