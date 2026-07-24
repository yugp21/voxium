import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/slices/authSlice";
import { authService } from "../services/authService";
import toast from "react-hot-toast";
import { Eye, EyeOff, Swords } from "lucide-react";
import { COLORS } from "../constants/theme";
import Logo from "../components/Logo";

// ─── UNDERLINE INPUT — consistent with Settings/SearchUsers V2 ────
const Input = ({ label, type = "text", value, onChange, placeholder, error }) => {
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const isPassword = type === "password";
  return (
    <div style={{ marginBottom: "1.4rem" }}>
      <label style={{ display: "block", fontFamily: "JetBrains Mono, monospace", fontSize: "0.62rem", color: COLORS.textFaint, letterSpacing: "0.14em", marginBottom: "0.5rem" }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={isPassword && showPass ? "text" : type}
          value={value} onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            width: "100%", padding: "0.7rem 0", paddingRight: isPassword ? "2rem" : 0,
            background: "transparent", border: "none",
            borderBottom: `1px solid ${error ? "#ff5c7c" : focused ? COLORS.accent2 : COLORS.borderStrong}`,
            color: COLORS.text, fontFamily: "Inter, sans-serif", fontSize: "0.95rem", outline: "none",
            transition: "border-color 0.2s",
          }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShowPass(!showPass)} style={{
            position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)",
            background: "transparent", border: "none", color: COLORS.textFaint, cursor: "pointer", display: "flex",
          }}>{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
        )}
      </div>
      {error && <p style={{ color: "#ff5c7c", fontSize: "0.72rem", marginTop: "0.4rem" }}>{error}</p>}
    </div>
  );
};

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
      if (msg.includes("credentials")) setErrors({ password: "Invalid email/username or password" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", fontFamily: "Inter, -apple-system, sans-serif" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div onClick={() => navigate("/")} style={{ cursor: "pointer", display: "inline-block", marginBottom: "1.5rem" }}>
            <Logo size={28} showText />
          </div>
          <h1 style={{ fontFamily: "Inter, sans-serif", fontSize: "1.6rem", fontWeight: 800, color: COLORS.text, marginBottom: "0.4rem" }}>Welcome back</h1>
          <p style={{ color: COLORS.textFaint, fontSize: "0.85rem" }}>Your legend awaits in the arena</p>
        </div>

        <Input label="EMAIL OR USERNAME" value={form.emailOrUsername} onChange={(e) => setForm({ ...form, emailOrUsername: e.target.value })} placeholder="you@example.com" error={errors.emailOrUsername} />
        <Input label="PASSWORD" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" error={errors.password} />

        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={handleSubmit} disabled={loading}
          style={{
            width: "100%", padding: "0.9rem", marginTop: "0.6rem",
            background: loading ? COLORS.borderStrong : `linear-gradient(135deg,${COLORS.accent},#5a3fd6)`,
            border: "none", borderRadius: 8, color: "#fff", fontFamily: "Inter,sans-serif",
            fontSize: "0.88rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
          }}
        >{loading ? "Entering arena..." : <><Swords size={16} /> Enter The Arena</>}</motion.button>

        <p style={{ textAlign: "center", fontSize: "0.85rem", color: COLORS.textFaint, marginTop: "2rem" }}>
          New to the arena?{" "}
          <Link to="/register" style={{ color: COLORS.accent2, textDecoration: "none", fontWeight: 600 }}>Begin your legacy</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;