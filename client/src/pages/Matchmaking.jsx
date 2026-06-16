import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
 
const useResponsive = () => {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => { const h=()=>setW(window.innerWidth); window.addEventListener("resize",h); return()=>window.removeEventListener("resize",h); },[]);
  return { isMobile:w<640 };
};
 
const DIVISIONS = [
  { name:"Philosophy", icon:"🦉", color:"#9b7fd4", desc:"Ideas, ethics, existence" },
  { name:"Science",    icon:"⚗️", color:"#4caf82", desc:"Facts, theory, discovery" },
  { name:"Politics",   icon:"🏛️", color:"#6b9fb8", desc:"Power, policy, society" },
  { name:"Gaming",     icon:"🎮", color:"#e8604c", desc:"Culture, competition, tech" },
  { name:"Cinema",     icon:"🎬", color:"#c9a84c", desc:"Art, story, expression" },
  { name:"Sports",     icon:"⚡", color:"#f39c12", desc:"Performance, legacy, spirit" },
];
const LANGUAGES = ["English","Hindi","Spanish","French","Arabic","Portuguese","German","Japanese","Other"];
const MODES = [
  { id:"ranked",  icon:"⚔️",  label:"Ranked",  desc:"ELO at stake. Real glory." },
  { id:"casual",  icon:"🎯",  label:"Casual",  desc:"Practice. No ELO change." },
];
 
