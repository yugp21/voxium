import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { clearUser } from "../redux/slices/authSlice";
import { authService } from "../services/authService";
import Logo from "./Logo";
import { Bell, Sword, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { to: "/dashboard", label: "Arena" },
  { to: "/leaderboard", label: "Rankings" },
  { to: "/search", label: "Find Players" },
];

// Animated underline that slides to whichever link is active/hovered,
// instead of every link managing its own hover state independently.
const NavLink = ({ to, label, active }) => {
  const [hover, setHover] = useState(false);
  return (
    <Link
      to={to}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative", textDecoration: "none",
        fontFamily: "Cinzel, serif", fontSize: "0.78rem",
        letterSpacing: "0.08em", padding: "0.4rem 0",
        color: active ? "#c9a84c" : hover ? "#e8c97a" : "#8a8070",
        transition: "color 0.2s",
      }}
    >
      {label}
      <motion.div
        initial={false}
        animate={{ scaleX: active || hover ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{
          position: "absolute", left: 0, right: 0, bottom: -2, height: 2,
          background: "linear-gradient(90deg,#c9a84c,#e8c97a)",
          transformOrigin: "left", borderRadius: 2,
        }}
      />
    </Link>
  );
};

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { unreadCount } = useSelector((s) => s.notifications);

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* clear local state regardless */ }
    dispatch(clearUser());
    navigate("/login");
  };

  return (
    <div
      style={{
        position: "sticky", top: 0, zIndex: 100,
        background: scrolled ? "#0a0a0af0" : "#0a0a0ad0",
        backdropFilter: "blur(14px)",
        borderBottom: scrolled ? "1px solid #2a2a2a" : "1px solid #1a1a1a",
        boxShadow: scrolled ? "0 8px 24px -12px #000000a0" : "none",
        transition: "all 0.25s ease",
      }}
    >
      <div style={{
        maxWidth: 1200, margin: "0 auto", padding: "0.85rem 1.5rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Logo */}
        <Logo size={30} showText onClick={() => navigate("/dashboard")} />

        {/* Desktop nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }} className="uda-nav-desktop">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.to} {...l} active={location.pathname === l.to} />
          ))}
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* Notification bell */}
          <motion.button
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
            onClick={() => navigate("/notifications")}
            style={{
              position: "relative", background: "transparent", border: "none",
              cursor: "pointer", fontSize: "1.1rem", padding: "0.3rem",
              color: location.pathname === "/notifications" ? "#c9a84c" : "#8a8070",
            }}
            aria-label="Notifications"
          >
            <Bell size={19} strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span style={{
                position: "absolute", top: -2, right: -2,
                background: "#e8604c", color: "#fff", borderRadius: 10,
                fontSize: "0.6rem", fontFamily: "Inter,sans-serif", fontWeight: 700,
                minWidth: 16, height: 16, display: "flex", alignItems: "center",
                justifyContent: "center", padding: "0 3px",
                border: "1.5px solid #0a0a0a",
              }}>{unreadCount > 9 ? "9+" : unreadCount}</span>
            )}
          </motion.button>

          {/* Profile dropdown */}
          <div ref={menuRef} style={{ position: "relative" }}>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setMenuOpen((v) => !v)}
              style={{
                width: 34, height: 34, borderRadius: "50%", overflow: "hidden",
                border: "1.5px solid #c9a84c50", background: "#1a1a1a",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", padding: 0,
              }}
            >
              {user?.profileImage
                ? <img src={user.profileImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <Sword size={16} color="#c9a84c" strokeWidth={1.75} />}
            </motion.button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: "absolute", top: "calc(100% + 10px)", right: 0,
                    width: 190, background: "#111", border: "1px solid #2a2a2a",
                    borderRadius: 10, padding: "0.4rem", boxShadow: "0 12px 32px -8px #000000c0",
                  }}
                >
                  {[
                    { label: "My Profile", to: `/profile/${user?.username}` },
                    { label: "Settings", to: "/settings" },
                  ].map((item) => (
                    <button
                      key={item.to}
                      onClick={() => { setMenuOpen(false); navigate(item.to); }}
                      style={{
                        display: "block", width: "100%", textAlign: "left",
                        background: "transparent", border: "none", cursor: "pointer",
                        padding: "0.55rem 0.7rem", borderRadius: 6,
                        color: "#c8c2b8", fontFamily: "Inter,sans-serif", fontSize: "0.8rem",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#1a1a1a"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >{item.label}</button>
                  ))}
                  <div style={{ height: 1, background: "#2a2a2a", margin: "0.3rem 0" }} />
                  <button
                    onClick={handleLogout}
                    style={{
                      display: "block", width: "100%", textAlign: "left",
                      background: "transparent", border: "none", cursor: "pointer",
                      padding: "0.55rem 0.7rem", borderRadius: 6,
                      color: "#e8604c", fontFamily: "Inter,sans-serif", fontSize: "0.8rem",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#e8604c15"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >Logout</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="uda-nav-hamburger"
            style={{ display: "none", background: "transparent", border: "none", color: "#c9a84c", fontSize: "1.3rem", cursor: "pointer" }}
          >{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden", borderTop: "1px solid #1a1a1a" }}
            className="uda-nav-mobile"
          >
            <div style={{ padding: "0.8rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.9rem" }}>
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
                  style={{
                    textDecoration: "none", fontFamily: "Cinzel,serif", fontSize: "0.85rem",
                    color: location.pathname === l.to ? "#c9a84c" : "#8a8070",
                  }}
                >{l.label}</Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 720px) {
          .uda-nav-desktop { display: none !important; }
          .uda-nav-hamburger { display: block !important; }
        }
        @media (min-width: 721px) {
          .uda-nav-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Navbar;