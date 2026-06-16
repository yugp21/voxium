import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUser, clearUser } from "./redux/slices/authSlice";
import { authService } from "./services/authService";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
 
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Matchmaking from "./pages/Matchmaking";
import PrepWindow from "./pages/PrepWindow";
import DebateRoom from "./pages/DebateRoom";
import Notifications from "./pages/Notifications";
import SearchUsers from "./pages/SearchUsers";
import NotFound from "./pages/NotFound";
 
function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) { dispatch(clearUser()); return; }
      try {
        const res = await authService.getCurrentUser();
        dispatch(setUser(res.data));
      } catch {
        dispatch(clearUser());
        localStorage.removeItem("accessToken");
      }
    };
    checkAuth();
  }, [dispatch]);
 
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
      <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/matchmaking" element={<ProtectedRoute><Matchmaking /></ProtectedRoute>} />
      <Route path="/prep/:debateId" element={<ProtectedRoute><PrepWindow /></ProtectedRoute>} />
      <Route path="/debate/:debateId" element={<ProtectedRoute><DebateRoom /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><SearchUsers /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
 
export default App;