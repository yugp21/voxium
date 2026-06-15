import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/slices/authSlice";
import { authService } from "../services/authService";
import toast from "react-hot-toast";
 
// ─── INPUT ────────────────────────────────────────────────────────
const Input = ({ label, type = "text", value, onChange, placeholder, error, hint }) => {
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const isPassword = type === "password";
 
  return (
    <div style={{ marginBottom: "1.1rem" }}>
      <label style={{
        display: "block", fontFamily: "Cinzel, serif",
        fontSize: "0.65rem", color: "#8a8070",
        letterSpacing: "0.12em", marginBottom: "0.45rem",
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
            width: "100%", padding: "0.8rem 1rem",
            background: "#0d0d0d",
            border: `1px solid ${error ? "#c0392b" : focused ? "#c9a84c50" : "#2a2a2a"}`,
            borderRadius: 8, color: "#f5f0e8",
            fontFamily: "Inter, sans-serif", fontSize: "0.85rem",
            outline: "none", transition: "border-color 0.2s",
            boxShadow: focused ? "0 0 0 3px #c9a84c08" : "none",
            paddingRight: isPassword ? "3.5rem" : "1rem",
          }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShowPass(!showPass)}
            style={{
              position: "absolute", right: "0.8rem", top: "50%",
              transform: "translateY(-50%)",
              background: "transparent", border: "none",
              color: "#4a4540", cursor: "pointer", fontSize: "0.7rem",
              fontFamily: "Cinzel, serif", letterSpacing: "0.05em",
            }}
          >{showPass ? "HIDE" : "SHOW"}</button>
        )}
      </div>
      {error && <p style={{ color: "#c0392b", fontSize: "0.7rem", marginTop: "0.3rem" }}>{error}</p>}
      {hint && !error && <p style={{ color: "#4a4540", fontSize: "0.68rem", marginTop: "0.3rem" }}>{hint}</p>}
    </div>
  );
};
 
// ─── STEP INDICATOR ───────────────────────────────────────────────
const StepIndicator = ({ current, total }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "2rem" }}>
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center" }}>
        <motion.div
          animate={{
            background: i < current ? "linear-gradient(135deg, #c9a84c, #a07830)"
              : i === current ? "linear-gradient(135deg, #c9a84c80, #a0783080)"
              : "#1a1a1a",
            scale: i === current ? 1.2 : 1,
          }}
          style={{
            width: i === current ? 28 : 22, height: i === current ? 28 : 22,
            borderRadius: "50%", display: "flex", alignItems: "center",
            justifyContent: "center",
            border: i === current ? "1px solid #c9a84c" : "1px solid #2a2a2a",
            fontFamily: "Cinzel, serif", fontSize: "0.6rem",
            color: i <= current ? "#0a0a0a" : "#4a4540", fontWeight: 700,
          }}
        >{i + 1}</motion.div>
        {i < total - 1 && (
          <div style={{
            width: 24, height: 1,
            background: i < current ? "#c9a84c40" : "#1a1a1a",
            margin: "0 0.2rem",
          }} />
        )}
      </div>
    ))}
  </div>
);
 
