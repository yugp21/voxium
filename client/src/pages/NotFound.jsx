import { useNavigate } from "react-router-dom";
 
const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
      <h1 style={{ color: "#c9a84c", fontFamily: "Cinzel, serif", fontSize: "4rem" }}>404</h1>
      <p style={{ color: "#8a8070", fontFamily: "Inter, sans-serif" }}>This page doesn't exist in the arena.</p>
      <button onClick={() => navigate("/")} style={{ color: "#c9a84c", background: "transparent", border: "1px solid #c9a84c", padding: "0.5rem 1.5rem", cursor: "pointer", fontFamily: "Cinzel, serif" }}>
        Return Home
      </button>
    </div>
  );
};
 
export default NotFound;