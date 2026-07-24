import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";
import api from "../services/api";
import toast from "react-hot-toast";
import { Sword, Check, Lock, Swords } from "lucide-react";
import { COLORS } from "../constants/theme";

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
    ? debate.player1?._id?.toString()===user?._id?.toString() ? debate.player2 : debate.player1
    : null;

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

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token || !debateId) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL||"http://localhost:5000", { auth:{token} });
    socketRef.current = socket;

    socket.on("connect", () => socket.emit("join_debate", { debateId }));
    socket.on("opponent_ready", () => { setOpponentReady(true); toast("Opponent is ready!"); });
    socket.on("round_start", () => navigate(`/debate/${debateId}`));

    return () => socket.disconnect();
  }, [debateId]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t<=1) { clearInterval(timerRef.current); handleReady(); return 0; }
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

  const timerColor = timeLeft>30 ? "#4caf82" : timeLeft>10 ? "#ffb454" : "#ff5c7c";
  const timerPercent = (timeLeft/90)*100;

  const NOTE_TABS = [
    { id:"arguments", label:"Arguments", placeholder:"Your main arguments and key points..." },
    { id:"counter", label:"Counter", placeholder:"How will you counter opponent's likely arguments?" },
    { id:"examples", label:"Examples", placeholder:"Real world examples, case studies, statistics..." },
    { id:"quotes", label:"Quotes", placeholder:"Powerful quotes to use in debate..." },
  ];

  if (loading) return (
    <div style={{ minHeight:"100vh", background: COLORS.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <motion.div animate={{opacity:[0.4,1,0.4]}} transition={{duration:1.5,repeat:Infinity}}
        style={{ fontFamily:"JetBrains Mono,monospace", color:COLORS.accent2, letterSpacing:"0.2em", fontSize:"0.8rem" }}
      >ENTERING PREP ROOM...</motion.div>
    </div>
  );

  return (
    <div style={{ background: COLORS.bg, minHeight:"100vh", padding: isMobile?"1rem":"2rem", fontFamily: "Inter, -apple-system, sans-serif" }}>
      {/* Header */}
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}}
        style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"1.5rem", flexWrap:"wrap", gap:"1rem" }}
      >
        <div>
          <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.65rem", color:COLORS.accent2, letterSpacing:"0.2em", marginBottom:"0.2rem" }}>PREPARATION PHASE</div>
          <div style={{ fontFamily:"Inter,sans-serif", fontSize:"1rem", color:COLORS.text, fontWeight:700 }}>Study your opening</div>
        </div>

        {/* Timer */}
        <div style={{ textAlign:"center" }}>
          <div style={{ position:"relative", width:76, height:76, margin:"0 auto" }}>
            <svg width="76" height="76" style={{ position:"absolute", top:0, left:0, transform:"rotate(-90deg)" }}>
              <circle cx="38" cy="38" r="32" fill="none" stroke={COLORS.border} strokeWidth="4"/>
              <circle cx="38" cy="38" r="32" fill="none" stroke={timerColor} strokeWidth="4"
                strokeDasharray={`${2*Math.PI*32}`}
                strokeDashoffset={`${2*Math.PI*32*(1-timerPercent/100)}`}
                style={{ transition:"stroke-dashoffset 1s linear, stroke 0.3s" }}
              />
            </svg>
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
              <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"1.1rem", color:timerColor, fontWeight:700, lineHeight:1 }}>{timeLeft}</div>
              <div style={{ fontSize:"0.5rem", color:COLORS.textFaint }}>SEC</div>
            </div>
          </div>
          <div style={{ fontSize:"0.6rem", color:COLORS.textFaint, letterSpacing:"0.1em", marginTop:"0.3rem" }}>PREP TIME</div>
        </div>

        {opponent && (
          <div style={{ display:"flex", alignItems:"center", gap:"0.8rem" }}>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:"Inter,sans-serif", fontSize:"0.7rem", color:COLORS.textFaint }}>VS</div>
              <div style={{ fontFamily:"Inter,sans-serif", fontSize:"0.85rem", color:"#ff5c7c", fontWeight:700 }}>{opponent.username}</div>
              <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.65rem", color:COLORS.textFaint }}>{opponent.tier} · {opponent.elo} ELO</div>
              {opponentReady && (
                <div style={{ fontSize:"0.62rem", color:"#4caf82", display: "flex", alignItems: "center", gap: "0.2rem", justifyContent: "flex-end" }}>
                  <Check size={10} /> Ready
                </div>
              )}
            </div>
            <div style={{ width:44, height:44, borderRadius:"50%", background: COLORS.bgElevated, border:"2px solid #ff5c7c40", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Sword size={18} color="#ff5c7c" />
            </div>
          </div>
        )}
      </motion.div>

      {/* Topic */}
      {debate?.topic && (
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
          style={{ border:`1px solid ${COLORS.accentDim}`, borderRadius:12, padding:"1.2rem 1.5rem", marginBottom:"1.5rem", textAlign:"center" }}
        >
          <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.62rem", color:COLORS.accent2, letterSpacing:"0.3em", marginBottom:"0.5rem" }}>TODAY'S TOPIC</div>
          <div style={{ fontFamily:"Inter,sans-serif", fontSize: isMobile?"1rem":"1.25rem", color:COLORS.text, fontWeight:700, lineHeight:1.4, fontStyle: "italic" }}>"{debate.topic}"</div>
          <div style={{ fontSize:"0.72rem", color:COLORS.textFaint, marginTop:"0.5rem" }}>{debate.division} · {debate.language} · {debate.mode}</div>
        </motion.div>
      )}

      {/* Notes */}
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
        style={{ border:`1px solid ${COLORS.border}`, borderRadius:12, padding:"1.2rem", marginBottom:"1.2rem" }}
      >
        <div style={{ display:"flex", gap:"0.4rem", marginBottom:"1rem", flexWrap:"wrap" }}>
          {NOTE_TABS.map(tab => (
            <button key={tab.id} data-cursor="hover" onClick={()=>setActiveTab(tab.id)}
              style={{
                padding:"0.4rem 0.9rem", borderRadius:20, cursor:"pointer",
                background: activeTab===tab.id ? `linear-gradient(135deg,${COLORS.accent},#5a3fd6)` : "transparent",
                border: activeTab===tab.id ? "none" : `1px solid ${COLORS.border}`,
                color: activeTab===tab.id ? "#fff" : COLORS.textFaint,
                fontFamily:"Inter,sans-serif", fontSize:"0.72rem", fontWeight: activeTab===tab.id?600:400,
              }}
            >{tab.label}</button>
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
              width:"100%", background:"transparent", border:`1px solid ${COLORS.border}`, borderRadius:8,
              color:COLORS.text, fontFamily:"Inter,sans-serif", fontSize:"0.85rem", padding:"0.85rem",
              outline:"none", resize:"none", lineHeight:1.7, transition:"border-color 0.2s",
            }}
            onFocus={e=>e.target.style.borderColor=COLORS.accentDim}
            onBlur={e=>e.target.style.borderColor=COLORS.border}
          />
        </AnimatePresence>
        <div style={{ fontSize:"0.62rem", color:COLORS.textFaint, marginTop:"0.5rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <Lock size={10} /> Notes are private — opponent cannot see them
        </div>
      </motion.div>

      {/* Ready button */}
      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.4}}>
        <motion.button data-cursor="hover"
          whileHover={!isReady?{scale:1.02}:{}} whileTap={!isReady?{scale:0.98}:{}}
          onClick={handleReady} disabled={isReady}
          style={{
            width:"100%", padding:"1rem",
            background: isReady ? "#0f1f14" : `linear-gradient(135deg,${COLORS.accent},#5a3fd6)`,
            border: isReady ? "1px solid #4caf8240" : "none",
            borderRadius:10, color: isReady?"#4caf82":"#fff",
            fontFamily:"Inter,sans-serif", fontSize:"0.9rem", cursor: isReady?"not-allowed":"pointer",
            fontWeight:700, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
          }}
        >{isReady ? <><Check size={16} /> Ready — Waiting for Opponent</> : <><Swords size={16} /> I Am Ready</>}</motion.button>
        {isReady && opponentReady && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}}
            style={{ textAlign:"center", marginTop:"0.8rem", fontFamily:"Inter,sans-serif", fontSize:"0.85rem", color:COLORS.accent2, fontWeight: 600 }}
          >Both ready — entering debate room!</motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default PrepWindow;