// ─── REGISTER PAGE ────────────────────────────────────────────────
const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [step, setStep] = useState(0); // 0 = account, 1 = identity
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: "", username: "", email: "", password: "", confirmPassword: "",
  });
 
  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (errors[field]) setErrors({ ...errors, [field]: "" });
  };
 
  const validateStep0 = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.username.trim()) e.username = "Username is required";
    else if (form.username.length < 3) e.username = "At least 3 characters";
    else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) e.username = "Letters, numbers, underscores only";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
 
  const validateStep1 = () => {
    const e = {};
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Invalid email format";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "At least 6 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
 
  const handleNext = () => {
    if (step === 0 && validateStep0()) setStep(1);
  };
 
  const handleSubmit = async () => {
    if (!validateStep1()) return;
    setLoading(true);
    try {
      const res = await authService.register({
        name: form.name,
        username: form.username,
        email: form.email,
        password: form.password,
      });
      dispatch(setUser(res.data.user));
      toast.success("Welcome to Voxium! Your legend begins now.");
      navigate("/onboarding");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      toast.error(msg);
      if (msg.includes("username")) setErrors({ username: "Username already taken" });
      if (msg.includes("email")) setErrors({ email: "Email already registered" });
      if (msg.includes("username") || msg.includes("email")) setStep(0);
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
      {/* Background */}
      <div style={{
        position: "fixed", top: "30%", left: "50%",
        transform: "translateX(-50%)",
        width: 500, height: 500,
        background: "radial-gradient(circle, #c9a84c06 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
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
          width: "100%", maxWidth: 440,
          background: "#111", border: "1px solid #2a2a2a",
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
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <motion.div
            onClick={() => navigate("/")}
            style={{
              fontFamily: "Cinzel Decorative, serif", fontSize: "1.2rem",
              color: "#c9a84c", letterSpacing: "0.2em",
              cursor: "pointer", marginBottom: "1.2rem", display: "inline-block",
            }}
          >VOXIUM</motion.div>
          <h1 style={{
            fontFamily: "Cinzel, serif",
            fontSize: "clamp(1.1rem, 4vw, 1.4rem)",
            color: "#f5f0e8", fontWeight: 700, marginBottom: "0.4rem",
          }}>Begin Your Legacy</h1>
          <p style={{ color: "#8a8070", fontSize: "0.8rem", fontFamily: "Inter, sans-serif" }}>
            {step === 0 ? "Choose your identity in the arena" : "Secure your account"}
          </p>
        </div>
 
        {/* Step indicator */}
        <StepIndicator current={step} total={2} />
 
        {/* Step 0 — Identity */}
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Input
                label="YOUR NAME"
                value={form.name}
                onChange={update("name")}
                placeholder="What shall we call you?"
                error={errors.name}
              />
              <Input
                label="USERNAME"
                value={form.username}
                onChange={update("username")}
                placeholder="Your arena identity"
                error={errors.username}
                hint="Letters, numbers, underscores only"
              />
 
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 0 30px #c9a84c25" }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                style={{
                  width: "100%", padding: "0.9rem", marginTop: "0.5rem",
                  background: "linear-gradient(135deg, #c9a84c, #a07830)",
                  border: "none", borderRadius: 8, color: "#0a0a0a",
                  fontFamily: "Cinzel, serif", fontSize: "0.82rem",
                  letterSpacing: "0.15em", cursor: "pointer", fontWeight: 700,
                }}
              >CONTINUE →</motion.button>
            </motion.div>
          )}
 
          {/* Step 1 — Credentials */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Input
                label="EMAIL ADDRESS"
                type="email"
                value={form.email}
                onChange={update("email")}
                placeholder="Your email address"
                error={errors.email}
              />
              <Input
                label="PASSWORD"
                type="password"
                value={form.password}
                onChange={update("password")}
                placeholder="Create a strong password"
                error={errors.password}
                hint="Minimum 6 characters"
              />
              <Input
                label="CONFIRM PASSWORD"
                type="password"
                value={form.confirmPassword}
                onChange={update("confirmPassword")}
                placeholder="Repeat your password"
                error={errors.confirmPassword}
              />
 
              <div style={{ display: "flex", gap: "0.8rem", marginTop: "0.5rem" }}>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(0)}
                  style={{
                    flex: 1, padding: "0.9rem",
                    background: "transparent",
                    border: "1px solid #2a2a2a", borderRadius: 8, color: "#8a8070",
                    fontFamily: "Cinzel, serif", fontSize: "0.78rem",
                    letterSpacing: "0.1em", cursor: "pointer",
                  }}
                >← BACK</motion.button>
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 0 30px #c9a84c25" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    flex: 2, padding: "0.9rem",
                    background: loading ? "#5a4a20" : "linear-gradient(135deg, #c9a84c, #a07830)",
                    border: "none", borderRadius: 8, color: "#0a0a0a",
                    fontFamily: "Cinzel, serif", fontSize: "0.78rem",
                    letterSpacing: "0.12em",
                    cursor: loading ? "not-allowed" : "pointer", fontWeight: 700,
                  }}
                >{loading ? "CREATING..." : "JOIN THE ARENA"}</motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
 
        {/* Login link */}
        <p style={{
          textAlign: "center", fontFamily: "Inter, sans-serif",
          fontSize: "0.8rem", color: "#8a8070", marginTop: "1.5rem",
        }}>
          Already a legend?{" "}
          <Link to="/login" style={{
            color: "#c9a84c", textDecoration: "none",
            fontFamily: "Cinzel, serif", fontSize: "0.75rem",
          }}>Enter the Arena</Link>
        </p>
      </motion.div>
    </div>
  );
};
 
export default Register;