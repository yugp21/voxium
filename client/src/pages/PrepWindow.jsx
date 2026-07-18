import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";
import api from "../services/api";
import toast from "react-hot-toast";
 
const useResponsive = () => {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => { const h=()=>setW(window.innerWidth); window.addEventListener("resize",h); return()=>window.removeEventListener("resize",h); },[]);
  return { isMobile:w<640 };
};
 
const PrepWindow = () => {
  const { debateId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector(s=>s.auth);
  const { isMobile } = useResponsive();
  const socketRef = useRef(null);
 
  const [debate, setDebate] = useState(null);
  const [timeLeft, setTimeLeft] = useState(90);
  const [notes, setNotes] = useState({ arguments:"", counter:"", examples:"", quotes:"" });
  const [activeTab, setActiveTab] = useState("arguments");
  const [isReady, setIsReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);
 
  const opponent = debate
    ? debate.player1?._id?.toString()===user?._id?.toString()
      ? debate.player2
      : debate.player1
    : null;
 
  // Fetch debate
  useEffect(() => {
    const fetchDebate = async () => {
      try {
        const res = await api.get(`/debates/${debateId}`);
        setDebate(res.data.data);
      } catch {
        toast.error("Debate not found");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchDebate();
  }, [debateId]);
 
  // Socket connection
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token || !debateId) return;
 
    const socket = io(import.meta.env.VITE_SOCKET_URL||"http://localhost:5000", { auth:{token} });
    socketRef.current = socket;
 
    socket.on("connect", () => {
      socket.emit("join_debate", { debateId });
    });
 
    socket.on("opponent_ready", () => {
      setOpponentReady(true);
      toast("Opponent is ready!");
    });
 
    socket.on("round_start", (data) => {
      navigate(`/debate/${debateId}`);
    });
 
    return () => socket.disconnect();
  }, [debateId]);
 
  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t<=1) {
          clearInterval(timerRef.current);
          handleReady();
          return 0;
        }
        return t-1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);
 
  const handleReady = () => {
    if (isReady) return;
    setIsReady(true);
    socketRef.current?.emit("player_ready", { debateId });
    toast.success("You are ready! Waiting for opponent...");
  };
 
  const timerColor = timeLeft>30 ? "#4caf82" : timeLeft>10 ? "#f39c12" : "#e8604c";
  const timerPercent = (timeLeft/90)*100;
 
  const NOTE_TABS = [
    { id:"arguments",   label:"Arguments",   placeholder:"Your main arguments and key points..." },
    { id:"counter",     label:"Counter",     placeholder:"How will you counter opponent's likely arguments?" },
    { id:"examples",    label:"Examples",    placeholder:"Real world examples, case studies, statistics..." },
    { id:"quotes",      label:"Quotes",      placeholder:"Powerful quotes to use in debate..." },
  ];
 
  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <motion.div animate={{opacity:[0.4,1,0.4]}} transition={{duration:1.5,repeat:Infinity}}
        style={{ fontFamily:"Cinzel,serif", color:"#c9a84c", letterSpacing:"0.2em" }}
      >ENTERING PREP ROOM...</motion.div>
    </div>
  );
 
  return (
    <div style={{ background:"#0a0a0a", minHeight:"100vh", padding: isMobile?"1rem":"2rem" }}>
      {/* Header */}
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}}
        style={{
          display:"flex", alignItems:"center", justifyContent:"space-between",
          marginBottom:"1.5rem", flexWrap:"wrap", gap:"1rem",
        }}
      >
        <div>
          <div style={{ fontFamily:"Cinzel Decorative,serif", fontSize:"0.9rem", color:"#c9a84c", letterSpacing:"0.2em", marginBottom:"0.2rem" }}>UDA</div>
          <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.65rem", color:"#4a4540", letterSpacing:"0.15em" }}>PREPARATION PHASE</div>
        </div>
 
        {/* Timer */}
        <div style={{ textAlign:"center" }}>
          <div style={{ position:"relative", width:80, height:80, margin:"0 auto" }}>
            <svg width="80" height="80" style={{ position:"absolute", top:0, left:0, transform:"rotate(-90deg)" }}>
              <circle cx="40" cy="40" r="34" fill="none" stroke="#1a1a1a" strokeWidth="4"/>
              <circle cx="40" cy="40" r="34" fill="none" stroke={timerColor} strokeWidth="4"
                strokeDasharray={`${2*Math.PI*34}`}
                strokeDashoffset={`${2*Math.PI*34*(1-timerPercent/100)}`}
                style={{ transition:"stroke-dashoffset 1s linear, stroke 0.3s" }}
              />
            </svg>
            <div style={{
              position:"absolute", inset:0, display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center",
            }}>
              <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"1.2rem", color:timerColor, fontWeight:700, lineHeight:1 }}>{timeLeft}</div>
              <div style={{ fontSize:"0.5rem", color:"#4a4540", fontFamily:"Inter,sans-serif" }}>SEC</div>
            </div>
          </div>
          <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.62rem", color:"#4a4540", letterSpacing:"0.1em", marginTop:"0.3rem" }}>PREP TIME</div>
        </div>
 
        {/* Opponent */}
        {opponent && (
          <div style={{ display:"flex", alignItems:"center", gap:"0.8rem" }}>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.75rem", color:"#f5f0e8" }}>VS</div>
              <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.85rem", color:"#e8604c", fontWeight:600 }}>{opponent.username}</div>
              <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.65rem", color:"#4a4540" }}>{opponent.tier} · {opponent.elo} ELO</div>
              {opponentReady && <div style={{ fontSize:"0.62rem", color:"#4caf82", fontFamily:"Inter,sans-serif" }}>✓ Ready</div>}
            </div>
            <div style={{
              width:44, height:44, borderRadius:"50%",
              background:"#1a1a1a", border:"2px solid #e8604c40",
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1.2rem",
            }}>⚔️</div>
          </div>
        )}
      </motion.div>
 
      {/* Topic */}
      {debate?.topic && (
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
          style={{
            background:"#111", border:"1px solid #c9a84c20",
            borderRadius:12, padding:"1.2rem 1.5rem", marginBottom:"1.5rem",
            textAlign:"center",
          }}
        >
          <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.62rem", color:"#c9a84c", letterSpacing:"0.3em", marginBottom:"0.5rem" }}>TODAY'S TOPIC</div>
          <div style={{ fontFamily:"Cinzel,serif", fontSize: isMobile?"1rem":"1.3rem", color:"#f5f0e8", fontWeight:600, lineHeight:1.4 }}>"{debate.topic}"</div>
          <div style={{ fontSize:"0.72rem", color:"#4a4540", fontFamily:"Inter,sans-serif", marginTop:"0.5rem" }}>
            {debate.division} · {debate.language} · {debate.mode}
          </div>
        </motion.div>
      )}
 
      {/* Notes Area */}
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
        style={{
          background:"#111", border:"1px solid #1e1e1e",
          borderRadius:12, padding:"1.2rem", marginBottom:"1.2rem",
        }}
      >
        <div style={{ display:"flex", gap:"0.4rem", marginBottom:"1rem", flexWrap:"wrap" }}>
          {NOTE_TABS.map(tab => (
            <motion.button key={tab.id} whileHover={{scale:1.03}} whileTap={{scale:0.97}}
              onClick={()=>setActiveTab(tab.id)}
              style={{
                padding:"0.4rem 0.9rem", borderRadius:6, cursor:"pointer",
                background: activeTab===tab.id ? "linear-gradient(135deg,#c9a84c,#a07830)" : "transparent",
                border: activeTab===tab.id ? "none" : "1px solid #2a2a2a",
                color: activeTab===tab.id ? "#0a0a0a" : "#8a8070",
                fontFamily:"Cinzel,serif", fontSize:"0.65rem",
                letterSpacing:"0.08em", fontWeight: activeTab===tab.id?700:400,
                transition:"all 0.2s",
              }}
            >{tab.label}</motion.button>
          ))}
        </div>
 
        <AnimatePresence mode="wait">
          <motion.textarea key={activeTab}
            initial={{opacity:0,x:10}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-10}}
            value={notes[activeTab]}
            onChange={e=>setNotes({...notes,[activeTab]:e.target.value})}
            placeholder={NOTE_TABS.find(t=>t.id===activeTab)?.placeholder}
            rows={isMobile?6:8}
            style={{
              width:"100%", background:"#0d0d0d",
              border:"1px solid #1a1a1a", borderRadius:8,
              color:"#f5f0e8", fontFamily:"Inter,sans-serif",
              fontSize:"0.85rem", padding:"0.85rem", outline:"none",
              resize:"none", lineHeight:1.7, transition:"border-color 0.2s",
            }}
            onFocus={e=>e.target.style.borderColor="#c9a84c30"}
            onBlur={e=>e.target.style.borderColor="#1a1a1a"}
          />
        </AnimatePresence>
        <div style={{ fontSize:"0.62rem", color:"#3a3530", fontFamily:"Inter,sans-serif", marginTop:"0.4rem" }}>
          🔒 Notes are private — opponent cannot see them
        </div>
      </motion.div>
 
      {/* Ready Button */}
      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.4}}>
        <motion.button
          whileHover={!isReady?{scale:1.03,boxShadow:"0 0 40px #c9a84c30"}:{}}
          whileTap={!isReady?{scale:0.97}:{}}
          onClick={handleReady}
          disabled={isReady}
          style={{
            width:"100%", padding:"1rem",
            background: isReady ? "#1a2a1a" : "linear-gradient(135deg,#c9a84c,#a07830)",
            border: isReady ? "1px solid #4caf8240" : "none",
            borderRadius:10, color: isReady?"#4caf82":"#0a0a0a",
            fontFamily:"Cinzel,serif", fontSize:"0.9rem",
            letterSpacing:"0.15em", cursor: isReady?"not-allowed":"pointer",
            fontWeight:700,
          }}
        >
          {isReady ? "✓ READY — WAITING FOR OPPONENT" : "I AM READY ⚔️"}
        </motion.button>
        {isReady && opponentReady && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}}
            style={{ textAlign:"center", marginTop:"0.8rem", fontFamily:"Cinzel,serif", fontSize:"0.82rem", color:"#c9a84c" }}
          >Both ready — entering debate room!</motion.div>
        )}
      </motion.div>
    </div>
  );
};
 
export default PrepWindow;