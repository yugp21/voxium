import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/slices/authSlice";
import { authService } from "../services/authService";
import toast from "react-hot-toast";
import { Eye, EyeOff, ArrowRight, Swords } from "lucide-react";
import { COLORS } from "../constants/theme";
import Logo from "../components/Logo";

const Input = ({ label, type = "text", value, onChange, placeholder, error, hint }) => {
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const isPass = type === "password";
  return (
    <div style={{ marginBottom: "1.3rem" }}>
      <label style={{ display: "block", fontFamily: "JetBrains Mono, monospace", fontSize: "0.6rem", color: COLORS.textFaint, letterSpacing: "0.14em", marginBottom: "0.5rem" }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={isPass && showPass ? "text" : type}
          value={value} onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            width: "100%", padding: "0.65rem 0", paddingRight: isPass ? "2rem" : 0,
            background: "transparent", border: "none",
            borderBottom: `1px solid ${error ? "#ff5c7c" : focused ? COLORS.accent2 : COLORS.borderStrong}`,
            color: COLORS.text, fontFamily: "Inter,sans-serif", fontSize: "0.92rem", outline: "none", transition: "border-color 0.2s",
          }}
        />
        {isPass && (
          <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: COLORS.textFaint, cursor: "pointer", display: "flex" }}>
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {error && <p style={{ color: "#ff5c7c", fontSize: "0.7rem", marginTop: "0.35rem" }}>{error}</p>}
      {hint && !error && <p style={{ color: COLORS.textFaint, fontSize: "0.68rem", marginTop: "0.35rem" }}>{hint}</p>}
    </div>
  );
};

const StepDots = ({ current, total }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "2.2rem" }}>
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center" }}>
        <motion.div animate={{ width: i === current ? 24 : 8, background: i <= current ? COLORS.accent2 : COLORS.border }} style={{ height: 4, borderRadius: 4 }} transition={{ duration: 0.3 }} />
        {i < total - 1 && <div style={{ width: 16, height: 1, background: COLORS.border, margin: "0 0.2rem" }} />}
      </div>
    ))}
  </div>
);

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "", confirmPassword: "" });

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
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Invalid email";
    if (!form.password) e.password = "Password is required";
    // Was "at least 6 characters" — didn't match the backend's actual
    // minimum of 8, so a 6-7 char password would pass client validation
    // and then fail with a confusing server error. Fixed to match.
    else if (form.password.length < 8) e.password = "At least 8 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep1()) return;
    setLoading(true);
    try {
      const res = await authService.register({
        name: form.name.trim(), username: form.username.trim().toLowerCase(),
        email: form.email.trim().toLowerCase(), password: form.password,
      });
      dispatch(setUser(res.data.user));
      toast.success("Welcome to UDA! Your legend begins.");
      navigate("/onboarding");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed. Try again.";
      if (msg.toLowerCase().includes("username")) {
        toast.error("That username is already taken in the arena!");
        setErrors({ username: "Username already taken — choose another" });
        setStep(0);
      } else if (msg.toLowerCase().includes("email")) {
        toast.error("This email is already registered!");
        setErrors({ email: "Email already registered — try logging in" });
        setStep(1);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", fontFamily: "Inter, -apple-system, sans-serif" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div onClick={() => navigate("/")} style={{ cursor: "pointer", display: "inline-block", marginBottom: "1.2rem" }}>
            <Logo size={26} showText />
          </div>
          <h1 style={{ fontFamily: "Inter, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: COLORS.text, marginBottom: "0.3rem" }}>Begin your legacy</h1>
          <p style={{ color: COLORS.textFaint, fontSize: "0.82rem" }}>{step === 0 ? "Choose your identity in the arena" : "Secure your account"}</p>
        </div>

        <StepDots current={step} total={2} />

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
              <Input label="YOUR NAME" value={form.name} onChange={update("name")} placeholder="What shall we call you?" error={errors.name} />
              <Input label="USERNAME" value={form.username} onChange={update("username")} placeholder="Your arena identity" error={errors.username} hint="Letters, numbers, underscores only" />
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={() => { if (validateStep0()) setStep(1); }}
                style={{ width: "100%", padding: "0.9rem", marginTop: "0.5rem", background: `linear-gradient(135deg,${COLORS.accent},#5a3fd6)`, border: "none", borderRadius: 8, color: "#fff", fontFamily: "Inter,sans-serif", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
              >Continue <ArrowRight size={15} /></motion.button>
            </motion.div>
          )}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
              <Input label="EMAIL ADDRESS" type="email" value={form.email} onChange={update("email")} placeholder="you@example.com" error={errors.email} />
              <Input label="PASSWORD" type="password" value={form.password} onChange={update("password")} placeholder="Create a strong password" error={errors.password} hint="Minimum 8 characters" />
              <Input label="CONFIRM PASSWORD" type="password" value={form.confirmPassword} onChange={update("confirmPassword")} placeholder="Repeat your password" error={errors.confirmPassword} />
              <div style={{ display: "flex", gap: "0.8rem", marginTop: "0.5rem" }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setStep(0)}
                  style={{ flex: 1, padding: "0.9rem", background: "transparent", border: `1px solid ${COLORS.borderStrong}`, borderRadius: 8, color: COLORS.textDim, fontFamily: "Inter,sans-serif", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}
                >Back</motion.button>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleSubmit} disabled={loading}
                  style={{ flex: 2, padding: "0.9rem", background: loading ? COLORS.borderStrong : `linear-gradient(135deg,${COLORS.accent},#5a3fd6)`, border: "none", borderRadius: 8, color: "#fff", fontFamily: "Inter,sans-serif", fontSize: "0.82rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                >{loading ? "Creating..." : <><Swords size={15} /> Join The Arena</>}</motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p style={{ textAlign: "center", fontSize: "0.82rem", color: COLORS.textFaint, marginTop: "2rem" }}>
          Already a legend?{" "}
          <Link to="/login" style={{ color: COLORS.accent2, textDecoration: "none", fontWeight: 600 }}>Enter the arena</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;