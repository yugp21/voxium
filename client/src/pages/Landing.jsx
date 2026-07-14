import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import Logo from "../components/Logo";
 
// ─── RESPONSIVE HOOK ──────────────────────────────────────────────
const useResponsive = () => {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return {
    isMobile: width < 640,
    isTablet: width >= 640 && width < 1024,
    isDesktop: width >= 1024,
    width,
  };
};
 
// ─── SPOTLIGHT CURSOR (desktop only) ─────────────────────────────
const SpotlightCursor = () => {
  const [pos, setPos] = useState({ x: -300, y: -300 });
  const { isDesktop } = useResponsive();
  useEffect(() => {
    if (!isDesktop) return;
    const move = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [isDesktop]);
  if (!isDesktop) return null;
  return (
    <div style={{
      position: "fixed", pointerEvents: "none", zIndex: 1,
      left: pos.x - 200, top: pos.y - 200,
      width: 400, height: 400,
      background: "radial-gradient(circle, #c9a84c09 0%, transparent 70%)",
      borderRadius: "50%", transition: "left 0.15s ease, top 0.15s ease",
    }} />
  );
};
 
// ─── SCRAMBLE TEXT ────────────────────────────────────────────────
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&";
const ScrambleText = ({ text, delay = 0 }) => {
  const [display, setDisplay] = useState(text);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [inView, delay]);
  useEffect(() => {
    if (!started) return;
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplay(text.split("").map((char, i) => {
        if (i < iteration) return char;
        if (char === " ") return " ";
        return CHARS[Math.floor(Math.random() * CHARS.length)];
      }).join(""));
      if (iteration >= text.length) clearInterval(interval);
      iteration += 0.4;
    }, 40);
    return () => clearInterval(interval);
  }, [started, text]);
  return <span ref={ref}>{display}</span>;
};
 
// ─── ANIMATED COUNTER ─────────────────────────────────────────────
const AnimatedCounter = ({ target, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || target === "∞") return;
    const num = parseFloat(target);
    const start = Date.now();
    const dur = 2000;
    const timer = setInterval(() => {
      const p = Math.min((Date.now() - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(eased * num));
      if (p >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);
  return <span ref={ref}>{target === "∞" ? "∞" : count}{suffix}</span>;
};
 
// ─── TICKER ───────────────────────────────────────────────────────
const Ticker = () => {
  const topics = [
    "Free will is an illusion", "AI will surpass human intelligence",
    "Democracy is the best form of government", "Space colonization is humanity's top priority",
    "Social media has destroyed real debate", "Nuclear energy is the future",
    "Consciousness cannot be explained by science", "Gaming is a legitimate sport",
  ];
  const repeated = [...topics, ...topics];
  return (
    <div style={{
      overflow: "hidden", background: "#0d0d0d",
      borderTop: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a",
      padding: "0.75rem 0", position: "relative", zIndex: 1,
    }}>
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        style={{ display: "flex", whiteSpace: "nowrap", width: "max-content" }}
      >
        {repeated.map((topic, i) => (
          <span key={i} style={{
            fontFamily: "Cinzel, serif", fontSize: "0.68rem",
            color: i % 2 === 0 ? "#c9a84c" : "#4a4540",
            letterSpacing: "0.15em", padding: "0 2rem",
          }}>
            {i % 2 === 0 ? "◆" : "◇"} &nbsp; {topic.toUpperCase()}
          </span>
        ))}
      </motion.div>
    </div>
  );
};
 
// ─── PARTICLES ────────────────────────────────────────────────────
const Particles = () => {
  const { isMobile } = useResponsive();
  const count = isMobile ? 15 : 35;
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div key={i} style={{
          position: "absolute", borderRadius: "50%",
          width: Math.random() * 2.5 + 0.5, height: Math.random() * 2.5 + 0.5,
          background: `rgba(201,168,76,${Math.random() * 0.35 + 0.08})`,
          left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
        }}
          animate={{ y: [0, -100, 0], opacity: [0, 0.8, 0], scale: [0, 1.2, 0] }}
          transition={{ duration: Math.random() * 9 + 7, repeat: Infinity, delay: Math.random() * 10, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
};
 
// ─── SECTION HEADING ──────────────────────────────────────────────
const SectionHeading = ({ eyebrow, title }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }} style={{ textAlign: "center", marginBottom: "3rem" }}
  >
    <div style={{
      fontFamily: "JetBrains Mono, monospace", fontSize: "0.62rem",
      color: "#c9a84c", letterSpacing: "0.4em", marginBottom: "1rem",
    }}>{eyebrow}</div>
    <h2 style={{
      fontFamily: "Cinzel, serif",
      fontSize: "clamp(1.5rem, 5vw, 2.8rem)",
      color: "#f5f0e8", fontWeight: 700, lineHeight: 1.2,
    }}>
      {title.split(" ").map((word, i) => (
        <motion.span key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.5 }}
          viewport={{ once: true }}
          style={{ display: "inline-block", marginRight: "0.3em" }}
        >{word}</motion.span>
      ))}
    </h2>
  </motion.div>
);
 
// ─── STAT ITEM ────────────────────────────────────────────────────
const StatItem = ({ number, suffix, label, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }} viewport={{ once: true }}
    style={{ textAlign: "center" }}
  >
    <div style={{
      fontFamily: "Cinzel, serif", fontSize: "clamp(1.8rem, 5vw, 3.2rem)",
      fontWeight: 700, color: "#c9a84c", lineHeight: 1,
    }}>
      <AnimatedCounter target={number} suffix={suffix || ""} />
    </div>
    <div style={{
      fontFamily: "Inter, sans-serif", fontSize: "clamp(0.6rem, 1.5vw, 0.75rem)",
      color: "#8a8070", marginTop: "0.5rem",
      letterSpacing: "0.12em", textTransform: "uppercase",
    }}>{label}</div>
  </motion.div>
);
 
