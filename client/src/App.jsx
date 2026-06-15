import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setUser, clearUser, setLoading } from "./redux/slices/authSlice";
import { authService } from "./services/authService";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
 
// Pages (we'll create these next)
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
 
function App() {
  const dispatch = useDispatch();
 
  // Check if user is already logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        dispatch(clearUser());
        return;
      }
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
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
 
      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
 
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
 
export default App;