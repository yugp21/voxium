import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
 
const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div style={{ background:"#0a0a0a", minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"2rem", textAlign:"center", position:"relative", overflow:"hidden" }}>
      {/* Background glow */}
      <div style={{ position:"fixed", top:"40%", left:"50%", transform:"translate(-50%,-50%)", width:500, height:500, background:"radial-gradient(circle,#c9a84c05 0%,transparent 70%)", pointerEvents:"none" }}/>
 
      <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:0.6}}>
        <motion.div
          animate={{ opacity:[0.4,1,0.4] }}
          transition={{ duration:3, repeat:Infinity }}
          style={{ fontFamily:"Cinzel Decorative,serif", fontSize:"clamp(4rem,15vw,8rem)", color:"#c9a84c", lineHeight:1, marginBottom:"1rem", filter:"drop-shadow(0 0 40px #c9a84c25)" }}
        >404</motion.div>
 
        <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.65rem", color:"#4a4540", letterSpacing:"0.3em", marginBottom:"1.5rem" }}>PAGE NOT FOUND</div>
 
        <h2 style={{ fontFamily:"Cinzel,serif", fontSize:"clamp(1rem,3vw,1.5rem)", color:"#f5f0e8", fontWeight:600, marginBottom:"0.8rem" }}>
          This path doesn't exist in the arena
        </h2>
        <p style={{ color:"#8a8070", fontSize:"0.85rem", fontFamily:"Inter,sans-serif", maxWidth:360, margin:"0 auto 2.5rem", lineHeight:1.7 }}>
          The page you're looking for has been lost to history. Return to the arena and continue your legend.
        </p>
 
        <div style={{ display:"flex", gap:"1rem", justifyContent:"center", flexWrap:"wrap" }}>
          <motion.button
            whileHover={{scale:1.05,boxShadow:"0 0 30px #c9a84c30"}} whileTap={{scale:0.95}}
            onClick={()=>navigate("/")}
            style={{ padding:"0.85rem 2rem", background:"linear-gradient(135deg,#c9a84c,#a07830)", border:"none", borderRadius:8, color:"#0a0a0a", fontFamily:"Cinzel,serif", fontSize:"0.8rem", letterSpacing:"0.15em", cursor:"pointer", fontWeight:700 }}
          >RETURN HOME</motion.button>
          <motion.button
            whileHover={{scale:1.05}} whileTap={{scale:0.95}}
            onClick={()=>navigate("/dashboard")}
            style={{ padding:"0.85rem 2rem", background:"transparent", border:"1px solid #2a2a2a", borderRadius:8, color:"#8a8070", fontFamily:"Cinzel,serif", fontSize:"0.8rem", letterSpacing:"0.15em", cursor:"pointer" }}
          >DASHBOARD</motion.button>
        </div>
      </motion.div>
    </div>
  );
};
 
export default NotFound;