import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/slices/authSlice";
import { authService } from "../services/authService";
import toast from "react-hot-toast";

const Input = ({ label, type="text", value, onChange, placeholder, error, hint }) => {
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const isPass = type === "password";
  return (
    <div style={{ marginBottom:"1.1rem" }}>
      <label style={{ display:"block", fontFamily:"Cinzel,serif", fontSize:"0.65rem", color:"#8a8070", letterSpacing:"0.12em", marginBottom:"0.45rem" }}>{label}</label>
      <div style={{ position:"relative" }}>
        <input
          type={isPass && showPass ? "text" : type}
          value={value}
          onChange={onChange}
          onFocus={()=>setFocused(true)}
          onBlur={()=>setFocused(false)}
          placeholder={placeholder}
          style={{ width:"100%", padding:"0.8rem 1rem", background:"#0d0d0d", border:`1px solid ${error?"#c0392b":focused?"#c9a84c50":"#2a2a2a"}`, borderRadius:8, color:"#f5f0e8", fontFamily:"Inter,sans-serif", fontSize:"0.85rem", outline:"none", transition:"border-color 0.2s", boxShadow:focused?"0 0 0 3px #c9a84c08":"none", paddingRight:isPass?"3.5rem":"1rem" }}
        />
        {isPass && (
          <button type="button" onClick={()=>setShowPass(!showPass)}
            style={{ position:"absolute", right:"0.8rem", top:"50%", transform:"translateY(-50%)", background:"transparent", border:"none", color:"#4a4540", cursor:"pointer", fontSize:"0.7rem", fontFamily:"Cinzel,serif", letterSpacing:"0.05em" }}
          >{showPass?"HIDE":"SHOW"}</button>
        )}
      </div>
      {error && <p style={{ color:"#c0392b", fontSize:"0.7rem", marginTop:"0.3rem", fontFamily:"Inter,sans-serif" }}>{error}</p>}
      {hint && !error && <p style={{ color:"#4a4540", fontSize:"0.68rem", marginTop:"0.3rem", fontFamily:"Inter,sans-serif" }}>{hint}</p>}
    </div>
  );
};

const StepDots = ({ current, total }) => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", marginBottom:"2rem" }}>
    {Array.from({length:total}).map((_,i)=>(
      <div key={i} style={{ display:"flex", alignItems:"center" }}>
        <motion.div animate={{ width:i===current?24:8, background:i<=current?"#c9a84c":"#2a2a2a" }}
          style={{ height:8, borderRadius:4 }} transition={{ duration:0.3 }}
        />
        {i<total-1 && <div style={{ width:16, height:1, background:i<current?"#c9a84c30":"#1a1a1a", margin:"0 0.2rem" }}/>}
      </div>
    ))}
  </div>
);

