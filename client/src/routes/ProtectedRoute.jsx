import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
 
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);
 
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <div className="text-center">
          <p className="font-display text-gold text-lg tracking-widest animate-pulse">
            VOXIUM
          </p>
        </div>
      </div>
    );
  }
 
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
 
  return children;
};
 
export default ProtectedRoute;