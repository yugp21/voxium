import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import api from "../services/api";
import toast from "react-hot-toast";

const TIER_COLORS = { Wanderer: "#8a8070", Vanguard: "#6b9fb8", Oracle: "#9b7fd4", Ascendant: "#4caf82", Sovereign: "#c9a84c", Conqueror: "#e8604c", Immortal: "#ffffff" };

// ─── USER ROW ───────────────────────────────────────────────────
const UserRow = ({ person, onToggleFollow, isMe, busy }) => {
  const navigate = useNavigate();
  const tierColor = TIER_COLORS[person.tier] || "#8a8070";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "0.9rem",
      padding: "0.8rem 0.2rem", borderBottom: "1px solid #1a1a1a",
    }}>
      <div
        onClick={() => navigate(`/profile/${person.username}`)}
        style={{
          width: 48, height: 48, borderRadius: "50%", overflow: "hidden",
          border: `2px solid ${tierColor}50`, background: "#1a1a1a",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", flexShrink: 0,
        }}
      >
        {person.profileImage
          ? <img src={person.profileImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontSize: "1.2rem" }}>⚔️</span>}
      </div>

      <div
        onClick={() => navigate(`/profile/${person.username}`)}
        style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
      >
        <div style={{ fontFamily: "Cinzel,serif", fontSize: "0.85rem", color: "#f5f0e8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {person.name}
        </div>
        <div style={{ fontFamily: "Inter,sans-serif", fontSize: "0.72rem", color: "#4a4540" }}>
          @{person.username} · <span style={{ color: tierColor }}>{person.tier}</span>
        </div>
        {person.isFollowing && person.followsYou && (
          <div style={{ fontFamily: "Inter,sans-serif", fontSize: "0.65rem", color: "#c9a84c", marginTop: "0.15rem" }}>
            ⚔️ You both follow each other
          </div>
        )}
      </div>

      {!isMe && (
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          disabled={busy}
          onClick={() => onToggleFollow(person)}
          style={{
            padding: "0.4rem 1rem", flexShrink: 0,
            background: person.isFollowing ? "transparent" : "linear-gradient(135deg,#c9a84c,#a07830)",
            border: person.isFollowing ? "1px solid #2a2a2a" : "none",
            borderRadius: 6, color: person.isFollowing ? "#8a8070" : "#0a0a0a",
            fontFamily: "Cinzel,serif", fontSize: "0.65rem", letterSpacing: "0.08em",
            cursor: busy ? "not-allowed" : "pointer", fontWeight: 700,
            opacity: busy ? 0.6 : 1,
          }}
        >{person.isFollowing ? "FOLLOWING" : person.followsYou ? "FOLLOW BACK" : "FOLLOW"}</motion.button>
      )}
    </div>
  );
};

// ─── MAIN ───────────────────────────────────────────────────────
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

  useEffect(() => {
    fetchList(1, true);
  }, [fetchList]);

  const switchTab = (t) => {
    setTab(t);
    setSearchParams({ tab: t });
  };

  const handleToggleFollow = async (person) => {
    if (busyId) return; // ignore clicks while any row is already in flight
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
      if (status === 409) {
        // Already following server-side — local state was stale; sync instead of erroring
        setUsers((prev) => prev.map((u) => u._id === person._id ? { ...u, isFollowing: true } : u));
      } else if (status === 404) {
        setUsers((prev) => prev.map((u) => u._id === person._id ? { ...u, isFollowing: false } : u));
      } else {
        toast.error(err.response?.data?.message || "Something went wrong");
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", padding: "1.5rem" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ maxWidth: 480, margin: "0 auto" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "1.2rem" }}>
          <button
            onClick={() => navigate(`/profile/${username}`)}
            style={{ background: "transparent", border: "none", color: "#8a8070", fontSize: "1.1rem", cursor: "pointer" }}
          >←</button>
          <h1 style={{ fontFamily: "Cinzel,serif", fontSize: "1rem", color: "#f5f0e8" }}>@{username}</h1>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: 4, marginBottom: "1rem" }}>
          {["followers", "following"].map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              style={{
                flex: 1, padding: "0.6rem", borderRadius: 8, border: "none",
                background: tab === t ? "#c9a84c15" : "transparent",
                color: tab === t ? "#c9a84c" : "#8a8070",
                fontFamily: "Cinzel,serif", fontSize: "0.72rem", letterSpacing: "0.08em",
                cursor: "pointer", textTransform: "uppercase",
              }}
            >{t} {tab === t && total > 0 ? `(${total})` : ""}</button>
          ))}
        </div>

        {loading && users.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.3, repeat: Infinity }}
              style={{ fontFamily: "Cinzel,serif", color: "#c9a84c", letterSpacing: "0.15em", fontSize: "0.75rem" }}
            >LOADING...</motion.div>
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.6rem" }}>🗺️</div>
            <div style={{ fontFamily: "Cinzel,serif", color: "#4a4540", fontSize: "0.8rem" }}>
              No {tab} yet
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {users.map((person) => (
              <motion.div key={person._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <UserRow
                  person={person}
                  isMe={me?._id === person._id}
                  busy={busyId === person._id}
                  onToggleFollow={handleToggleFollow}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {hasMore && !loading && (
          <button
            onClick={() => fetchList(page + 1, false)}
            style={{
              width: "100%", marginTop: "1rem", padding: "0.7rem",
              background: "transparent", border: "1px solid #2a2a2a", borderRadius: 8,
              color: "#8a8070", fontFamily: "Cinzel,serif", fontSize: "0.7rem",
              letterSpacing: "0.08em", cursor: "pointer",
            }}
          >LOAD MORE</button>
        )}
      </motion.div>
    </div>
  );
};

export default FollowList;