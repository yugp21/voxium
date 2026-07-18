import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { clearUser } from "../redux/slices/authSlice";
import { authService } from "../services/authService";
import api from "../services/api";
import toast from "react-hot-toast";
 
// ─── RESPONSIVE HOOK ──────────────────────────────────────────────
const useResponsive = () => {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return { isMobile: w < 640, isTablet: w >= 640 && w < 1024 };
};
 
// ─── TIER DATA ────────────────────────────────────────────────────
const TIER_DATA = {
  Wanderer:  { color:"#8a8070", next:"Vanguard",  nextElo:500,  icon:"🗺️" },
  Vanguard:  { color:"#6b9fb8", next:"Oracle",    nextElo:1000, icon:"⚔️" },
  Oracle:    { color:"#9b7fd4", next:"Ascendant", nextElo:1500, icon:"🔮" },
  Ascendant: { color:"#4caf82", next:"Sovereign", nextElo:2000, icon:"🌟" },
  Sovereign: { color:"#c9a84c", next:"Conqueror", nextElo:2500, icon:"👑" },
  Conqueror: { color:"#e8604c", next:"Immortal",  nextElo:3000, icon:"🔥" },
  Immortal:  { color:"#ffffff", next:null,         nextElo:null, icon:"⚡" },
};
 
// ─── STAT CARD ────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, color, icon, index }) => (
  <motion.div
    initial={{ opacity:0, y:20 }}
    animate={{ opacity:1, y:0 }}
    transition={{ delay: index*0.08 }}
    style={{
      background:"#111", border:"1px solid #1e1e1e",
      borderRadius:12, padding:"1.2rem 1.4rem",
      position:"relative", overflow:"hidden",
    }}
  >
    <div style={{
      position:"absolute", top:0, left:0, right:0, height:2,
      background:`linear-gradient(90deg, transparent, ${color}60, transparent)`,
    }}/>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
      <div>
        <div style={{
          fontFamily:"Inter, sans-serif", fontSize:"0.7rem",
          color:"#4a4540", letterSpacing:"0.1em",
          textTransform:"uppercase", marginBottom:"0.5rem",
        }}>{label}</div>
        <div style={{
          fontFamily:"Cinzel, serif", fontSize:"clamp(1.4rem,3vw,2rem)",
          color, fontWeight:700, lineHeight:1,
        }}>{value}</div>
        {sub && <div style={{
          fontSize:"0.7rem", color:"#4a4540",
          fontFamily:"Inter, sans-serif", marginTop:"0.3rem",
        }}>{sub}</div>}
      </div>
      <div style={{ fontSize:"1.5rem", opacity:0.6 }}>{icon}</div>
    </div>
  </motion.div>
);
 
// ─── NAVBAR ───────────────────────────────────────────────────────
const Navbar = ({ user, onLogout, isMobile }) => {
  const navigate = useNavigate();
  const tier = TIER_DATA[user?.tier] || TIER_DATA.Wanderer;
  const [menuOpen, setMenuOpen] = useState(false);
 
  return (
    <nav style={{
      position:"fixed", top:0, left:0, right:0, zIndex:100,
      padding: isMobile ? "0.9rem 1.2rem" : "0.9rem 2rem",
      display:"flex", alignItems:"center", justifyContent:"space-between",
      background:"#0f0f0fF0", backdropFilter:"blur(12px)",
      borderBottom:"1px solid #1a1a1a",
    }}>
      <div style={{
        fontFamily:"Cinzel Decorative, serif", fontSize: isMobile ? "0.85rem" : "1rem",
        color:"#c9a84c", letterSpacing:"0.2em", cursor:"pointer",
      }} onClick={() => navigate("/dashboard")}>UDA</div>
 
      {!isMobile && (
        <div style={{ display:"flex", gap:"0.5rem" }}>
          {[
            { label:"Dashboard", path:"/dashboard" },
            { label:"Leaderboard", path:"/leaderboard" },
            { label:"Profile", path:`/profile/${user?.username}` },
          ].map(item => (
            <motion.button key={item.label}
              whileHover={{ color:"#c9a84c" }}
              onClick={() => navigate(item.path)}
              style={{
                background:"transparent", border:"none",
                color:"#8a8070", fontFamily:"Cinzel, serif",
                fontSize:"0.72rem", letterSpacing:"0.1em",
                cursor:"pointer", padding:"0.5rem 1rem",
                transition:"color 0.2s",
              }}
            >{item.label.toUpperCase()}</motion.button>
          ))}
        </div>
      )}
 
      <div style={{ display:"flex", alignItems:"center", gap:"0.8rem" }}>
        <div style={{
          display:"flex", alignItems:"center", gap:"0.5rem",
          background:"#1a1a1a", border:"1px solid #2a2a2a",
          borderRadius:8, padding:"0.4rem 0.8rem",
        }}>
          <span style={{ fontSize:"0.9rem" }}>{tier.icon}</span>
          {!isMobile && (
            <span style={{
              fontFamily:"Cinzel, serif", fontSize:"0.68rem",
              color:tier.color, letterSpacing:"0.08em",
            }}>{user?.tier}</span>
          )}
          <span style={{
            fontFamily:"JetBrains Mono, monospace", fontSize:"0.65rem",
            color:"#c9a84c",
          }}>{user?.elo || 0}</span>
        </div>
 
        <motion.button
          whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
          onClick={onLogout}
          style={{
            background:"transparent", border:"1px solid #2a2a2a",
            color:"#8a8070", padding:"0.4rem 0.8rem",
            fontFamily:"Cinzel, serif", fontSize:"0.65rem",
            letterSpacing:"0.08em", cursor:"pointer", borderRadius:6,
          }}
        >{isMobile ? "OUT" : "LOGOUT"}</motion.button>
      </div>
    </nav>
  );
};
 
