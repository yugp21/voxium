import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/slices/authSlice";
import { authService } from "../services/authService";
import toast from "react-hot-toast";
 
// ─── RESPONSIVE HOOK ──────────────────────────────────────────────
const useResponsive = () => {
  const [width, setWidth] = useState(window.innerWidth);
  return { isMobile: width < 640 };
};
 
// ─── INPUT COMPONENT ──────────────────────────────────────────────
const Input = ({ label, type = "text", value, onChange, placeholder, error }) => {
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const isPassword = type === "password";
 
  return (
    <div style={{ marginBottom: "1.2rem" }}>
      <label style={{
        display: "block", fontFamily: "Cinzel, serif",
        fontSize: "0.68rem", color: "#8a8070",
        letterSpacing: "0.12em", marginBottom: "0.5rem",
      }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={isPassword && showPass ? "text" : type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            width: "100%", padding: "0.85rem 1rem",
            background: "#0d0d0d",
            border: `1px solid ${error ? "#c0392b" : focused ? "#c9a84c50" : "#2a2a2a"}`,
            borderRadius: 8, color: "#f5f0e8",
            fontFamily: "Inter, sans-serif", fontSize: "0.88rem",
            outline: "none", transition: "border-color 0.2s",
            boxShadow: focused ? "0 0 0 3px #c9a84c0a" : "none",
            paddingRight: isPassword ? "3rem" : "1rem",
          }}
          placeholder={placeholder}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            style={{
              position: "absolute", right: "0.8rem", top: "50%",
              transform: "translateY(-50%)",
              background: "transparent", border: "none",
              color: "#4a4540", cursor: "pointer", fontSize: "0.8rem",
            }}
          >{showPass ? "HIDE" : "SHOW"}</button>
        )}
      </div>
      {error && (
        <p style={{ color: "#c0392b", fontSize: "0.72rem", marginTop: "0.3rem", fontFamily: "Inter, sans-serif" }}>
          {error}
        </p>
      )}
    </div>
  );
};
 
// ─── LOGIN PAGE ───────────────────────────────────────────────────
const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form, setForm] = useState({ emailOrUsername: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
 
  const validate = () => {
    const e = {};
    if (!form.emailOrUsername.trim()) e.emailOrUsername = "Email or username is required";
    if (!form.password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
 
  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authService.login(form);
      dispatch(setUser(res.data.user));
      toast.success("Welcome back to the arena!");
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      toast.error(msg);
      if (msg.includes("credentials")) {
        setErrors({ password: "Invalid email/username or password" });
      }
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0a",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1.5rem", position: "relative", overflow: "hidden",
    }}>
      {/* Background glow */}
      <div style={{
        position: "fixed", top: "30%", left: "50%",
        transform: "translateX(-50%)",
        width: 500, height: 500,
        background: "radial-gradient(circle, #c9a84c06 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
 
      {/* Grid lines background */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        backgroundImage: `
          linear-gradient(#c9a84c04 1px, transparent 1px),
          linear-gradient(90deg, #c9a84c04 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }} />
 
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: "100%", maxWidth: 420,
          background: "#111",
          border: "1px solid #2a2a2a",
          borderRadius: 16, padding: "clamp(1.5rem, 5vw, 2.5rem)",
          position: "relative", zIndex: 1,
        }}
      >
        {/* Gold top line */}
        <div style={{
          position: "absolute", top: 0, left: "10%", right: "10%", height: 1,
          background: "linear-gradient(90deg, transparent, #c9a84c, transparent)",
        }} />
 
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => navigate("/")}
            style={{
              fontFamily: "Cinzel Decorative, serif", fontSize: "1.3rem",
              color: "#c9a84c", letterSpacing: "0.2em",
              cursor: "pointer", marginBottom: "1.5rem", display: "inline-block",
            }}
          >UDA</motion.div>
 
          <motion.h1
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              fontFamily: "Cinzel, serif", fontSize: "clamp(1.2rem, 4vw, 1.5rem)",
              color: "#f5f0e8", fontWeight: 700, marginBottom: "0.4rem",
            }}
          >Welcome Back</motion.h1>
          <p style={{ color: "#8a8070", fontSize: "0.82rem", fontFamily: "Inter, sans-serif" }}>
            Your legend awaits in the arena
          </p>
        </div>
 
        {/* Form */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Input
            label="EMAIL OR USERNAME"
            value={form.emailOrUsername}
            onChange={(e) => setForm({ ...form, emailOrUsername: e.target.value })}
            placeholder="Enter your email or username"
            error={errors.emailOrUsername}
          />
          <Input
            label="PASSWORD"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Enter your password"
            error={errors.password}
          />
 
          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 0 30px #c9a84c30" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%", padding: "0.9rem",
              background: loading ? "#5a4a20" : "linear-gradient(135deg, #c9a84c, #a07830)",
              border: "none", borderRadius: 8, color: "#0a0a0a",
              fontFamily: "Cinzel, serif", fontSize: "0.85rem",
              letterSpacing: "0.15em", cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 700, marginTop: "0.5rem",
              transition: "all 0.3s",
            }}
          >
            {loading ? "ENTERING ARENA..." : "ENTER THE ARENA"}
          </motion.button>
 
          {/* Divider */}
          <div style={{
            display: "flex", alignItems: "center",
            gap: "1rem", margin: "1.5rem 0",
          }}>
            <div style={{ flex: 1, height: 1, background: "#1e1e1e" }} />
            <span style={{ color: "#4a4540", fontSize: "0.7rem", fontFamily: "Inter, sans-serif" }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "#1e1e1e" }} />
          </div>
 
          {/* Register link */}
          <p style={{
            textAlign: "center", fontFamily: "Inter, sans-serif",
            fontSize: "0.82rem", color: "#8a8070",
          }}>
            New to the arena?{" "}
            <Link to="/register" style={{
              color: "#c9a84c", textDecoration: "none", fontFamily: "Cinzel, serif",
              fontSize: "0.78rem", letterSpacing: "0.05em",
            }}>Begin Your Legacy</Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};
 
export default Login;