// ─── TIER CARD ────────────────────────────────────────────────────
const TierCard = ({ tier, index }) => {
  const [glitch, setGlitch] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.5 }} viewport={{ once: true }}
      whileHover={{ scale: 1.04, y: -5 }}
      onHoverStart={() => { setGlitch(true); setTimeout(() => setGlitch(false), 400); }}
      style={{
        background: "linear-gradient(135deg, #1a1a1a, #111)",
        border: `1px solid ${tier.color}25`, borderRadius: 12,
        padding: "clamp(1rem, 3vw, 1.5rem)",
        position: "relative", overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${tier.color}, transparent)`,
      }} />
      {glitch && (
        <motion.div initial={{ opacity: 0.5, x: -3 }} animate={{ opacity: 0, x: 3 }}
          transition={{ duration: 0.3 }}
          style={{ position: "absolute", inset: 0, background: `${tier.color}06`, mixBlendMode: "screen" }}
        />
      )}
      <div style={{ fontSize: "clamp(1.3rem, 3vw, 1.8rem)", marginBottom: "0.5rem" }}>{tier.icon}</div>
      <div style={{
        fontFamily: "Cinzel, serif", fontSize: "clamp(0.7rem, 1.5vw, 0.85rem)",
        color: tier.color, letterSpacing: "0.12em", fontWeight: 600, marginBottom: "0.3rem",
      }}>{tier.name}</div>
      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "clamp(0.6rem, 1.2vw, 0.68rem)", color: "#4a4540" }}>
        {tier.minElo === 3000 ? "3000+" : `${tier.minElo}–${tier.maxElo}`} ELO
      </div>
      <div style={{ marginTop: "0.6rem", fontSize: "clamp(0.65rem, 1.2vw, 0.72rem)", color: "#8a8070", lineHeight: 1.5 }}>
        {tier.description}
      </div>
    </motion.div>
  );
};
 
// ─── FEATURE CARD ─────────────────────────────────────────────────
const FeatureCard = ({ icon, title, description, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08, duration: 0.6 }} viewport={{ once: true }}
    whileHover={{ y: -6, borderColor: "#c9a84c20" }}
    style={{
      background: "#111", border: "1px solid #1e1e1e",
      borderRadius: 16, padding: "clamp(1.2rem, 3vw, 2rem)",
      transition: "border-color 0.3s",
    }}
  >
    <motion.div whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }} transition={{ duration: 0.4 }}
      style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", marginBottom: "1rem", display: "inline-block" }}
    >{icon}</motion.div>
    <div style={{
      fontFamily: "Cinzel, serif", fontSize: "clamp(0.8rem, 1.8vw, 0.95rem)",
      color: "#f5f0e8", letterSpacing: "0.08em", marginBottom: "0.75rem", fontWeight: 600,
    }}>{title}</div>
    <div style={{ fontSize: "clamp(0.78rem, 1.5vw, 0.85rem)", color: "#8a8070", lineHeight: 1.7 }}>{description}</div>
  </motion.div>
);
 
// ─── DATA ─────────────────────────────────────────────────────────
const TIERS_DATA = [
  { name: "Wanderer", minElo: 0, maxElo: 499, color: "#8a8070", icon: "🗺️", description: "Every legend starts here." },
  { name: "Vanguard", minElo: 500, maxElo: 999, color: "#6b9fb8", icon: "⚔️", description: "Your voice is sharpening." },
  { name: "Oracle", minElo: 1000, maxElo: 1499, color: "#9b7fd4", icon: "🔮", description: "Words flow like prophecy." },
  { name: "Ascendant", minElo: 1500, maxElo: 1999, color: "#4caf82", icon: "🌟", description: "Logic and fire combined." },
  { name: "Sovereign", minElo: 2000, maxElo: 2499, color: "#c9a84c", icon: "👑", description: "You command the arena." },
  { name: "Conqueror", minElo: 2500, maxElo: 2999, color: "#e8604c", icon: "🔥", description: "Unstoppable. Undefeated." },
  { name: "Immortal", minElo: 3000, maxElo: Infinity, color: "#ffffff", icon: "⚡", description: "Top 100. Your name echoes." },
];
 
const FEATURES = [
  { icon: "🎙️", title: "Live Video Debates", description: "Face your opponent in real-time HD video. Your voice, your arguments, your legend." },
  { icon: "⚖️", title: "Audience Decides", description: "Real viewers vote in real-time. No biased judges. The crowd determines the champion." },
  { icon: "🏆", title: "ELO Ranking", description: "Every debate moves you up or down. Climb from Wanderer to Immortal." },
  { icon: "🧬", title: "Debate DNA", description: "Your unique fighting style tracked. Aggressive, Analytical, Logical — own it." },
  { icon: "⚔️", title: "Rivalries", description: "Win streaks create rivalries. Challenge your nemesis. Build history worth remembering." },
  { icon: "🏛️", title: "Hall of Legends", description: "The greatest debaters immortalized forever. Will your name be written?" },
];
 
const DIVISIONS = [
  { name: "Philosophy", icon: "🦉", color: "#9b7fd4" },
  { name: "Science", icon: "⚗️", color: "#4caf82" },
  { name: "Politics", icon: "🏛️", color: "#6b9fb8" },
  { name: "Gaming", icon: "🎮", color: "#e8604c" },
  { name: "Cinema", icon: "🎬", color: "#c9a84c" },
  { name: "Sports", icon: "⚡", color: "#f39c12" },
];
 
// ─── MAIN ─────────────────────────────────────────────────────────
const Landing = () => {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.18], [0, -60]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [titleScrambled, setTitleScrambled] = useState(false);
 
  useEffect(() => {
    const t = setTimeout(() => setTitleScrambled(true), 600);
    return () => clearTimeout(t);
  }, []);
 
  useEffect(() => {
    if (isMobile) return;
    const h = (e) => setMousePos({
      x: (e.clientX / window.innerWidth - 0.5) * 24,
      y: (e.clientY / window.innerHeight - 0.5) * 24,
    });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, [isMobile]);
 
  const navPadding = isMobile ? "1rem 1.2rem" : isTablet ? "1.2rem 2rem" : "1.2rem 3rem";
  const sectionPadding = isMobile ? "5rem 1.2rem" : isTablet ? "6rem 2rem" : "8rem 2rem";
  const smallSectionPadding = isMobile ? "3.5rem 1.2rem" : "4rem 2rem";
 
  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", overflowX: "hidden" }}>
      <Particles />
      <SpotlightCursor />
 
      {/* ── NAVBAR ───────────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          padding: navPadding,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "linear-gradient(180deg, #0a0a0af2, transparent)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Logo
          size={isMobile ? 28 : 32}
          showText
          onClick={() => navigate("/")}
        />
        <div style={{ display: "flex", gap: isMobile ? "0.5rem" : "1rem" }}>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/login")}
            style={{
              background: "transparent", border: "1px solid #2a2a2a", color: "#8a8070",
              padding: isMobile ? "0.4rem 0.9rem" : "0.5rem 1.5rem",
              fontFamily: "Cinzel, serif", fontSize: isMobile ? "0.62rem" : "0.72rem",
              letterSpacing: "0.1em", cursor: "pointer", borderRadius: 6,
            }}
          >{isMobile ? "LOGIN" : "SIGN IN"}</motion.button>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 25px #c9a84c30" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/register")}
            style={{
              background: "linear-gradient(135deg, #c9a84c, #a07830)",
              border: "none", color: "#0a0a0a",
              padding: isMobile ? "0.4rem 0.9rem" : "0.5rem 1.5rem",
              fontFamily: "Cinzel, serif", fontSize: isMobile ? "0.62rem" : "0.72rem",
              letterSpacing: "0.08em", cursor: "pointer", borderRadius: 6, fontWeight: 700,
            }}
          >{isMobile ? "JOIN" : "ENTER ARENA"}</motion.button>
        </div>
      </motion.nav>
 
      {/* ── HERO ─────────────────────────────────────────────── */}
      <motion.section style={{ opacity: heroOpacity, y: heroY }}>
        <div style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          textAlign: "center", padding: isMobile ? "6rem 1.2rem 2rem" : "0 2rem",
          position: "relative", zIndex: 1,
        }}>
          {!isMobile && (
            <div style={{
              position: "absolute", width: 600, height: 600,
              background: "radial-gradient(circle, #c9a84c07 0%, transparent 70%)",
              borderRadius: "50%",
              transform: `translate(${mousePos.x}px, ${mousePos.y}px)`,
              transition: "transform 0.4s ease", pointerEvents: "none",
            }} />
          )}
 
          <motion.div
            initial={{ opacity: 0, letterSpacing: "0.1em" }}
            animate={{ opacity: 1, letterSpacing: "0.35em" }}
            transition={{ duration: 1.2, delay: 0.4 }}
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: isMobile ? "0.55rem" : "0.68rem",
              color: "#c9a84c", marginBottom: isMobile ? "1.2rem" : "2rem",
            }}
          >{isMobile ? "◆ WHERE VOICES BECOME LEGENDS ◆" : "◆ \u00a0 WHERE VOICES BECOME LEGENDS \u00a0 ◆"}</motion.div>
 
          <motion.h1
            initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: "Cinzel Decorative, serif",
              fontSize: isMobile ? "clamp(3rem, 20vw, 5rem)" : "clamp(4rem, 12vw, 9rem)",
              fontWeight: 900, lineHeight: 0.95,
              background: "linear-gradient(135deg, #e8c97a 0%, #c9a84c 45%, #a07830 70%, #c9a84c 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text", letterSpacing: "-0.02em",
              paddingBottom: "0.12em",
              paddingRight: "0.15em",
              marginBottom: isMobile ? "1rem" : "1.5rem",
              filter: "drop-shadow(0 0 40px #c9a84c25)",
            }}
          >
            {titleScrambled ? <ScrambleText text="VOXIUM" delay={0} /> : "VOXIUM"}
          </motion.h1>
 
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: isMobile ? "0.9rem" : "clamp(1rem, 2.5vw, 1.25rem)",
              color: "#8a8070", maxWidth: 520, lineHeight: 1.8,
              marginBottom: isMobile ? "2rem" : "3rem", fontWeight: 300,
              padding: "0 0.5rem",
            }}
          >
            The world's first competitive debating esports.
            Debate. Rank up. Build your legacy.{" "}
            <motion.span
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              style={{ color: "#c9a84c" }}
            >Become Immortal.</motion.span>
          </motion.p>
 
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.3 }}
            style={{
              display: "flex", flexDirection: isMobile ? "column" : "row",
              gap: "0.8rem", width: isMobile ? "100%" : "auto",
              maxWidth: isMobile ? "280px" : "none",
            }}
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 40px #c9a84c40" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/register")}
              style={{
                background: "linear-gradient(135deg, #c9a84c, #a07830)",
                border: "none", color: "#0a0a0a",
                padding: isMobile ? "0.9rem 2rem" : "1rem 3rem",
                borderRadius: 8, fontFamily: "Cinzel, serif",
                fontSize: isMobile ? "0.78rem" : "0.88rem",
                letterSpacing: "0.12em", cursor: "pointer", fontWeight: 700,
                width: isMobile ? "100%" : "auto",
              }}
            >ENTER THE ARENA</motion.button>
            <motion.button
              whileHover={{ scale: 1.05, borderColor: "#c9a84c50", color: "#c9a84c" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              style={{
                background: "transparent", border: "1px solid #2a2a2a", color: "#8a8070",
                padding: isMobile ? "0.9rem 2rem" : "1rem 3rem",
                borderRadius: 8, fontFamily: "Cinzel, serif",
                fontSize: isMobile ? "0.78rem" : "0.88rem",
                letterSpacing: "0.12em", cursor: "pointer", transition: "all 0.3s",
                width: isMobile ? "100%" : "auto",
              }}
            >HOW IT WORKS</motion.button>
          </motion.div>
 
          {!isMobile && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}
              style={{ position: "absolute", bottom: "2rem" }}
            >
              <motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 1.8, repeat: Infinity }}
                style={{ color: "#3a3530", fontSize: "0.8rem" }}
              >▼</motion.div>
            </motion.div>
          )}
        </div>
      </motion.section>
 
      {/* ── TICKER ───────────────────────────────────────────── */}
      <Ticker />
 
      {/* ── STATS ────────────────────────────────────────────── */}
      <section style={{
        padding: smallSectionPadding, background: "#0d0d0d",
        borderBottom: "1px solid #1a1a1a", position: "relative", zIndex: 1,
      }}>
        <div style={{
          maxWidth: 900, margin: "0 auto",
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(5, 1fr)",
          gap: isMobile ? "1.5rem" : "2rem",
        }}>
          <StatItem number="7" label="Rank Tiers" index={0} />
          <StatItem number="6" label="Divisions" index={1} />
          <StatItem number="3" label="Rounds" index={2} />
          {!isMobile && <StatItem number="90" suffix="s" label="Prep Window" index={3} />}
          {!isMobile && <StatItem number="∞" label="Legacy" index={4} />}
        </div>
        {isMobile && (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(2, 1fr)",
            gap: "1.5rem", maxWidth: 900, margin: "1.5rem auto 0",
          }}>
            <StatItem number="90" suffix="s" label="Prep Window" index={3} />
            <StatItem number="∞" label="Legacy" index={4} />
          </div>
        )}
      </section>
 
      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section id="how-it-works" style={{
        padding: sectionPadding, maxWidth: 1000, margin: "0 auto",
        position: "relative", zIndex: 1,
      }}>
        <SectionHeading eyebrow="THE PROCESS" title="How the Arena Works" />
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[
            { step: "01", title: "Choose Your Division", desc: "Philosophy, Science, Politics, Gaming, Cinema, or Sports. Pick your battlefield." },
            { step: "02", title: "Enter Matchmaking", desc: "The system finds an opponent at your ELO level. No mismatches. Fair fights only." },
            { step: "03", title: "90 Second Prep Window", desc: "Silence. Private notes. Plan your opening, your rebuttals, your closing strike." },
            { step: "04", title: "3 Rounds of Combat", desc: "Opening → Rebuttal → Closing. Each round judged by the live audience." },
            { step: "05", title: "Audience Decides", desc: "No corrupt judges. Real viewers vote. The crowd chooses the champion." },
            { step: "06", title: "ELO Updates. Legacy Grows.", desc: "Win and climb. Every match is stored permanently. Your legend is being written." },
          ].map((item, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: isMobile ? 0 : (i % 2 === 0 ? -40 : 40) , y: isMobile ? 20 : 0 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              viewport={{ once: true }}
              style={{
                display: "flex", gap: isMobile ? "1rem" : "2rem",
                alignItems: "flex-start", padding: isMobile ? "1.2rem" : "2rem",
                borderRadius: 12,
                background: i % 2 === 0 ? "#0d0d0d" : "transparent",
                border: i % 2 === 0 ? "1px solid #1a1a1a" : "1px solid transparent",
              }}
            >
              <div style={{
                fontFamily: "Cinzel, serif",
                fontSize: isMobile ? "1.3rem" : "2rem",
                color: "#252520", fontWeight: 900,
                minWidth: isMobile ? 36 : 60, lineHeight: 1,
              }}>{item.step}</div>
              <div>
                <div style={{
                  fontFamily: "Cinzel, serif",
                  fontSize: isMobile ? "0.82rem" : "1rem",
                  color: "#f5f0e8", marginBottom: "0.4rem", fontWeight: 600,
                }}>{item.title}</div>
                <div style={{
                  fontSize: isMobile ? "0.78rem" : "0.875rem",
                  color: "#8a8070", lineHeight: 1.7,
                }}>{item.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
 
      {/* ── DIVISIONS ────────────────────────────────────────── */}
      <section style={{
        padding: isMobile ? "4rem 1.2rem" : "6rem 2rem",
        background: "#0d0d0d", borderTop: "1px solid #1a1a1a",
        position: "relative", zIndex: 1,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <SectionHeading eyebrow="CHOOSE YOUR BATTLEFIELD" title="Six Divisions" />
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : isTablet ? "repeat(3, 1fr)" : "repeat(6, 1fr)",
            gap: "1rem",
          }}>
            {DIVISIONS.map((div, i) => (
              <motion.div key={div.name}
                initial={{ opacity: 0, scale: 0.85, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: i * 0.08 }} viewport={{ once: true }}
                whileHover={{ scale: 1.06, y: -5 }}
                style={{
                  background: "#111", border: `1px solid ${div.color}15`,
                  borderRadius: 12, padding: isMobile ? "1.5rem 0.8rem" : "2rem 1rem",
                  textAlign: "center",
                }}
              >
                <motion.div whileHover={{ scale: 1.3, rotate: [-5, 5, 0] }} transition={{ duration: 0.3 }}
                  style={{ fontSize: isMobile ? "2rem" : "2.5rem", marginBottom: "0.75rem", display: "inline-block" }}
                >{div.icon}</motion.div>
                <div style={{
                  fontFamily: "Cinzel, serif",
                  fontSize: isMobile ? "0.68rem" : "0.78rem",
                  color: div.color, letterSpacing: "0.1em",
                }}>{div.name}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
 
      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section style={{
        padding: sectionPadding, maxWidth: 1100, margin: "0 auto",
        position: "relative", zIndex: 1,
      }}>
        <SectionHeading eyebrow="BUILT FOR LEGENDS" title="Everything You Need to Dominate" />
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
          gap: "1.2rem",
        }}>
          {FEATURES.map((f, i) => <FeatureCard key={f.title} {...f} index={i} />)}
        </div>
      </section>
 
      {/* ── TIERS ────────────────────────────────────────────── */}
      <section style={{
        padding: isMobile ? "4rem 1.2rem" : "6rem 2rem",
        background: "#0d0d0d", borderTop: "1px solid #1a1a1a",
        position: "relative", zIndex: 1,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <SectionHeading eyebrow="YOUR JOURNEY" title="Seven Tiers of Glory" />
          <p style={{
            color: "#8a8070", fontSize: isMobile ? "0.82rem" : "0.88rem",
            maxWidth: 480, margin: "-2rem auto 2.5rem",
            textAlign: "center", lineHeight: 1.7,
          }}>
            Every match moves your ELO. Climb from Wanderer to Immortal — or fall trying.
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : isTablet ? "repeat(3, 1fr)" : "repeat(4, 1fr)",
            gap: "1rem",
          }}>
            {TIERS_DATA.map((tier, i) => <TierCard key={tier.name} tier={tier} index={i} />)}
          </div>
        </div>
      </section>
 
      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section style={{
        padding: isMobile ? "6rem 1.5rem" : "10rem 2rem",
        textAlign: "center", position: "relative", zIndex: 1,
      }}>
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 800, height: 400,
          background: "radial-gradient(ellipse, #c9a84c06 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <motion.div
          initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }} viewport={{ once: true }}
        >
          <motion.div
            animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: isMobile ? "0.55rem" : "0.65rem",
              color: "#c9a84c", letterSpacing: "0.35em", marginBottom: "1.5rem",
            }}
          >◆ YOUR LEGEND BEGINS NOW ◆</motion.div>
 
          <h2 style={{
            fontFamily: "Cinzel Decorative, serif",
            fontSize: isMobile ? "clamp(1.8rem, 8vw, 2.5rem)" : "clamp(2rem, 6vw, 4.5rem)",
            color: "#f5f0e8", fontWeight: 900, lineHeight: 1.2, marginBottom: "1.2rem",
          }}>
            Are You Ready<br />
            <span style={{
              background: "linear-gradient(135deg, #e8c97a, #c9a84c, #a07830)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>to Debate?</span>
          </h2>
 
          <p style={{
            fontSize: isMobile ? "0.88rem" : "1rem", color: "#8a8070",
            maxWidth: 360, margin: "0 auto 2.5rem", lineHeight: 1.8,
          }}>
            Join the arena. Your first match is one click away.
            Every legend was once a Wanderer.
          </p>
 
          <motion.button
            whileHover={{ scale: 1.06, boxShadow: "0 0 60px #c9a84c40" }}
            whileTap={{ scale: 0.94 }}
            onClick={() => navigate("/register")}
            style={{
              background: "linear-gradient(135deg, #c9a84c, #a07830)",
              border: "none", color: "#0a0a0a",
              padding: isMobile ? "0.9rem 2.5rem" : "1.2rem 4rem",
              borderRadius: 8, fontFamily: "Cinzel, serif",
              fontSize: isMobile ? "0.82rem" : "1rem",
              letterSpacing: "0.18em", cursor: "pointer", fontWeight: 700,
            }}
          >BEGIN YOUR LEGACY</motion.button>
        </motion.div>
      </section>
 
      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{
        padding: isMobile ? "1.5rem 1.2rem" : "2rem 3rem",
        borderTop: "1px solid #161616",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        justifyContent: "space-between",
        alignItems: "center", gap: "0.8rem",
        position: "relative", zIndex: 1,
        textAlign: isMobile ? "center" : "left",
      }}>
        <Logo size={24} showText onClick={() => navigate("/")} />
        <div style={{ fontFamily: "Inter, sans-serif", color: "#3a3530", fontSize: "0.7rem" }}>
          © 2026 Voxium - Where Voices Become Legends
        </div>
      </footer>
    </div>
  );
};
 
export default Landing;