// ─── MAIN DASHBOARD ───────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const { isMobile, isTablet } = useResponsive();
  const [recentDebates, setRecentDebates] = useState([]);
  const [loadingDebates, setLoadingDebates] = useState(true);
 
  const tier = TIER_DATA[user?.tier] || TIER_DATA.Wanderer;
  const tierKeys = Object.keys(TIER_DATA);
  const tierIndex = tierKeys.indexOf(user?.tier || "Wanderer");
 
  // ELO progress to next tier
  const currentTierMinElo = [0,500,1000,1500,2000,2500,3000][tierIndex] || 0;
  const nextTierElo = tier.nextElo || (user?.elo + 100);
  const eloProgress = Math.min(((user?.elo - currentTierMinElo) / (nextTierElo - currentTierMinElo)) * 100, 100);
 
  useEffect(() => {
    const fetchDebates = async () => {
      try {
        const res = await api.get(`/debates/history/${user?._id}`);
        setRecentDebates(res.data.data?.slice(0,5) || []);
      } catch {
        setRecentDebates([]);
      } finally {
        setLoadingDebates(false);
      }
    };
    if (user?._id) fetchDebates();
  }, [user]);
 
  const handleLogout = async () => {
    await authService.logout();
    dispatch(clearUser());
    toast.success("See you in the arena!");
    navigate("/");
  };
 
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };
 
  return (
    <div style={{ background:"#0a0a0a", minHeight:"100vh", paddingTop:"60px" }}>
      <Navbar user={user} onLogout={handleLogout} isMobile={isMobile} />
 
      <div style={{
        maxWidth:1200, margin:"0 auto",
        padding: isMobile ? "1.5rem 1rem" : "2rem 2rem",
      }}>
 
        {/* ── WELCOME HEADER ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          style={{ marginBottom:"2rem" }}
        >
          <div style={{
            fontFamily:"JetBrains Mono, monospace", fontSize:"0.65rem",
            color:"#4a4540", letterSpacing:"0.2em", marginBottom:"0.4rem",
          }}>{getGreeting()}</div>
          <h1 style={{
            fontFamily:"Cinzel, serif",
            fontSize: isMobile ? "1.5rem" : "clamp(1.8rem,4vw,2.5rem)",
            color:"#f5f0e8", fontWeight:700, lineHeight:1.2,
          }}>
            Welcome back,{" "}
            <span style={{ color:"#c9a84c" }}>{user?.name || "Legend"}</span>
          </h1>
          <p style={{
            color:"#4a4540", fontSize:"0.82rem",
            fontFamily:"Inter, sans-serif", marginTop:"0.3rem",
          }}>
            {user?.tier} · {user?.elo || 0} ELO · @{user?.username}
          </p>
        </motion.div>
 
        {/* ── TIER PROGRESS ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:0.1 }}
          style={{
            background:"#111", border:`1px solid ${tier.color}25`,
            borderRadius:12, padding:"1.2rem 1.5rem", marginBottom:"1.5rem",
            position:"relative", overflow:"hidden",
          }}
        >
          <div style={{
            position:"absolute", top:0, left:0, right:0, height:2,
            background:`linear-gradient(90deg,transparent,${tier.color},transparent)`,
          }}/>
          <div style={{
            display:"flex", justifyContent:"space-between",
            alignItems:"center", marginBottom:"0.8rem",
            flexWrap:"wrap", gap:"0.5rem",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.8rem" }}>
              <span style={{ fontSize:"1.8rem" }}>{tier.icon}</span>
              <div>
                <div style={{
                  fontFamily:"Cinzel, serif", fontSize:"0.75rem",
                  color:tier.color, letterSpacing:"0.1em",
                }}>{user?.tier?.toUpperCase()}</div>
                <div style={{
                  fontFamily:"JetBrains Mono, monospace",
                  fontSize:"1.1rem", color:"#f5f0e8", fontWeight:700,
                }}>{user?.elo || 0} ELO</div>
              </div>
            </div>
            {tier.next && (
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:"0.68rem", color:"#4a4540", fontFamily:"Inter, sans-serif" }}>
                  Next: {tier.next}
                </div>
                <div style={{ fontSize:"0.72rem", color:"#8a8070", fontFamily:"JetBrains Mono, monospace" }}>
                  {tier.nextElo - (user?.elo||0)} ELO needed
                </div>
              </div>
            )}
          </div>
          {/* Progress bar */}
          <div style={{
            background:"#1a1a1a", borderRadius:4, height:6, overflow:"hidden",
          }}>
            <motion.div
              initial={{ width:0 }}
              animate={{ width:`${eloProgress}%` }}
              transition={{ duration:1.2, delay:0.3, ease:"easeOut" }}
              style={{
                height:"100%", borderRadius:4,
                background:`linear-gradient(90deg,${tier.color}80,${tier.color})`,
              }}
            />
          </div>
          <div style={{
            display:"flex", justifyContent:"space-between",
            marginTop:"0.3rem",
          }}>
            <span style={{ fontSize:"0.62rem", color:"#4a4540", fontFamily:"Inter, sans-serif" }}>
              {currentTierMinElo}
            </span>
            <span style={{ fontSize:"0.62rem", color:"#4a4540", fontFamily:"Inter, sans-serif" }}>
              {tier.next ? tier.nextElo : "∞"}
            </span>
          </div>
        </motion.div>
 
        {/* ── STAT CARDS ─────────────────────────────────────── */}
        <div style={{
          display:"grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : isTablet ? "repeat(3,1fr)" : "repeat(4,1fr)",
          gap:"1rem", marginBottom:"1.5rem",
        }}>
          <StatCard label="Total Wins" value={user?.stats?.wins||0} icon="🏆" color="#c9a84c" index={0}/>
          <StatCard label="Total Losses" value={user?.stats?.losses||0} icon="💀" color="#e8604c" index={1}/>
          <StatCard label="Win Rate" value={`${user?.stats?.winRate||0}%`} icon="📊" color="#4caf82" index={2}/>
          <StatCard label="Debates" value={user?.stats?.totalDebates||0} sub="career total" icon="🎙️" color="#9b7fd4" index={3}/>
        </div>
 
        {/* ── MAIN CONTENT GRID ──────────────────────────────── */}
        <div style={{
          display:"grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 320px",
          gap:"1.5rem",
        }}>
 
          {/* Left — Recent Debates */}
          <motion.div
            initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            transition={{ delay:0.3 }}
            style={{
              background:"#111", border:"1px solid #1e1e1e",
              borderRadius:12, padding:"1.5rem",
            }}
          >
            <div style={{
              fontFamily:"Cinzel, serif", fontSize:"0.82rem",
              color:"#f5f0e8", letterSpacing:"0.1em",
              marginBottom:"1.2rem", fontWeight:600,
            }}>RECENT DEBATES</div>
 
            {loadingDebates ? (
              <div style={{ textAlign:"center", padding:"2rem", color:"#4a4540", fontSize:"0.8rem" }}>
                Loading debates...
              </div>
            ) : recentDebates.length === 0 ? (
              <div style={{ textAlign:"center", padding:"3rem 1rem" }}>
                <div style={{ fontSize:"2.5rem", marginBottom:"1rem" }}>⚔️</div>
                <div style={{
                  fontFamily:"Cinzel, serif", fontSize:"0.85rem",
                  color:"#f5f0e8", marginBottom:"0.5rem",
                }}>No Debates Yet</div>
                <div style={{ fontSize:"0.78rem", color:"#4a4540", fontFamily:"Inter, sans-serif" }}>
                  Your first battle awaits. Enter the arena.
                </div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"0.7rem" }}>
                {recentDebates.map((debate, i) => (
                  <motion.div key={debate._id}
                    initial={{ opacity:0, x:-20 }}
                    animate={{ opacity:1, x:0 }}
                    transition={{ delay:i*0.08 }}
                    style={{
                      display:"flex", justifyContent:"space-between",
                      alignItems:"center", padding:"0.8rem 1rem",
                      background:"#0d0d0d", borderRadius:8,
                      border:"1px solid #1a1a1a", gap:"1rem",
                    }}
                  >
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{
                        fontFamily:"Inter, sans-serif", fontSize:"0.8rem",
                        color:"#f5f0e8", marginBottom:"0.2rem",
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                      }}>{debate.topic}</div>
                      <div style={{ fontSize:"0.68rem", color:"#4a4540", fontFamily:"Inter, sans-serif" }}>
                        {debate.division} · {new Date(debate.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{
                      fontFamily:"Cinzel, serif", fontSize:"0.7rem",
                      color: debate.winner?.toString()===user?._id?.toString() ? "#4caf82" : "#e8604c",
                      letterSpacing:"0.08em", flexShrink:0,
                    }}>
                      {debate.status==="completed"
                        ? debate.winner?.toString()===user?._id?.toString() ? "WIN" : "LOSS"
                        : debate.status.toUpperCase()}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
 
          {/* Right — Quick Actions + Stats */}
          <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
 
            {/* Find Match CTA */}
            <motion.div
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:0.35 }}
              style={{
                background:"linear-gradient(135deg,#1a1408,#111)",
                border:"1px solid #c9a84c25",
                borderRadius:12, padding:"1.5rem", textAlign:"center",
              }}
            >
              <div style={{ fontSize:"2rem", marginBottom:"0.8rem" }}>⚔️</div>
              <div style={{
                fontFamily:"Cinzel, serif", fontSize:"0.9rem",
                color:"#f5f0e8", fontWeight:700, marginBottom:"0.4rem",
              }}>Ready to Debate?</div>
              <div style={{
                fontSize:"0.75rem", color:"#8a8070",
                fontFamily:"Inter, sans-serif", marginBottom:"1.2rem", lineHeight:1.6,
              }}>Find an opponent at your level. Your legend grows one debate at a time.</div>
              <motion.button
                whileHover={{ scale:1.04, boxShadow:"0 0 30px #c9a84c30" }}
                whileTap={{ scale:0.96 }}
                onClick={() => navigate("/matchmaking")}
                style={{
                  width:"100%", padding:"0.9rem",
                  background:"linear-gradient(135deg,#c9a84c,#a07830)",
                  border:"none", borderRadius:8, color:"#0a0a0a",
                  fontFamily:"Cinzel, serif", fontSize:"0.8rem",
                  letterSpacing:"0.12em", cursor:"pointer", fontWeight:700,
                }}
              >FIND MATCH</motion.button>
            </motion.div>
 
            {/* Quick Links */}
            <motion.div
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:0.4 }}
              style={{
                background:"#111", border:"1px solid #1e1e1e",
                borderRadius:12, padding:"1.2rem",
              }}
            >
              <div style={{
                fontFamily:"Cinzel, serif", fontSize:"0.72rem",
                color:"#4a4540", letterSpacing:"0.1em", marginBottom:"0.8rem",
              }}>QUICK ACTIONS</div>
              {[
                { icon:"👤", label:"My Profile", path:`/profile/${user?.username}` },
                { icon:"🏆", label:"Leaderboard", path:"/leaderboard" },
                { icon:"🔔", label:"Notifications", path:"/notifications" },
              ].map((item,i) => (
                <motion.button key={item.label}
                  whileHover={{ x:4, color:"#c9a84c" }}
                  onClick={() => navigate(item.path)}
                  style={{
                    display:"flex", alignItems:"center", gap:"0.8rem",
                    width:"100%", padding:"0.7rem 0.5rem",
                    background:"transparent", border:"none",
                    borderBottom: i<2 ? "1px solid #1a1a1a" : "none",
                    color:"#8a8070", cursor:"pointer",
                    fontFamily:"Inter, sans-serif", fontSize:"0.82rem",
                    transition:"all 0.2s", textAlign:"left",
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  <span style={{ marginLeft:"auto", fontSize:"0.7rem" }}>→</span>
                </motion.button>
              ))}
            </motion.div>
 
            {/* Style Card */}
            {user?.playingStyle && (
              <motion.div
                initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                transition={{ delay:0.45 }}
                style={{
                  background:"#111", border:"1px solid #1e1e1e",
                  borderRadius:12, padding:"1.2rem",
                }}
              >
                <div style={{
                  fontFamily:"Cinzel, serif", fontSize:"0.72rem",
                  color:"#4a4540", letterSpacing:"0.1em", marginBottom:"0.6rem",
                }}>DEBATE STYLE</div>
                <div style={{
                  fontFamily:"Cinzel, serif", fontSize:"1rem",
                  color:"#c9a84c", fontWeight:600,
                }}>{user.playingStyle}</div>
                <div style={{
                  fontSize:"0.72rem", color:"#4a4540",
                  fontFamily:"Inter, sans-serif", marginTop:"0.2rem",
                }}>Your arena identity</div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
 
export default Dashboard;