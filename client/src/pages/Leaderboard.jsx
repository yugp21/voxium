import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import api from "../services/api";
 
const useResponsive = () => {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => { const h = () => setW(window.innerWidth); window.addEventListener("resize",h); return()=>window.removeEventListener("resize",h); },[]);
  return { isMobile: w<640, isTablet: w>=640&&w<1024 };
};
 
const TIER_COLORS = {
  Wanderer:"#8a8070", Vanguard:"#6b9fb8", Oracle:"#9b7fd4",
  Ascendant:"#4caf82", Sovereign:"#c9a84c", Conqueror:"#e8604c", Immortal:"#ffffff",
};
const TIER_ICONS = {
  Wanderer:"🗺️", Vanguard:"⚔️", Oracle:"🔮",
  Ascendant:"🌟", Sovereign:"👑", Conqueror:"🔥", Immortal:"⚡",
};
 
const TABS = ["Global","Country"];
 
// ─── RANK BADGE ───────────────────────────────────────────────────
const RankBadge = ({ rank }) => {
  const colors = { 1:"#FFD700", 2:"#C0C0C0", 3:"#CD7F32" };
  const icons  = { 1:"👑", 2:"🥈", 3:"🥉" };
  if (rank<=3) return (
    <div style={{
      width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",
      justifyContent:"center",background:`${colors[rank]}20`,
      border:`1px solid ${colors[rank]}50`,fontSize:"0.9rem",
    }}>{icons[rank]}</div>
  );
  return (
    <div style={{
      width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",
      justifyContent:"center",background:"#1a1a1a",
      fontFamily:"Cinzel,serif",fontSize:"0.7rem",color:"#4a4540",
    }}>#{rank}</div>
  );
};
 
// ─── PLAYER ROW ───────────────────────────────────────────────────
const PlayerRow = ({ player, index, isMe, isMobile }) => {
  const navigate = useNavigate();
  const tierColor = TIER_COLORS[player.tier] || "#8a8070";
  const tierIcon  = TIER_ICONS[player.tier]  || "🗺️";
 
  return (
    <motion.div
      initial={{ opacity:0, y:20 }}
      animate={{ opacity:1, y:0 }}
      transition={{ delay: index*0.04 }}
      onClick={() => navigate(`/profile/${player.username}`)}
      style={{
        display:"flex", alignItems:"center",
        gap: isMobile ? "0.8rem" : "1.2rem",
        padding: isMobile ? "0.9rem 1rem" : "1rem 1.5rem",
        background: isMe ? "#1a1408" : index%2===0 ? "#0d0d0d" : "transparent",
        border: isMe ? "1px solid #c9a84c30" : "1px solid transparent",
        borderRadius:10, cursor:"pointer",
        transition:"all 0.2s",
      }}
      whileHover={{ background:"#141414", borderColor:"#2a2a2a" }}
    >
      {/* Rank */}
      <div style={{ minWidth:32 }}>
        <RankBadge rank={player.rank} />
      </div>
 
      {/* Avatar */}
      <div style={{
        width: isMobile?36:44, height: isMobile?36:44,
        borderRadius:"50%", overflow:"hidden",
        border:`2px solid ${tierColor}40`, flexShrink:0,
        background:"#1a1a1a", display:"flex",
        alignItems:"center", justifyContent:"center",
      }}>
        {player.profileImage ? (
          <img src={player.profileImage} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        ) : (
          <span style={{ fontSize:"1rem" }}>{tierIcon}</span>
        )}
      </div>
 
      {/* Name + username */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          fontFamily:"Cinzel,serif", fontSize: isMobile?"0.8rem":"0.9rem",
          color: isMe ? "#c9a84c" : "#f5f0e8", fontWeight:600,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
        }}>
          {player.name} {isMe && <span style={{fontSize:"0.6rem",color:"#c9a84c"}}>(YOU)</span>}
        </div>
        <div style={{
          fontSize:"0.68rem", color:"#4a4540",
          fontFamily:"Inter,sans-serif", marginTop:"0.1rem",
        }}>@{player.username} · {player.country}</div>
      </div>
 
      {/* Tier */}
      {!isMobile && (
        <div style={{
          fontFamily:"Cinzel,serif", fontSize:"0.72rem",
          color:tierColor, letterSpacing:"0.08em", minWidth:80, textAlign:"center",
        }}>{player.tier}</div>
      )}
 
      {/* Win Rate */}
      {!isMobile && (
        <div style={{
          fontFamily:"JetBrains Mono,monospace", fontSize:"0.75rem",
          color:"#4caf82", minWidth:50, textAlign:"center",
        }}>{player["stats.winRate"]||player.stats?.winRate||0}%</div>
      )}
 
      {/* ELO */}
      <div style={{
        fontFamily:"JetBrains Mono,monospace",
        fontSize: isMobile?"0.85rem":"1rem",
        color:"#c9a84c", fontWeight:700, minWidth: isMobile?50:70, textAlign:"right",
      }}>{player.elo}</div>
    </motion.div>
  );
};
 
