import Navbar from "./Navbar";
import useAppSocket from "../hooks/useAppSocket";

// Wraps every "app shell" page (dashboard, leaderboard, profile, etc.) with
// the shared nav and the one persistent socket connection for the session.
// Deliberately NOT used for Landing/Login/Register/Onboarding (pre-nav flows)
// or Matchmaking/PrepWindow/DebateRoom (immersive, distraction-free by design —
// those already run their own socket connections for the live debate itself).
const Layout = ({ children }) => {
  useAppSocket();

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a" }}>
      <Navbar />
      {children}
    </div>
  );
};

export default Layout;