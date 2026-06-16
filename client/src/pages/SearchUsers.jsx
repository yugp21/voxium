import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";

const useResponsive = () => {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => { const h=()=>setW(window.innerWidth); window.addEventListener("resize",h); return()=>window.removeEventListener("resize",h); },[]);
  return { isMobile:w<640 };
};

const TIER_COLORS = { Wanderer:"#8a8070",Vanguard:"#6b9fb8",Oracle:"#9b7fd4",Ascendant:"#4caf82",Sovereign:"#c9a84c",Conqueror:"#e8604c",Immortal:"#ffffff" };
const TIER_ICONS  = { Wanderer:"🗺️",Vanguard:"⚔️",Oracle:"🔮",Ascendant:"🌟",Sovereign:"👑",Conqueror:"🔥",Immortal:"⚡" };

const SearchUsers = () => {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); setSearched(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(()=>search(query), 400);
    return ()=>clearTimeout(debounceRef.current);
  }, [query]);

  const search = async (q) => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get(`/users/search?q=${q}`);
      setResults(res.data.data||[]);
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ background:"#0a0a0a", minHeight:"100vh" }}>
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:100,
        padding:isMobile?"0.9rem 1.2rem":"0.9rem 2rem",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        background:"#0f0f0fF0", backdropFilter:"blur(12px)",
        borderBottom:"1px solid #1a1a1a",
      }}>
        <div style={{ fontFamily:"Cinzel Decorative,serif", fontSize:isMobile?"0.85rem":"1rem", color:"#c9a84c", letterSpacing:"0.2em", cursor:"pointer" }} onClick={()=>navigate("/dashboard")}>VOXIUM</div>
        <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={()=>navigate("/dashboard")}
          style={{ background:"transparent", border:"1px solid #2a2a2a", color:"#8a8070", padding:"0.4rem 1rem", fontFamily:"Cinzel,serif", fontSize:"0.68rem", letterSpacing:"0.1em", cursor:"pointer", borderRadius:6 }}
        >← DASHBOARD</motion.button>
      </nav>

      <div style={{ maxWidth:700, margin:"0 auto", padding:isMobile?"5rem 1rem 2rem":"5rem 2rem 2rem" }}>
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} style={{ marginBottom:"2rem", textAlign:"center" }}>
          <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.62rem", color:"#c9a84c", letterSpacing:"0.4em", marginBottom:"0.8rem" }}>FIND LEGENDS</div>
          <h1 style={{ fontFamily:"Cinzel,serif", fontSize:isMobile?"1.5rem":"2rem", color:"#f5f0e8", fontWeight:700, marginBottom:"1.5rem" }}>Search Players</h1>

          {/* Search Input */}
          <div style={{ position:"relative", maxWidth:500, margin:"0 auto" }}>
            <div style={{ position:"absolute", left:"1rem", top:"50%", transform:"translateY(-50%)", fontSize:"1rem", pointerEvents:"none" }}>🔍</div>
            <input
              value={query}
              onChange={e=>setQuery(e.target.value)}
              placeholder="Search by name or username..."
              autoFocus
              style={{
                width:"100%", padding:"0.9rem 1rem 0.9rem 3rem",
                background:"#111", border:"1px solid #2a2a2a",
                borderRadius:10, color:"#f5f0e8",
                fontFamily:"Inter,sans-serif", fontSize:"0.9rem",
                outline:"none", transition:"border-color 0.2s",
              }}
              onFocus={e=>e.target.style.borderColor="#c9a84c50"}
              onBlur={e=>e.target.style.borderColor="#2a2a2a"}
            />
            {loading && (
              <motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:"linear"}}
                style={{ position:"absolute", right:"1rem", top:"50%", transform:"translateY(-50%)", fontSize:"0.8rem", color:"#c9a84c" }}
              >◆</motion.div>
            )}
          </div>
          <div style={{ fontSize:"0.68rem", color:"#3a3530", fontFamily:"Inter,sans-serif", marginTop:"0.5rem" }}>
            Type at least 2 characters to search
          </div>
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {results.length>0 && (
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
              <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.68rem", color:"#4a4540", letterSpacing:"0.1em", marginBottom:"0.8rem" }}>
                {results.length} RESULT{results.length!==1?"S":""}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
                {results.map((player,i)=>{
                  const tierColor = TIER_COLORS[player.tier]||"#8a8070";
                  const tierIcon  = TIER_ICONS[player.tier]||"🗺️";
                  return (
                    <motion.div key={player._id}
                      initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}
                      whileHover={{borderColor:`${tierColor}30`,x:4}}
                      onClick={()=>navigate(`/profile/${player.username}`)}
                      style={{
                        display:"flex", alignItems:"center", gap:"1rem",
                        padding:"1rem 1.2rem", background:"#111",
                        border:"1px solid #1e1e1e", borderRadius:10,
                        cursor:"pointer", transition:"all 0.2s",
                      }}
                    >
                      <div style={{ width:48,height:48,borderRadius:"50%",background:"#1a1a1a",border:`2px solid ${tierColor}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.3rem",flexShrink:0 }}>
                        {player.profileImage
                          ? <img src={player.profileImage} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}} alt=""/>
                          : tierIcon
                        }
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.9rem", color:"#f5f0e8", fontWeight:600, marginBottom:"0.2rem" }}>{player.name}</div>
                        <div style={{ fontSize:"0.72rem", color:"#4a4540", fontFamily:"Inter,sans-serif" }}>@{player.username} · {player.country}</div>
                      </div>
                      <div style={{ textAlign:"right", flexShrink:0 }}>
                        <div style={{ fontFamily:"Cinzel,serif", fontSize:"0.72rem", color:tierColor, letterSpacing:"0.08em" }}>{player.tier}</div>
                        <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.78rem", color:"#c9a84c", marginTop:"0.1rem" }}>{player.elo} ELO</div>
                      </div>
                      <div style={{ color:"#4a4540", fontSize:"0.8rem" }}>→</div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {searched && !loading && results.length===0 && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{ textAlign:"center", padding:"4rem 1rem" }}>
              <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>🔍</div>
              <div style={{ fontFamily:"Cinzel,serif", color:"#f5f0e8", marginBottom:"0.5rem" }}>No Players Found</div>
              <div style={{ fontSize:"0.78rem", color:"#4a4540", fontFamily:"Inter,sans-serif" }}>Try a different name or username</div>
            </motion.div>
          )}

          {!searched && !loading && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{ textAlign:"center", padding:"4rem 1rem" }}>
              <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>⚔️</div>
              <div style={{ fontFamily:"Cinzel,serif", color:"#4a4540", fontSize:"0.88rem" }}>Search for legends in the arena</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SearchUsers;