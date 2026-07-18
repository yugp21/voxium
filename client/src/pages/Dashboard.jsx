import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useSelector } from "react-redux";
import api from "../services/api";

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

// ─── AMBIENT BACKGROUND ───────────────────────────────────────────
// Same treatment as Landing.jsx (subtle radial gold glow + drifting
// particles) so the app-shell pages don't feel like a different product
// from the marketing page.
const AmbientGlow = () => (
  <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
    <div style={{
      position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)",
      width: 900, height: 900,
      background: "radial-gradient(circle, #c9a84c08 0%, transparent 70%)",
    }} />
    {Array.from({ length: 14 }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.5, 0], y: [0, -40, -80] }}
        transition={{ duration: 6 + (i % 5), repeat: Infinity, delay: i * 0.7, ease: "easeInOut" }}
        style={{
          position: "absolute",
          left: `${(i * 137) % 100}%`,
          top: `${(i * 71) % 100}%`,
          width: 2, height: 2, borderRadius: "50%",
          background: `rgba(201,168,76,${0.15 + (i % 4) * 0.08})`,
        }}
      />
    ))}
  </div>
);

// ─── STAT CARD (3D tilt) ──────────────────────────────────────────
// Real mouse-tracked perspective tilt, not a flat hover lift — the card
// rotates in 3D space toward the cursor and has a specular highlight
// that follows it, then eases back flat on mouse leave.
const StatCard = ({ label, value, sub, color, icon, index }) => {
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotateX = useTransform(my, [0, 1], [10, -10]);
  const rotateY = useTransform(mx, [0, 1], [-10, 10]);
  const glowX = useTransform(mx, [0, 1], ["0%", "100%"]);
  const glowY = useTransform(my, [0, 1], ["0%", "100%"]);

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  };
  const handleLeave = () => { mx.set(0.5); my.set(0.5); };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        background: "#111", border: "1px solid #1e1e1e",
        borderRadius: 12, padding: "1.2rem 1.4rem",
        position: "relative", overflow: "hidden", cursor: "default",
        transformStyle: "preserve-3d", perspective: 800,
        rotateX, rotateY,
      }}
    >
      {/* Specular highlight that follows the cursor */}
      <motion.div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: useTransform(
          [glowX, glowY],
          ([gx, gy]) => `radial-gradient(circle at ${gx} ${gy}, ${color}18 0%, transparent 55%)`
        ),
      }} />
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${color}60, transparent)`,
      }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
        <div>
          <div style={{
            fontFamily: "Inter, sans-serif", fontSize: "0.7rem",
            color: "#4a4540", letterSpacing: "0.1em",
            textTransform: "uppercase", marginBottom: "0.5rem",
          }}>{label}</div>
          <div style={{
            fontFamily: "Cinzel, serif", fontSize: "clamp(1.4rem,3vw,2rem)",
            color, fontWeight: 700, lineHeight: 1,
          }}>{value}</div>
          {sub && <div style={{
            fontSize: "0.7rem", color: "#4a4540",
            fontFamily: "Inter, sans-serif", marginTop: "0.3rem",
          }}>{sub}</div>}
        </div>
        <div style={{ fontSize: "1.5rem", opacity: 0.6, transform: "translateZ(20px)" }}>{icon}</div>
      </div>
    </motion.div>
  );
};

// ─── MAIN DASHBOARD ───────────────────────────────────────────────
// Note: the page-level Navbar was removed from here — Dashboard is now
// wrapped by <Layout> in App.jsx, which already renders the shared
// Navbar. Keeping both would have shown two stacked nav bars.
const Dashboard = () => {
  const navigate = useNavigate();
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

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div style={{ background:"#0a0a0a", minHeight:"100vh", position: "relative" }}>
      <AmbientGlow />

      <div style={{
        maxWidth:1200, margin:"0 auto", position: "relative", zIndex: 1,
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
              <motion.span
                animate={{ filter: ["drop-shadow(0 0 0px transparent)", `drop-shadow(0 0 10px ${tier.color}80)`, "drop-shadow(0 0 0px transparent)"] }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{ fontSize:"1.8rem" }}
              >{tier.icon}</motion.span>
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
            initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:"-40px" }}
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
                    whileHover={{ x: 3, borderColor: "#c9a84c30" }}
                    style={{
                      display:"flex", justifyContent:"space-between",
                      alignItems:"center", padding:"0.8rem 1rem",
                      background:"#0d0d0d", borderRadius:8,
                      border:"1px solid #1a1a1a", gap:"1rem",
                      cursor: "pointer", transition: "border-color 0.2s",
                    }}
                    onClick={() => navigate(`/result/${debate._id}`)}
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
              initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:"-40px" }}
              transition={{ delay:0.35 }}
              style={{
                background:"linear-gradient(135deg,#1a1408,#111)",
                border:"1px solid #c9a84c25",
                borderRadius:12, padding:"1.5rem", textAlign:"center",
                position: "relative", overflow: "hidden",
              }}
            >
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                style={{
                  position: "absolute", inset: 0,
                  background: "radial-gradient(circle at 50% 0%, #c9a84c15 0%, transparent 60%)",
                }}
              />
              <div style={{ position: "relative" }}>
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
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:"-40px" }}
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
                initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:"-40px" }}
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