const Matchmaking = () => {
  const navigate = useNavigate();
  const { user } = useSelector(s=>s.auth);
  const { isMobile } = useResponsive();
  const socketRef = useRef(null);
 
  const [phase, setPhase]       = useState("select"); // select | searching | found
  const [division, setDivision] = useState("Philosophy");
  const [language, setLanguage] = useState("English");
  const [mode, setMode]         = useState("ranked");
  const [queueTime, setQueueTime] = useState(0);
  const [matchData, setMatchData] = useState(null);
  const timerRef = useRef(null);
 
  // Queue timer
  useEffect(() => {
    if (phase==="searching") {
      timerRef.current = setInterval(() => setQueueTime(t=>t+1), 1000);
    } else {
      clearInterval(timerRef.current);
      setQueueTime(0);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);
 
  // Socket connection
  useEffect(() => {
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);
 
  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
 
  const handleFindMatch = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) { toast.error("Not authenticated"); return; }
 
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token },
    });
    socketRef.current = socket;
 
    socket.on("connect", () => {
      setPhase("searching");
      socket.emit("join_queue", {
        tier: user?.tier,
        division, language, mode,
      });
    });
 
    socket.on("queue_joined", (data) => {
      toast.success("Searching for opponent...");
    });
 
    socket.on("match_found", (data) => {
      setMatchData(data);
      setPhase("found");
      setTimeout(() => {
        navigate(`/prep/${data.debateId}`);
      }, 3000);
    });
 
    socket.on("connect_error", () => {
      toast.error("Connection failed. Try again.");
      setPhase("select");
    });
  };
 
  const handleCancel = () => {
    if (socketRef.current) {
      socketRef.current.emit("leave_queue");
      socketRef.current.disconnect();
    }
    setPhase("select");
    toast("Left the queue");
  };
 
  const selectedDiv = DIVISIONS.find(d=>d.name===division);
 
  return (
    <div style={{ background:"#0a0a0a", minHeight:"100vh" }}>
      {/* Navbar */}
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:100,
        padding: isMobile?"0.9rem 1.2rem":"0.9rem 2rem",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        background:"#0f0f0fF0", backdropFilter:"blur(12px)",
        borderBottom:"1px solid #1a1a1a",
      }}>
        <div style={{ fontFamily:"Cinzel Decorative,serif", fontSize:isMobile?"0.85rem":"1rem", color:"#c9a84c", letterSpacing:"0.2em", cursor:"pointer" }}
          onClick={()=>navigate("/dashboard")}>VOXIUM</div>
        {phase==="select" && (
          <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}}
            onClick={()=>navigate("/dashboard")}
            style={{ background:"transparent", border:"1px solid #2a2a2a", color:"#8a8070", padding:"0.4rem 1rem", fontFamily:"Cinzel,serif", fontSize:"0.68rem", letterSpacing:"0.1em", cursor:"pointer", borderRadius:6 }}
          >← DASHBOARD</motion.button>
        )}
      </nav>
 
      <div style={{ maxWidth:800, margin:"0 auto", padding: isMobile?"5rem 1rem 2rem":"5rem 2rem 2rem" }}>
        <AnimatePresence mode="wait">
 
          {/* ── SELECT PHASE ─────────────────────────────────── */}
          {phase==="select" && (
            <motion.div key="select"
              initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-30}}
            >
              <div style={{ textAlign:"center", marginBottom:"2.5rem" }}>
                <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.62rem", color:"#c9a84c", letterSpacing:"0.4em", marginBottom:"0.8rem" }}>ENTER THE ARENA</div>
                <h1 style={{ fontFamily:"Cinzel,serif", fontSize: isMobile?"1.8rem":"clamp(2rem,5vw,2.8rem)", color:"#f5f0e8", fontWeight:700 }}>Find Your Opponent</h1>
                <p style={{ color:"#4a4540", fontSize:"0.82rem", fontFamily:"Inter,sans-serif", marginTop:"0.5rem" }}>
                  {user?.tier} · {user?.elo||0} ELO
                </p>
              </div>
 
              {/* Mode */}
              <div style={{ marginBottom:"2rem" }}>
                <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.68rem", color:"#8a8070", letterSpacing:"0.15em", marginBottom:"0.8rem" }}>BATTLE MODE</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.8rem" }}>
                  {MODES.map(m => (
                    <motion.button key={m.id} whileHover={{scale:1.02}} whileTap={{scale:0.98}}
                      onClick={()=>setMode(m.id)}
                      style={{
                        padding:"1rem", borderRadius:10, cursor:"pointer", textAlign:"left",
                        background: mode===m.id ? "#1a1408" : "#0d0d0d",
                        border: mode===m.id ? "1px solid #c9a84c50" : "1px solid #1e1e1e",
                        transition:"all 0.2s",
                      }}
                    >
                      <div style={{ fontSize:"1.3rem", marginBottom:"0.4rem" }}>{m.icon}</div>
                      <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.82rem", color: mode===m.id?"#c9a84c":"#f5f0e8", fontWeight:600, marginBottom:"0.2rem" }}>{m.label}</div>
                      <div style={{ fontSize:"0.7rem", color:"#4a4540", fontFamily:"Inter,sans-serif" }}>{m.desc}</div>
                    </motion.button>
                  ))}
                </div>
              </div>
 
              {/* Division */}
              <div style={{ marginBottom:"2rem" }}>
                <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.68rem", color:"#8a8070", letterSpacing:"0.15em", marginBottom:"0.8rem" }}>CHOOSE DIVISION</div>
                <div style={{ display:"grid", gridTemplateColumns: isMobile?"repeat(2,1fr)":"repeat(3,1fr)", gap:"0.7rem" }}>
                  {DIVISIONS.map(d => (
                    <motion.button key={d.name} whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                      onClick={()=>setDivision(d.name)}
                      style={{
                        padding:"1rem 0.8rem", borderRadius:10, cursor:"pointer", textAlign:"left",
                        background: division===d.name ? `${d.color}12` : "#0d0d0d",
                        border: division===d.name ? `1px solid ${d.color}50` : "1px solid #1e1e1e",
                        transition:"all 0.2s",
                      }}
                    >
                      <div style={{ fontSize:"1.4rem", marginBottom:"0.3rem" }}>{d.icon}</div>
                      <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.75rem", color: division===d.name?d.color:"#f5f0e8", fontWeight:600, marginBottom:"0.1rem" }}>{d.name}</div>
                      <div style={{ fontSize:"0.65rem", color:"#4a4540", fontFamily:"Inter,sans-serif" }}>{d.desc}</div>
                    </motion.button>
                  ))}
                </div>
              </div>
 
              {/* Language */}
              <div style={{ marginBottom:"2.5rem" }}>
                <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.68rem", color:"#8a8070", letterSpacing:"0.15em", marginBottom:"0.8rem" }}>DEBATE LANGUAGE</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem" }}>
                  {LANGUAGES.map(l => (
                    <motion.button key={l} whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                      onClick={()=>setLanguage(l)}
                      style={{
                        padding:"0.5rem 1rem", borderRadius:20, cursor:"pointer",
                        background: language===l ? "linear-gradient(135deg,#c9a84c,#a07830)" : "#0d0d0d",
                        border: language===l ? "none" : "1px solid #1e1e1e",
                        color: language===l ? "#0a0a0a" : "#8a8070",
                        fontFamily:"Inter,sans-serif", fontSize:"0.75rem",
                        fontWeight: language===l ? 600 : 400,
                        transition:"all 0.2s",
                      }}
                    >{l}</motion.button>
                  ))}
                </div>
              </div>
 
              {/* Summary + Find Match */}
              <div style={{
                background:"#111", border:"1px solid #1e1e1e",
                borderRadius:12, padding:"1.2rem 1.5rem", marginBottom:"1.2rem",
                display:"flex", alignItems:"center", justifyContent:"space-between",
                flexWrap:"wrap", gap:"1rem",
              }}>
                <div style={{ display:"flex", gap:"1.5rem", flexWrap:"wrap" }}>
                  {[
                    { label:"Mode", value:mode.charAt(0).toUpperCase()+mode.slice(1) },
                    { label:"Division", value:division },
                    { label:"Language", value:language },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ fontSize:"0.62rem", color:"#4a4540", fontFamily:"Inter,sans-serif", letterSpacing:"0.1em" }}>{item.label}</div>
                      <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.82rem", color:"#c9a84c", marginTop:"0.2rem" }}>{item.value}</div>
                    </div>
                  ))}
                </div>
                <motion.button
                  whileHover={{scale:1.04, boxShadow:"0 0 30px #c9a84c30"}}
                  whileTap={{scale:0.96}}
                  onClick={handleFindMatch}
                  style={{
                    padding:"0.85rem 2.5rem",
                    background:"linear-gradient(135deg,#c9a84c,#a07830)",
                    border:"none", borderRadius:8, color:"#0a0a0a",
                    fontFamily:"Cinzel,serif", fontSize:"0.85rem",
                    letterSpacing:"0.15em", cursor:"pointer", fontWeight:700,
                  }}
                >FIND MATCH ⚔️</motion.button>
              </div>
            </motion.div>
          )}
 
          {/* ── SEARCHING PHASE ───────────────────────────────── */}
          {phase==="searching" && (
            <motion.div key="searching"
              initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.9}}
              style={{ textAlign:"center", paddingTop:"4rem" }}
            >
              {/* Animated rings */}
              <div style={{ position:"relative", width:200, height:200, margin:"0 auto 3rem" }}>
                {[0,1,2].map(i => (
                  <motion.div key={i}
                    animate={{ scale:[1,1.4+i*0.3,1], opacity:[0.6,0,0.6] }}
                    transition={{ duration:2, repeat:Infinity, delay:i*0.6, ease:"easeInOut" }}
                    style={{
                      position:"absolute", inset: `${i*20}px`,
                      border:"1px solid #c9a84c",
                      borderRadius:"50%",
                    }}
                  />
                ))}
                <div style={{
                  position:"absolute", inset:0, display:"flex",
                  alignItems:"center", justifyContent:"center",
                }}>
                  <motion.div
                    animate={{ rotate:360 }}
                    transition={{ duration:8, repeat:Infinity, ease:"linear" }}
                    style={{ fontSize:"3rem" }}
                  >⚔️</motion.div>
                </div>
              </div>
 
              <motion.div
                animate={{ opacity:[0.5,1,0.5] }}
                transition={{ duration:2, repeat:Infinity }}
                style={{ fontFamily:"Cinzel,serif", fontSize: isMobile?"1.2rem":"1.8rem", color:"#f5f0e8", fontWeight:700, marginBottom:"0.5rem" }}
              >Searching for Opponent...</motion.div>
 
              <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"2rem", color:"#c9a84c", marginBottom:"0.5rem" }}>
                {formatTime(queueTime)}
              </div>
 
              <div style={{ fontSize:"0.78rem", color:"#4a4540", fontFamily:"Inter,sans-serif", marginBottom:"0.5rem" }}>
                {division} · {language} · {mode}
              </div>
 
              <div style={{ display:"flex", gap:"0.5rem", justifyContent:"center", marginBottom:"3rem" }}>
                {["Scanning arena","Checking rank","Finding opponent"].map((s,i) => (
                  <motion.div key={s}
                    animate={{ opacity:[0.3,1,0.3] }}
                    transition={{ duration:1.5, repeat:Infinity, delay:i*0.5 }}
                    style={{ fontSize:"0.62rem", color:"#c9a84c", fontFamily:"JetBrains Mono,monospace" }}
                  >◆ {s}</motion.div>
                ))}
              </div>
 
              <motion.button
                whileHover={{scale:1.04}} whileTap={{scale:0.96}}
                onClick={handleCancel}
                style={{
                  padding:"0.7rem 2rem", background:"transparent",
                  border:"1px solid #2a2a2a", borderRadius:8,
                  color:"#8a8070", fontFamily:"Cinzel,serif",
                  fontSize:"0.75rem", letterSpacing:"0.1em", cursor:"pointer",
                }}
              >LEAVE QUEUE</motion.button>
            </motion.div>
          )}
 
          {/* ── MATCH FOUND PHASE ────────────────────────────── */}
          {phase==="found" && matchData && (
            <motion.div key="found"
              initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}}
              style={{ textAlign:"center", paddingTop:"4rem" }}
            >
              <motion.div
                animate={{ scale:[1,1.05,1] }}
                transition={{ duration:0.5, repeat:3 }}
                style={{ fontFamily:"Cinzel Decorative,serif", fontSize: isMobile?"1.5rem":"2.5rem", color:"#c9a84c", marginBottom:"1rem" }}
              >MATCH FOUND!</motion.div>
 
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"2rem", margin:"2rem 0", flexWrap:"wrap" }}>
                {/* Me */}
                <div style={{ textAlign:"center" }}>
                  <div style={{ width:70, height:70, borderRadius:"50%", background:"#1a1a1a", border:"2px solid #c9a84c", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 0.5rem", fontSize:"2rem" }}>👤</div>
                  <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.85rem", color:"#f5f0e8" }}>{user?.username}</div>
                  <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.72rem", color:"#c9a84c" }}>{user?.elo||0} ELO</div>
                </div>
 
                <motion.div
                  animate={{ scale:[1,1.2,1] }}
                  transition={{ duration:0.8, repeat:Infinity }}
                  style={{ fontFamily:"Cinzel,serif", fontSize:"1.5rem", color:"#c9a84c" }}
                >VS</motion.div>
 
                {/* Opponent */}
                <div style={{ textAlign:"center" }}>
                  <div style={{ width:70, height:70, borderRadius:"50%", background:"#1a1a1a", border:"2px solid #e8604c", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 0.5rem" }}>
                    {matchData.opponent?.profileImage
                      ? <img src={matchData.opponent.profileImage} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}} alt=""/>
                      : <span style={{fontSize:"2rem"}}>⚔️</span>
                    }
                  </div>
                  <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.85rem", color:"#f5f0e8" }}>{matchData.opponent?.username}</div>
                  <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.72rem", color:"#e8604c" }}>{matchData.opponent?.elo||0} ELO</div>
                </div>
              </div>
 
              <div style={{ background:"#111", border:"1px solid #c9a84c20", borderRadius:10, padding:"1rem", maxWidth:300, margin:"0 auto 2rem" }}>
                <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.75rem", color:"#8a8070", marginBottom:"0.5rem" }}>TOPIC</div>
                <div style={{ fontFamily:"Inter,sans-serif", fontSize:"0.88rem", color:"#f5f0e8", lineHeight:1.5 }}>{matchData.topic}</div>
              </div>
 
              <motion.div
                animate={{ opacity:[0.5,1,0.5] }}
                transition={{ duration:1, repeat:Infinity }}
                style={{ fontFamily:"Cinzel,serif", fontSize:"0.82rem", color:"#c9a84c", letterSpacing:"0.1em" }}
              >Entering prep room in 3 seconds...</motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
 
export default Matchmaking;