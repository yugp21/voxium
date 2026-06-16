import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";
import Peer from "peerjs";
import api from "../services/api";
import toast from "react-hot-toast";
 
const useResponsive = () => {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => { const h=()=>setW(window.innerWidth); window.addEventListener("resize",h); return()=>window.removeEventListener("resize",h); },[]);
  return { isMobile:w<640 };
};
 
const ROUND_TYPES = { 1:"Opening Statement", 2:"Rebuttal", 3:"Closing Argument" };
const ROUND_COLORS = { opening:"#4caf82", rebuttal:"#c9a84c", closing:"#e8604c" };
 
const DebateRoom = () => {
  const { debateId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector(s=>s.auth);
  const { isMobile } = useResponsive();
 
  const socketRef    = useRef(null);
  const peerRef      = useRef(null);
  const myVideoRef   = useRef(null);
  const oppVideoRef  = useRef(null);
  const myStreamRef  = useRef(null);
 
  const [debate, setDebate]           = useState(null);
  const [phase, setPhase]             = useState("waiting"); // waiting|round|voting|result
  const [currentRound, setCurrentRound] = useState(null);
  const [roundTimer, setRoundTimer]   = useState(0);
  const [votes, setVotes]             = useState({ player1:0, player2:0 });
  const [myVote, setMyVote]           = useState(null);
  const [result, setResult]           = useState(null);
  const [camOn, setCamOn]             = useState(true);
  const [micOn, setMicOn]             = useState(true);
  const [loading, setLoading]         = useState(true);
  const timerRef = useRef(null);
 
  const isPlayer = debate
    ? debate.player1?._id?.toString()===user?._id?.toString() ||
      debate.player2?._id?.toString()===user?._id?.toString()
    : false;
 
  const myRole = debate?.player1?._id?.toString()===user?._id?.toString() ? "player1" : "player2";
  const opponent = debate
    ? myRole==="player1" ? debate.player2 : debate.player1
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
 
  // Setup WebRTC + Socket
  useEffect(() => {
    if (!debateId || loading) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;
 
    // Socket
    const socket = io(import.meta.env.VITE_SOCKET_URL||"http://localhost:5000", { auth:{token} });
    socketRef.current = socket;
 
    socket.on("connect", () => socket.emit("join_debate", { debateId }));
 
    socket.on("round_start", (data) => {
      setCurrentRound(data);
      setPhase("round");
      setRoundTimer(data.duration);
      setMyVote(null);
      toast(`Round ${data.roundNumber}: ${ROUND_TYPES[data.roundNumber]} begins!`);
 
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRoundTimer(t => {
          if (t<=1) { clearInterval(timerRef.current); return 0; }
          return t-1;
        });
      }, 1000);
    });
 
    socket.on("round_end", (data) => {
      setPhase("voting");
      clearInterval(timerRef.current);
      toast("Round ended! Cast your vote.");
    });
 
    socket.on("vote_update", (data) => {
      setVotes(data.voteCounts);
    });
 
    socket.on("debate_result", (data) => {
      setResult(data);
      setPhase("result");
      clearInterval(timerRef.current);
    });
 
    // PeerJS for WebRTC
    if (isPlayer) {
      setupWebRTC(socket);
    }
 
    return () => {
      socket.disconnect();
      myStreamRef.current?.getTracks().forEach(t=>t.stop());
      peerRef.current?.destroy();
      clearInterval(timerRef.current);
    };
  }, [debateId, loading, isPlayer]);
 
  const setupWebRTC = async (socket) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:true, audio:true });
      myStreamRef.current = stream;
      if (myVideoRef.current) myVideoRef.current.srcObject = stream;
 
      const peer = new Peer(undefined, {
        host: "/", port: "3001",
        path: "/peerjs",
      });
      peerRef.current = peer;
 
      peer.on("open", (peerId) => {
        socket.emit("peer_ready", { debateId, peerId });
      });
 
      peer.on("call", (call) => {
        call.answer(stream);
        call.on("stream", (remoteStream) => {
          if (oppVideoRef.current) oppVideoRef.current.srcObject = remoteStream;
        });
      });
 
      socket.on("opponent_peer", ({ peerId }) => {
        const call = peer.call(peerId, stream);
        call?.on("stream", (remoteStream) => {
          if (oppVideoRef.current) oppVideoRef.current.srcObject = remoteStream;
        });
      });
    } catch (err) {
      toast.error("Camera/mic access denied. Debate may not work properly.");
    }
  };
 
  const toggleCam = () => {
    myStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setCamOn(c=>!c);
  };
 
  const toggleMic = () => {
    myStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setMicOn(m=>!m);
  };
 
  const handleVote = (voteFor) => {
    if (myVote || isPlayer) return;
    setMyVote(voteFor);
    socketRef.current?.emit("cast_vote", {
      debateId, roundId:currentRound?.roundId, voteFor, score:10,
    });
    toast.success("Vote cast!");
  };
 
  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
 
  const roundColor = currentRound
    ? ROUND_COLORS[currentRound.type] || "#c9a84c"
    : "#c9a84c";
 
  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <motion.div animate={{opacity:[0.4,1,0.4]}} transition={{duration:1.5,repeat:Infinity}}
        style={{ fontFamily:"Cinzel,serif", color:"#c9a84c", letterSpacing:"0.2em" }}
      >ENTERING DEBATE ARENA...</motion.div>
    </div>
  );
 
  return (
    <div style={{ background:"#0a0a0a", minHeight:"100vh", display:"flex", flexDirection:"column" }}>
      {/* Top Bar */}
      <div style={{
        padding: isMobile?"0.8rem 1rem":"0.8rem 1.5rem",
        background:"#0f0f0f", borderBottom:"1px solid #1a1a1a",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        flexWrap:"wrap", gap:"0.5rem",
      }}>
        <div style={{ fontFamily:"Cinzel Decorative,serif", fontSize:"0.85rem", color:"#c9a84c", letterSpacing:"0.2em" }}>VOXIUM</div>
 
        {/* Round indicator */}
        <AnimatePresence>
          {currentRound && (
            <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}}
              style={{
                display:"flex", alignItems:"center", gap:"0.8rem",
                background:"#111", border:`1px solid ${roundColor}30`,
                borderRadius:8, padding:"0.4rem 1rem",
              }}
            >
              <div style={{ width:8, height:8, borderRadius:"50%", background:roundColor }}/>
              <span style={{ fontFamily:"Cinzel,serif", fontSize:"0.72rem", color:roundColor, letterSpacing:"0.1em" }}>
                ROUND {currentRound.roundNumber} — {ROUND_TYPES[currentRound.roundNumber]?.toUpperCase()}
              </span>
              {phase==="round" && (
                <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.85rem", color:roundTimer<10?"#e8604c":roundColor, fontWeight:700 }}>
                  {formatTime(roundTimer)}
                </span>
              )}
            </motion.div>
          )}
          {phase==="waiting" && (
            <motion.div animate={{opacity:[0.5,1,0.5]}} transition={{duration:1.5,repeat:Infinity}}
              style={{ fontFamily:"Cinzel,serif", fontSize:"0.72rem", color:"#4a4540", letterSpacing:"0.1em" }}
            >WAITING FOR DEBATE TO START...</motion.div>
          )}
        </AnimatePresence>
 
        <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
          <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.68rem", color:"#4a4540" }}>
            {debate?.topic?.substring(0,isMobile?20:40)}{debate?.topic?.length>40?"...":""}
          </div>
        </div>
      </div>
 
      {/* Main Content */}
      <div style={{ flex:1, display:"flex", flexDirection: isMobile?"column":"row", gap:0 }}>
 
        {/* Video Section */}
        <div style={{
          flex:1, display:"flex", flexDirection:"column",
          background:"#080808", position:"relative",
        }}>
          {/* Opponent Video */}
          <div style={{ flex:1, position:"relative", background:"#0d0d0d", minHeight: isMobile?200:300 }}>
            <video ref={oppVideoRef} autoPlay playsInline
              style={{ width:"100%", height:"100%", objectFit:"cover", opacity:0.9 }}
            />
            <div style={{
              position:"absolute", bottom:"1rem", left:"1rem",
              background:"#0a0a0aCC", borderRadius:6, padding:"0.3rem 0.8rem",
            }}>
              <span style={{ fontFamily:"Cinzel,serif", fontSize:"0.72rem", color:"#e8604c" }}>
                {opponent?.username || "Opponent"}
              </span>
            </div>
            {/* Votes for opponent */}
            <div style={{
              position:"absolute", top:"1rem", right:"1rem",
              background:"#0a0a0aCC", borderRadius:6, padding:"0.3rem 0.8rem",
            }}>
              <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.85rem", color:"#e8604c", fontWeight:700 }}>
                {votes[myRole==="player1"?"player2":"player1"]} votes
              </span>
            </div>
          </div>
 
          {/* My Video */}
          <div style={{ height: isMobile?150:200, position:"relative", background:"#111", borderTop:"1px solid #1a1a1a" }}>
            <video ref={myVideoRef} autoPlay playsInline muted
              style={{ width:"100%", height:"100%", objectFit:"cover", opacity:0.9 }}
            />
            <div style={{
              position:"absolute", bottom:"0.8rem", left:"1rem",
              background:"#0a0a0aCC", borderRadius:6, padding:"0.3rem 0.8rem",
            }}>
              <span style={{ fontFamily:"Cinzel,serif", fontSize:"0.72rem", color:"#c9a84c" }}>
                {user?.username} (You)
              </span>
            </div>
            {/* My vote count */}
            <div style={{
              position:"absolute", top:"0.8rem", right:"1rem",
              background:"#0a0a0aCC", borderRadius:6, padding:"0.3rem 0.8rem",
            }}>
              <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.85rem", color:"#c9a84c", fontWeight:700 }}>
                {votes[myRole]} votes
              </span>
            </div>
 
            {/* Controls */}
            {isPlayer && (
              <div style={{
                position:"absolute", bottom:"0.8rem", left:"50%",
                transform:"translateX(-50%)",
                display:"flex", gap:"0.5rem",
              }}>
                <motion.button whileHover={{scale:1.1}} whileTap={{scale:0.9}}
                  onClick={toggleMic}
                  style={{
                    width:36, height:36, borderRadius:"50%", border:"none", cursor:"pointer",
                    background: micOn?"#1a1a1a":"#c0392b",
                    color:"#f5f0e8", fontSize:"1rem",
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}
                >{micOn?"🎙️":"🔇"}</motion.button>
                <motion.button whileHover={{scale:1.1}} whileTap={{scale:0.9}}
                  onClick={toggleCam}
                  style={{
                    width:36, height:36, borderRadius:"50%", border:"none", cursor:"pointer",
                    background: camOn?"#1a1a1a":"#c0392b",
                    color:"#f5f0e8", fontSize:"1rem",
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}
                >{camOn?"📹":"🚫"}</motion.button>
              </div>
            )}
          </div>
        </div>
 
        {/* Right Panel */}
        <div style={{
          width: isMobile?"100%":320, background:"#0d0d0d",
          borderLeft:"1px solid #1a1a1a", display:"flex", flexDirection:"column",
        }}>
 
          {/* Voting Panel */}
          <AnimatePresence>
            {phase==="voting" && !isPlayer && (
              <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
                style={{ padding:"1.5rem", borderBottom:"1px solid #1a1a1a" }}
              >
                <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.75rem", color:"#c9a84c", letterSpacing:"0.1em", marginBottom:"1rem" }}>CAST YOUR VOTE</div>
                <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
                  {[
                    { key:"player1", name:debate?.player1?.username, color:"#c9a84c" },
                    { key:"player2", name:debate?.player2?.username, color:"#e8604c" },
                  ].map(p => (
                    <motion.button key={p.key}
                      whileHover={!myVote?{scale:1.03}:{}}
                      whileTap={!myVote?{scale:0.97}:{}}
                      onClick={()=>handleVote(p.key)}
                      disabled={!!myVote}
                      style={{
                        padding:"0.8rem",
                        background: myVote===p.key ? `${p.color}20` : "#111",
                        border: `1px solid ${myVote===p.key?p.color:"#2a2a2a"}`,
                        borderRadius:8, color: p.color,
                        fontFamily:"Cinzel,serif", fontSize:"0.78rem",
                        letterSpacing:"0.08em", cursor:myVote?"not-allowed":"pointer",
                        fontWeight:600,
                      }}
                    >
                      {myVote===p.key?"✓ VOTED — ":""}{p.name}
                    </motion.button>
                  ))}
                </div>
                {myVote && <div style={{ fontSize:"0.68rem", color:"#4a4540", fontFamily:"Inter,sans-serif", marginTop:"0.5rem", textAlign:"center" }}>Vote recorded!</div>}
              </motion.div>
            )}
          </AnimatePresence>
 
          {/* Live Vote Bar */}
          {(phase==="round"||phase==="voting") && (
            <div style={{ padding:"1.2rem", borderBottom:"1px solid #1a1a1a" }}>
              <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.65rem", color:"#4a4540", letterSpacing:"0.1em", marginBottom:"0.8rem" }}>LIVE VOTES</div>
              <div style={{ display:"flex", gap:"0.5rem", alignItems:"center" }}>
                <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.85rem", color:"#c9a84c", fontWeight:700, minWidth:24 }}>{votes.player1}</span>
                <div style={{ flex:1, height:8, background:"#1a1a1a", borderRadius:4, overflow:"hidden" }}>
                  <motion.div
                    animate={{ width:`${votes.player1+votes.player2>0?(votes.player1/(votes.player1+votes.player2))*100:50}%` }}
                    transition={{ duration:0.5 }}
                    style={{ height:"100%", background:"linear-gradient(90deg,#c9a84c,#e8604c)", borderRadius:4 }}
                  />
                </div>
                <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.85rem", color:"#e8604c", fontWeight:700, minWidth:24, textAlign:"right" }}>{votes.player2}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:"0.3rem" }}>
                <span style={{ fontSize:"0.6rem", color:"#4a4540", fontFamily:"Inter,sans-serif" }}>{debate?.player1?.username}</span>
                <span style={{ fontSize:"0.6rem", color:"#4a4540", fontFamily:"Inter,sans-serif" }}>{debate?.player2?.username}</span>
              </div>
            </div>
          )}
 
          {/* Result Panel */}
          <AnimatePresence>
            {phase==="result" && result && (
              <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}}
                style={{ padding:"1.5rem", flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center" }}
              >
                <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>
                  {result.winner?.toString()===user?._id?.toString() ? "🏆" : "💀"}
                </div>
                <div style={{
                  fontFamily:"Cinzel,serif", fontSize:"1.2rem", fontWeight:700, marginBottom:"0.5rem",
                  color: result.winner?.toString()===user?._id?.toString() ? "#c9a84c" : "#e8604c",
                }}>
                  {result.winner?.toString()===user?._id?.toString() ? "VICTORY!" : result.result==="draw"?"DRAW":"DEFEAT"}
                </div>
                <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.85rem", marginBottom:"1.5rem",
                  color: result.eloChanges?.[myRole]?.change>=0?"#4caf82":"#e8604c"
                }}>
                  {result.eloChanges?.[myRole]?.change>=0?"+":""}{result.eloChanges?.[myRole]?.change||0} ELO
                </div>
                <motion.button whileHover={{scale:1.04}} whileTap={{scale:0.96}}
                  onClick={()=>navigate("/dashboard")}
                  style={{
                    width:"100%", padding:"0.8rem",
                    background:"linear-gradient(135deg,#c9a84c,#a07830)",
                    border:"none", borderRadius:8, color:"#0a0a0a",
                    fontFamily:"Cinzel,serif", fontSize:"0.78rem",
                    letterSpacing:"0.12em", cursor:"pointer", fontWeight:700,
                  }}
                >RETURN TO ARENA</motion.button>
              </motion.div>
            )}
          </AnimatePresence>
 
          {/* Debate Info */}
          {phase==="waiting" && (
            <div style={{ padding:"1.5rem" }}>
              <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.72rem", color:"#4a4540", letterSpacing:"0.1em", marginBottom:"1rem" }}>DEBATE INFO</div>
              {[
                { label:"Topic", value:debate?.topic },
                { label:"Division", value:debate?.division },
                { label:"Mode", value:debate?.mode },
                { label:"Language", value:debate?.language },
              ].map(item=>(
                <div key={item.label} style={{ marginBottom:"0.8rem" }}>
                  <div style={{ fontSize:"0.62rem", color:"#3a3530", fontFamily:"Inter,sans-serif", letterSpacing:"0.08em" }}>{item.label}</div>
                  <div style={{ fontFamily:"Inter,sans-serif", fontSize:"0.82rem", color:"#f5f0e8", marginTop:"0.1rem" }}>{item.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
 
export default DebateRoom;