const Register = () => {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const [step, setStep]       = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});
  const [form, setForm] = useState({ name:"", username:"", email:"", password:"", confirmPassword:"" });

  const update = (field) => (e) => {
    setForm({...form, [field]:e.target.value});
    if (errors[field]) setErrors({...errors, [field]:""});
  };

  const validateStep0 = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.username.trim()) e.username = "Username is required";
    else if (form.username.length<3) e.username = "At least 3 characters";
    else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) e.username = "Letters, numbers, underscores only";
    setErrors(e);
    return Object.keys(e).length===0;
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Invalid email";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length<6) e.password = "At least 6 characters";
    if (form.password!==form.confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length===0;
  };

  const handleSubmit = async () => {
    if (!validateStep1()) return;
    setLoading(true);
    try {
      const res = await authService.register({
        name: form.name.trim(),
        username: form.username.trim().toLowerCase(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      dispatch(setUser(res.data.user));
      toast.success("Welcome to Voxium! Your legend begins.");
      navigate("/onboarding");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed. Try again.";
      toast.error(msg);
      if (msg.toLowerCase().includes("username")) { setErrors({username:"Username already taken"}); setStep(0); }
      else if (msg.toLowerCase().includes("email")) { setErrors({email:"Email already registered"}); setStep(1); }
    } finally { setLoading(false); }
  };

  const isMobile = window.innerWidth < 640;

  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a", display:"flex", alignItems:"center", justifyContent:"center", padding:"1.5rem", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"fixed", top:"30%", left:"50%", transform:"translateX(-50%)", width:500, height:500, background:"radial-gradient(circle,#c9a84c06 0%,transparent 70%)", pointerEvents:"none" }}/>
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", backgroundImage:`linear-gradient(#c9a84c04 1px,transparent 1px),linear-gradient(90deg,#c9a84c04 1px,transparent 1px)`, backgroundSize:"60px 60px" }}/>

      <motion.div initial={{opacity:0,y:30,scale:0.97}} animate={{opacity:1,y:0,scale:1}} transition={{duration:0.6}}
        style={{ width:"100%", maxWidth:440, background:"#111", border:"1px solid #2a2a2a", borderRadius:16, padding:"clamp(1.5rem,5vw,2.5rem)", position:"relative", zIndex:1 }}
      >
        <div style={{ position:"absolute", top:0, left:"10%", right:"10%", height:1, background:"linear-gradient(90deg,transparent,#c9a84c,transparent)" }}/>

        <div style={{ textAlign:"center", marginBottom:"1.5rem" }}>
          <div onClick={()=>navigate("/")} style={{ fontFamily:"Cinzel Decorative,serif", fontSize:"1.2rem", color:"#c9a84c", letterSpacing:"0.2em", cursor:"pointer", marginBottom:"1.2rem", display:"inline-block" }}>VOXIUM</div>
          <h1 style={{ fontFamily:"Cinzel,serif", fontSize:"clamp(1.1rem,4vw,1.4rem)", color:"#f5f0e8", fontWeight:700, marginBottom:"0.4rem" }}>Begin Your Legacy</h1>
          <p style={{ color:"#8a8070", fontSize:"0.8rem", fontFamily:"Inter,sans-serif" }}>
            {step===0?"Choose your identity in the arena":"Secure your account"}
          </p>
        </div>

        <StepDots current={step} total={2}/>

        <AnimatePresence mode="wait">
          {step===0 && (
            <motion.div key="s0" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.3}}>
              <Input label="YOUR NAME" value={form.name} onChange={update("name")} placeholder="What shall we call you?" error={errors.name}/>
              <Input label="USERNAME" value={form.username} onChange={update("username")} placeholder="Your arena identity" error={errors.username} hint="Letters, numbers, underscores only"/>
              <motion.button whileHover={{scale:1.02,boxShadow:"0 0 25px #c9a84c20"}} whileTap={{scale:0.98}}
                onClick={()=>{ if(validateStep0()) setStep(1); }}
                style={{ width:"100%", padding:"0.9rem", marginTop:"0.5rem", background:"linear-gradient(135deg,#c9a84c,#a07830)", border:"none", borderRadius:8, color:"#0a0a0a", fontFamily:"Cinzel,serif", fontSize:"0.82rem", letterSpacing:"0.15em", cursor:"pointer", fontWeight:700 }}
              >CONTINUE →</motion.button>
            </motion.div>
          )}
          {step===1 && (
            <motion.div key="s1" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.3}}>
              <Input label="EMAIL ADDRESS" type="email" value={form.email} onChange={update("email")} placeholder="Your email address" error={errors.email}/>
              <Input label="PASSWORD" type="password" value={form.password} onChange={update("password")} placeholder="Create a strong password" error={errors.password} hint="Minimum 6 characters"/>
              <Input label="CONFIRM PASSWORD" type="password" value={form.confirmPassword} onChange={update("confirmPassword")} placeholder="Repeat your password" error={errors.confirmPassword}/>
              <div style={{ display:"flex", gap:"0.8rem", marginTop:"0.5rem" }}>
                <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>setStep(0)}
                  style={{ flex:1, padding:"0.9rem", background:"transparent", border:"1px solid #2a2a2a", borderRadius:8, color:"#8a8070", fontFamily:"Cinzel,serif", fontSize:"0.78rem", letterSpacing:"0.1em", cursor:"pointer" }}
                >← BACK</motion.button>
                <motion.button whileHover={{scale:1.02,boxShadow:"0 0 25px #c9a84c20"}} whileTap={{scale:0.98}}
                  onClick={handleSubmit} disabled={loading}
                  style={{ flex:2, padding:"0.9rem", background:loading?"#5a4a20":"linear-gradient(135deg,#c9a84c,#a07830)", border:"none", borderRadius:8, color:"#0a0a0a", fontFamily:"Cinzel,serif", fontSize:"0.78rem", letterSpacing:"0.12em", cursor:loading?"not-allowed":"pointer", fontWeight:700 }}
                >{loading?"CREATING...":"JOIN THE ARENA"}</motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p style={{ textAlign:"center", fontFamily:"Inter,sans-serif", fontSize:"0.8rem", color:"#8a8070", marginTop:"1.5rem" }}>
          Already a legend?{" "}
          <Link to="/login" style={{ color:"#c9a84c", textDecoration:"none", fontFamily:"Cinzel,serif", fontSize:"0.75rem" }}>Enter the Arena</Link>
        </p>

        {isMobile && <div style={{ height:"1rem" }}/>}
      </motion.div>
    </div>
  );
};

export default Register;