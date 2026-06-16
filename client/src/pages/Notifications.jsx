import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { setNotifications, markRead, clearUnread } from "../redux/slices/notificationSlice";
import api from "../services/api";
import toast from "react-hot-toast";
 
const useResponsive = () => {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => { const h=()=>setW(window.innerWidth); window.addEventListener("resize",h); return()=>window.removeEventListener("resize",h); },[]);
  return { isMobile:w<640 };
};
 
const NOTIF_ICONS = {
  match_found:"⚔️", debate_result:"🏆", new_follower:"👤",
  jury_request:"⚖️", achievement:"🥇", tier_up:"⬆️",
  tier_down:"⬇️", general:"🔔",
};
 
const NOTIF_COLORS = {
  match_found:"#c9a84c", debate_result:"#4caf82", new_follower:"#6b9fb8",
  jury_request:"#9b7fd4", achievement:"#f39c12", tier_up:"#4caf82",
  tier_down:"#e8604c", general:"#8a8070",
};
 
const NotifCard = ({ notif, onRead, onDelete }) => {
  const color = NOTIF_COLORS[notif.type] || "#8a8070";
  const icon  = NOTIF_ICONS[notif.type]  || "🔔";
  const timeAgo = (date) => {
    const s = Math.floor((Date.now()-new Date(date))/1000);
    if (s<60) return "just now";
    if (s<3600) return `${Math.floor(s/60)}m ago`;
    if (s<86400) return `${Math.floor(s/3600)}h ago`;
    return `${Math.floor(s/86400)}d ago`;
  };
 
  return (
    <motion.div
      initial={{ opacity:0, x:-20 }}
      animate={{ opacity:1, x:0 }}
      exit={{ opacity:0, x:20 }}
      layout
      style={{
        display:"flex", alignItems:"flex-start", gap:"1rem",
        padding:"1rem 1.2rem",
        background: notif.isRead ? "#0d0d0d" : "#111",
        border: `1px solid ${notif.isRead?"#1a1a1a":color+"25"}`,
        borderRadius:10, position:"relative", overflow:"hidden",
        cursor:"pointer",
      }}
      onClick={() => !notif.isRead && onRead(notif._id)}
      whileHover={{ borderColor:`${color}30` }}
    >
      {/* Unread indicator */}
      {!notif.isRead && (
        <div style={{
          position:"absolute", top:0, left:0, bottom:0, width:3,
          background:`linear-gradient(180deg,${color},${color}50)`,
        }}/>
      )}
 
      {/* Icon */}
      <div style={{
        width:40, height:40, borderRadius:"50%", flexShrink:0,
        background:`${color}15`, border:`1px solid ${color}30`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:"1.1rem",
      }}>{icon}</div>
 
      {/* Content */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          fontFamily:"Cinzel,serif", fontSize:"0.8rem",
          color: notif.isRead?"#8a8070":"#f5f0e8",
          fontWeight: notif.isRead?400:600, marginBottom:"0.25rem",
        }}>{notif.title}</div>
        <div style={{
          fontFamily:"Inter,sans-serif", fontSize:"0.75rem",
          color:"#4a4540", lineHeight:1.5, marginBottom:"0.3rem",
        }}>{notif.message}</div>
        <div style={{
          fontFamily:"JetBrains Mono,monospace", fontSize:"0.6rem",
          color:"#3a3530",
        }}>{timeAgo(notif.createdAt)}</div>
      </div>
 
      {/* Delete */}
      <motion.button
        whileHover={{scale:1.1,color:"#e8604c"}}
        onClick={e=>{e.stopPropagation();onDelete(notif._id);}}
        style={{
          background:"transparent", border:"none",
          color:"#3a3530", cursor:"pointer", fontSize:"0.8rem",
          padding:"0.2rem", flexShrink:0,
        }}
      >✕</motion.button>
    </motion.div>
  );
};
 
