import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { setNotifications, markRead, clearUnread } from "../redux/slices/notificationSlice";
import api from "../services/api";
import toast from "react-hot-toast";
import { Swords, Trophy, UserPlus, Scale, Award, ArrowUp, ArrowDown, Bell, X } from "lucide-react";
import { COLORS } from "../constants/theme";

const NOTIF_ICONS = {
  match_found: Swords, debate_result: Trophy, new_follower: UserPlus,
  jury_request: Scale, achievement: Award, tier_up: ArrowUp, tier_down: ArrowDown, general: Bell,
};
const NOTIF_COLORS = {
  match_found: COLORS.accent, debate_result: "#4caf82", new_follower: "#4d8cff",
  jury_request: "#a06bff", achievement: "#ffb454", tier_up: "#4caf82", tier_down: "#ff5c7c", general: COLORS.textFaint,
};

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

// ─── TIMELINE ROW ───────────────────────────────────────────────────
// Structural idea: a vertical connecting spine between dots (real
// timeline), not stacked cards — notifications are chronological events,
// so the layout expresses "a sequence in time" rather than "a list of boxes".
const TimelineRow = ({ notif, onRead, onDelete, isLast }) => {
  const color = NOTIF_COLORS[notif.type] || COLORS.textFaint;
  const Icon = NOTIF_ICONS[notif.type] || Bell;
  return (
    <div style={{ display: "flex", gap: "1rem" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          background: notif.isRead ? "transparent" : `${color}15`,
          border: `1.5px solid ${notif.isRead ? COLORS.border : color}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}><Icon size={15} color={notif.isRead ? COLORS.textFaint : color} /></div>
        {!isLast && <div style={{ width: 1, flex: 1, background: COLORS.border, marginTop: 6 }} />}
      </div>
      <motion.div
        initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} layout
        data-cursor="hover" onClick={() => !notif.isRead && onRead(notif._id)}
        style={{ flex: 1, paddingBottom: "1.6rem", cursor: notif.isRead ? "default" : "pointer" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.88rem", fontWeight: notif.isRead ? 500 : 700, color: notif.isRead ? COLORS.textDim : COLORS.text }}>{notif.title}</div>
          <button data-cursor="hover" onClick={(e) => { e.stopPropagation(); onDelete(notif._id); }}
            style={{ background: "transparent", border: "none", color: COLORS.textFaint, cursor: "pointer", flexShrink: 0 }}
          ><X size={14} /></button>
        </div>
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: COLORS.textDim, lineHeight: 1.5, margin: "0.25rem 0" }}>{notif.message}</div>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.62rem", color: COLORS.textFaint }}>{timeAgo(notif.createdAt)}</div>
      </motion.div>
    </div>
  );
};

const Notifications = () => {
  const dispatch = useDispatch();
  const { list, unreadCount } = useSelector((s) => s.notifications);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get("/notifications");
      dispatch(setNotifications(res.data.data));
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      dispatch(markRead(id));
    } catch {
      // Silent by design: a failed read-receipt isn't worth interrupting the user for.
    }
  };
  const handleReadAll = async () => {
    try {
      await api.put("/notifications/read-all");
      dispatch(clearUnread());
      list.forEach((n) => { if (!n.isRead) dispatch(markRead(n._id)); });
      toast.success("All marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };
  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      dispatch(setNotifications({ notifications: list.filter((n) => n._id !== id), unreadCount }));
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  const filtered = filter === "unread" ? list.filter((n) => !n.isRead) : list;

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", fontFamily: "Inter, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "3rem 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
          <div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: COLORS.accent2, letterSpacing: "0.2em", marginBottom: "0.5rem" }}>ARENA UPDATES</div>
            <h1 style={{ fontFamily: "Inter, sans-serif", fontSize: "2rem", fontWeight: 800, color: COLORS.text, display: "flex", alignItems: "center", gap: "0.7rem" }}>
              Notifications
              {unreadCount > 0 && <span style={{ background: COLORS.accent2, color: COLORS.bg, borderRadius: 20, padding: "0.1rem 0.6rem", fontSize: "0.8rem", fontWeight: 700 }}>{unreadCount}</span>}
            </h1>
          </div>
          {unreadCount > 0 && (
            <button data-cursor="hover" onClick={handleReadAll} style={{
              padding: "0.5rem 1.1rem", background: "transparent", border: `1px solid ${COLORS.accentDim}`,
              borderRadius: 8, color: COLORS.accent2, fontFamily: "Inter, sans-serif", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
            }}>Mark all read</button>
          )}
        </div>

        <div style={{ display: "flex", gap: "1.2rem", borderBottom: `1px solid ${COLORS.border}`, marginBottom: "2rem" }}>
          {["all", "unread"].map((f) => (
            <button key={f} data-cursor="hover" onClick={() => setFilter(f)} style={{
              background: "transparent", border: "none", cursor: "pointer", padding: "0.6rem 0",
              fontFamily: "Inter, sans-serif", fontSize: "0.82rem", fontWeight: 600,
              color: filter === f ? COLORS.text : COLORS.textFaint,
              borderBottom: filter === f ? `2px solid ${COLORS.accent2}` : "2px solid transparent", marginBottom: -1,
            }}>{f === "all" ? "All" : "Unread"}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.75rem", color: COLORS.textFaint }}>LOADING...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
            <Bell size={32} color={COLORS.textFaint} strokeWidth={1.5} style={{ marginBottom: "1rem" }} />
            <div style={{ fontFamily: "Inter, sans-serif", color: COLORS.text, marginBottom: "0.4rem", fontWeight: 600 }}>
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </div>
            <div style={{ fontSize: "0.8rem", color: COLORS.textFaint }}>Debate, win, and follow others to get updates</div>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((n, i) => (
              <TimelineRow key={n._id} notif={n} onRead={handleRead} onDelete={handleDelete} isLast={i === filtered.length - 1} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default Notifications;