// ─── MAIN LEADERBOARD ─────────────────────────────────────────────
const Leaderboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector(s=>s.auth);
  const { isMobile, isTablet } = useResponsive();
  const [tab, setTab] = useState("Global");
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState(null);
 
  useEffect(() => {
    fetchLeaderboard();
  }, [tab]);
 
  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      let res;
      if (tab==="Global") {
        res = await api.get("/leaderboard/global");
      } else {
        res = await api.get(`/leaderboard/country/${user?.country || "India"}`);
      }
      setPlayers(res.data.data || []);
 
      // Get my rank
      if (user?._id) {
        const rankRes = await api.get(`/leaderboard/rank/${user._id}`);
        setMyRank(rankRes.data.data?.rank);
      }
    } catch {
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };
 
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
        <div style={{
          fontFamily:"Cinzel Decorative,serif",
          fontSize: isMobile?"0.85rem":"1rem",
          color:"#c9a84c", letterSpacing:"0.2em", cursor:"pointer",
        }} onClick={()=>navigate("/dashboard")}>UDA</div>
        <motion.button
          whileHover={{scale:1.05}} whileTap={{scale:0.95}}
          onClick={()=>navigate("/dashboard")}
          style={{
            background:"transparent", border:"1px solid #2a2a2a",
            color:"#8a8070", padding:"0.4rem 1rem",
            fontFamily:"Cinzel,serif", fontSize:"0.68rem",
            letterSpacing:"0.1em", cursor:"pointer", borderRadius:6,
          }}
        >← DASHBOARD</motion.button>
      </nav>
 
      <div style={{
        maxWidth:900, margin:"0 auto",
        padding: isMobile ? "5rem 1rem 2rem" : "5rem 2rem 2rem",
      }}>
        {/* Header */}
        <motion.div
          initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
          style={{ textAlign:"center", marginBottom:"2.5rem" }}
        >
          <div style={{
            fontFamily:"JetBrains Mono,monospace", fontSize:"0.62rem",
            color:"#c9a84c", letterSpacing:"0.4em", marginBottom:"0.8rem",
          }}>HALL OF FAME</div>
          <h1 style={{
            fontFamily:"Cinzel,serif",
            fontSize: isMobile?"1.8rem":"clamp(2rem,5vw,3rem)",
            color:"#f5f0e8", fontWeight:700, marginBottom:"0.5rem",
          }}>Global Leaderboard</h1>
          <p style={{ color:"#4a4540", fontSize:"0.82rem", fontFamily:"Inter,sans-serif" }}>
            The greatest debaters in the arena
          </p>
 
          {/* My rank pill */}
          {myRank && (
            <motion.div
              initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}}
              transition={{delay:0.3}}
              style={{
                display:"inline-flex", alignItems:"center", gap:"0.5rem",
                background:"#1a1408", border:"1px solid #c9a84c30",
                borderRadius:20, padding:"0.4rem 1rem", marginTop:"1rem",
                fontFamily:"Inter,sans-serif", fontSize:"0.75rem", color:"#c9a84c",
              }}
            >
              <span>⚔️</span>
              Your Rank: <strong>#{myRank}</strong>
            </motion.div>
          )}
        </motion.div>
 
        {/* Tabs */}
        <div style={{
          display:"flex", gap:"0.5rem",
          marginBottom:"1.5rem",
          background:"#111", border:"1px solid #1e1e1e",
          borderRadius:10, padding:"0.3rem",
          width:"fit-content",
        }}>
          {TABS.map(t => (
            <motion.button key={t}
              onClick={()=>setTab(t)}
              style={{
                padding:"0.5rem 1.5rem", borderRadius:8,
                background: tab===t ? "linear-gradient(135deg,#c9a84c,#a07830)" : "transparent",
                border:"none", color: tab===t ? "#0a0a0a" : "#8a8070",
                fontFamily:"Cinzel,serif", fontSize:"0.72rem",
                letterSpacing:"0.1em", cursor:"pointer", fontWeight: tab===t ? 700 : 400,
                transition:"all 0.2s",
              }}
            >{t}</motion.button>
          ))}
        </div>
 
        {/* Table Header */}
        {!isMobile && (
          <div style={{
            display:"flex", alignItems:"center",
            gap:"1.2rem", padding:"0.6rem 1.5rem",
            marginBottom:"0.5rem",
          }}>
            <div style={{minWidth:32}}/>
            <div style={{minWidth:44}}/>
            <div style={{flex:1, fontSize:"0.62rem", color:"#4a4540", fontFamily:"Cinzel,serif", letterSpacing:"0.1em"}}>PLAYER</div>
            <div style={{minWidth:80, textAlign:"center", fontSize:"0.62rem", color:"#4a4540", fontFamily:"Cinzel,serif", letterSpacing:"0.1em"}}>TIER</div>
            <div style={{minWidth:50, textAlign:"center", fontSize:"0.62rem", color:"#4a4540", fontFamily:"Cinzel,serif", letterSpacing:"0.1em"}}>WIN%</div>
            <div style={{minWidth:70, textAlign:"right", fontSize:"0.62rem", color:"#4a4540", fontFamily:"Cinzel,serif", letterSpacing:"0.1em"}}>ELO</div>
          </div>
        )}
 
        {/* Players List */}
        <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
          {loading ? (
            Array.from({length:8}).map((_,i) => (
              <motion.div key={i}
                animate={{ opacity:[0.3,0.6,0.3] }}
                transition={{ duration:1.5, repeat:Infinity, delay:i*0.1 }}
                style={{
                  height:64, background:"#111", borderRadius:10,
                  border:"1px solid #1a1a1a",
                }}
              />
            ))
          ) : players.length===0 ? (
            <div style={{ textAlign:"center", padding:"4rem 1rem" }}>
              <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>🏛️</div>
              <div style={{ fontFamily:"Cinzel,serif", color:"#f5f0e8", marginBottom:"0.5rem" }}>
                No Players Yet
              </div>
              <div style={{ fontSize:"0.78rem", color:"#4a4540", fontFamily:"Inter,sans-serif" }}>
                Be the first legend in this category
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {players.map((player, i) => (
                <PlayerRow
                  key={player._id}
                  player={player}
                  index={i}
                  isMe={player._id===user?._id}
                  isMobile={isMobile}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};
 
export default Leaderboard;