const Notifications = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isMobile } = useResponsive();
  const { list, unreadCount } = useSelector(s=>s.notifications);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all|unread
 
  useEffect(() => { fetchNotifications(); }, []);
 
  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      dispatch(setNotifications(res.data.data));
    } catch { toast.error("Failed to load notifications"); }
    finally { setLoading(false); }
  };
 
  const handleRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      dispatch(markRead(id));
    } catch {}
  };
 
  const handleReadAll = async () => {
    try {
      await api.put("/notifications/read-all");
      dispatch(clearUnread());
      // Mark all as read in list
      list.forEach(n => { if(!n.isRead) dispatch(markRead(n._id)); });
      toast.success("All marked as read");
    } catch {}
  };
 
  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      dispatch(setNotifications({ notifications:list.filter(n=>n._id!==id), unreadCount }));
      toast.success("Deleted");
    } catch {}
  };
 
  const filtered = filter==="unread" ? list.filter(n=>!n.isRead) : list;
 
  return (
    <div style={{ background:"#0a0a0a", minHeight:"100vh" }}>
      {/* Navbar */}
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
        {/* Header */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} style={{ marginBottom:"2rem" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem" }}>
            <div>
              <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.62rem", color:"#c9a84c", letterSpacing:"0.4em", marginBottom:"0.5rem" }}>ARENA UPDATES</div>
              <h1 style={{ fontFamily:"Cinzel,serif", fontSize:isMobile?"1.5rem":"2rem", color:"#f5f0e8", fontWeight:700 }}>
                Notifications
                {unreadCount>0 && (
                  <span style={{ marginLeft:"0.8rem", background:"#c9a84c", color:"#0a0a0a", borderRadius:20, padding:"0.1rem 0.6rem", fontSize:"0.75rem", fontFamily:"Inter,sans-serif", fontWeight:700 }}>
                    {unreadCount}
                  </span>
                )}
              </h1>
            </div>
            {unreadCount>0 && (
              <motion.button whileHover={{scale:1.04}} whileTap={{scale:0.96}} onClick={handleReadAll}
                style={{ padding:"0.5rem 1.2rem", background:"transparent", border:"1px solid #c9a84c30", borderRadius:8, color:"#c9a84c", fontFamily:"Cinzel,serif", fontSize:"0.68rem", letterSpacing:"0.1em", cursor:"pointer" }}
              >MARK ALL READ</motion.button>
            )}
          </div>
 
          {/* Filter tabs */}
          <div style={{ display:"flex", gap:"0.4rem", marginTop:"1.2rem" }}>
            {["all","unread"].map(f=>(
              <motion.button key={f} whileHover={{scale:1.03}} whileTap={{scale:0.97}} onClick={()=>setFilter(f)}
                style={{ padding:"0.4rem 1.2rem", borderRadius:20, cursor:"pointer", background:filter===f?"linear-gradient(135deg,#c9a84c,#a07830)":"transparent", border:filter===f?"none":"1px solid #2a2a2a", color:filter===f?"#0a0a0a":"#8a8070", fontFamily:"Cinzel,serif", fontSize:"0.68rem", letterSpacing:"0.08em", fontWeight:filter===f?700:400, transition:"all 0.2s" }}
              >{f.toUpperCase()}</motion.button>
            ))}
          </div>
        </motion.div>
 
        {/* List */}
        {loading ? (
          Array.from({length:5}).map((_,i)=>(
            <motion.div key={i} animate={{opacity:[0.3,0.6,0.3]}} transition={{duration:1.5,repeat:Infinity,delay:i*0.1}}
              style={{ height:80, background:"#111", borderRadius:10, border:"1px solid #1a1a1a", marginBottom:"0.6rem" }}
            />
          ))
        ) : filtered.length===0 ? (
          <div style={{ textAlign:"center", padding:"5rem 1rem" }}>
            <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>🔔</div>
            <div style={{ fontFamily:"Cinzel,serif", color:"#f5f0e8", marginBottom:"0.5rem", fontSize:"0.95rem" }}>
              {filter==="unread" ? "No unread notifications" : "No notifications yet"}
            </div>
            <div style={{ fontSize:"0.78rem", color:"#4a4540", fontFamily:"Inter,sans-serif" }}>
              Debate, win, and follow others to get updates
            </div>
          </div>
        ) : (
          <AnimatePresence>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
              {filtered.map(n=>(
                <NotifCard key={n._id} notif={n} onRead={handleRead} onDelete={handleDelete}/>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
 
export default Notifications;