import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
 
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useSelector((state) => state.auth);
 
  if (isLoading) return null;
 
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
 
  return children;
};
 
export default PublicRoute;