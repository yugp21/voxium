import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import api from "../services/api";
import toast from "react-hot-toast";
import { ArrowLeft, Sword, Swords, Compass } from "lucide-react";
import { COLORS } from "../constants/theme";

const TIER_COLORS = { Wanderer: "#6b6a80", Vanguard: "#4d8cff", Oracle: "#a06bff", Ascendant: "#4caf82", Sovereign: "#7c5cff", Conqueror: "#ff5c7c", Immortal: "#00e5ff" };

// ─── PERSON ROW ─────────────────────────────────────────────────────
const PersonRow = ({ person, onToggleFollow, isMe, busy }) => {
  const navigate = useNavigate();
  const tierColor = TIER_COLORS[person.tier] || "#6b6a80";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 0", borderTop: `1px solid ${COLORS.border}` }}>
      <div data-cursor="hover" onClick={() => navigate(`/profile/${person.username}`)}
        style={{
          width: 44, height: 44, borderRadius: "50%", overflow: "hidden",
          border: `1.5px solid ${tierColor}50`, background: COLORS.bgElevated,
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
        }}
      >
        {person.profileImage
          ? <img src={person.profileImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <Sword size={16} color={tierColor} strokeWidth={1.75} />}
      </div>
      <div data-cursor="hover" onClick={() => navigate(`/profile/${person.username}`)} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.9rem", fontWeight: 600, color: COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{person.name}</div>
        <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.75rem", color: COLORS.textFaint }}>
          @{person.username} · <span style={{ color: tierColor }}>{person.tier}</span>
        </div>
        {person.isFollowing && person.followsYou && (
          <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.65rem", color: COLORS.accent2, marginTop: "0.15rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <Swords size={10} /> Mutual
          </div>
        )}
      </div>
      {!isMe && (
        <button data-cursor="hover" disabled={busy} onClick={() => onToggleFollow(person)} style={{
          padding: "0.4rem 1rem", flexShrink: 0,
          background: person.isFollowing ? "transparent" : `linear-gradient(135deg,${COLORS.accent},#5a3fd6)`,
          border: person.isFollowing ? `1px solid ${COLORS.border}` : "none",
          borderRadius: 20, color: person.isFollowing ? COLORS.textDim : "#fff",
          fontFamily: "Inter,sans-serif", fontSize: "0.75rem", fontWeight: 600,
          cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1,
        }}>{person.isFollowing ? "Following" : person.followsYou ? "Follow Back" : "Follow"}</button>
      )}
    </div>
  );
};

// ─── MAIN ─────────────────────────────────────────────────────────
const FollowList = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: me } = useSelector((s) => s.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "following" ? "following" : "followers";

  const [tab, setTab] = useState(initialTab);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const fetchList = useCallback(async (pageNum = 1, replace = true) => {
    setLoading(true);
    try {
      const res = await api.get(`/users/${username}/${tab}`, { params: { page: pageNum, limit: 20 } });
      const { users: newUsers, total: t, hasMore: more } = res.data.data;
      setUsers((prev) => (replace ? newUsers : [...prev, ...newUsers]));
      setTotal(t);
      setHasMore(more);
      setPage(pageNum);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to load ${tab}`);
    } finally {
      setLoading(false);
    }
  }, [username, tab]);

  useEffect(() => { fetchList(1, true); }, [fetchList]);

  const switchTab = (t) => { setTab(t); setSearchParams({ tab: t }); };

  const handleToggleFollow = async (person) => {
    if (busyId) return;
    setBusyId(person._id);
    try {
      if (person.isFollowing) {
        await api.delete(`/users/${person._id}/follow`);
        toast.success(`Unfollowed @${person.username}`);
      } else {
        await api.post(`/users/${person._id}/follow`);
        toast.success(`Following @${person.username}`);
      }
      setUsers((prev) => prev.map((u) => u._id === person._id ? { ...u, isFollowing: !u.isFollowing } : u));
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) setUsers((prev) => prev.map((u) => u._id === person._id ? { ...u, isFollowing: true } : u));
      else if (status === 404) setUsers((prev) => prev.map((u) => u._id === person._id ? { ...u, isFollowing: false } : u));
      else toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", fontFamily: "Inter, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 500, margin: "0 auto", padding: "3rem 1.5rem" }}>
        <button data-cursor="hover" onClick={() => navigate(`/profile/${username}`)} style={{
          display: "flex", alignItems: "center", gap: "0.4rem", background: "transparent", border: "none",
          color: COLORS.textFaint, fontFamily: "Inter, sans-serif", fontSize: "0.78rem", cursor: "pointer", marginBottom: "1.5rem", padding: 0,
        }}><ArrowLeft size={14} /> @{username}</button>

        <div style={{ display: "flex", gap: "2rem", borderBottom: `1px solid ${COLORS.border}`, marginBottom: "0.5rem" }}>
          {["followers", "following"].map((t) => (
            <button key={t} data-cursor="hover" onClick={() => switchTab(t)} style={{
              background: "transparent", border: "none", cursor: "pointer", padding: "0.7rem 0",
              fontFamily: "Inter, sans-serif", fontSize: "0.9rem", fontWeight: 700, textTransform: "capitalize",
              color: tab === t ? COLORS.text : COLORS.textFaint,
              borderBottom: tab === t ? `2px solid ${COLORS.accent2}` : "2px solid transparent", marginBottom: -1,
            }}>{t} {tab === t && total > 0 ? `(${total})` : ""}</button>
          ))}
        </div>

        {loading && users.length === 0 ? (
          <div style={{ padding: "3rem 0", textAlign: "center", fontFamily: "JetBrains Mono, monospace", fontSize: "0.75rem", color: COLORS.textFaint }}>LOADING...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: "3rem 0", textAlign: "center" }}>
            <Compass size={30} color={COLORS.textFaint} strokeWidth={1.5} style={{ marginBottom: "0.8rem" }} />
            <div style={{ fontFamily: "Inter, sans-serif", color: COLORS.textDim, fontSize: "0.85rem" }}>No {tab} yet</div>
          </div>
        ) : (
          <AnimatePresence>
            {users.map((person) => (
              <motion.div key={person._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <PersonRow person={person} isMe={me?._id === person._id} busy={busyId === person._id} onToggleFollow={handleToggleFollow} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {hasMore && !loading && (
          <button data-cursor="hover" onClick={() => fetchList(page + 1, false)} style={{
            width: "100%", marginTop: "1.5rem", padding: "0.7rem", background: "transparent",
            border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.textDim,
            fontFamily: "Inter, sans-serif", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
          }}>Load more</button>
        )}
      </div>
    </div>
  );
};

export default FollowList;