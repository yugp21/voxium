import { useEffect, useRef, useState, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useInView, useSpring, useMotionValue } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Float } from "@react-three/drei";
import Logo from "../components/Logo";
import { COLORS } from "../constants/theme";

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

// ─── CUSTOM MAGNETIC CURSOR (desktop only) ────────────────────────
// Replaces the old flat radial-gradient "spotlight" with a real
// two-part cursor (dot + trailing ring) that springs toward the
// pointer and scales up over anything tagged data-cursor="hover" —
// the signature interaction pattern of agency-style 3D sites.
const CustomCursor = () => {
  const { isDesktop } = useResponsive();
  const [hovering, setHovering] = useState(false);
  const mx = useMotionValue(-100);
  const my = useMotionValue(-100);
  const ringX = useSpring(mx, { damping: 25, stiffness: 300 });
  const ringY = useSpring(my, { damping: 25, stiffness: 300 });

  useEffect(() => {
    if (!isDesktop) return;
    const move = (e) => {
      mx.set(e.clientX);
      my.set(e.clientY);
      const el = e.target.closest('[data-cursor="hover"]');
      setHovering(!!el);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [isDesktop, mx, my]);

  if (!isDesktop) return null;
  return (
    <>
      <motion.div style={{
        position: "fixed", left: mx, top: my, x: "-50%", y: "-50%",
        width: 6, height: 6, borderRadius: "50%",
        background: COLORS.accent2, pointerEvents: "none", zIndex: 9999,
      }} />
      <motion.div style={{
        position: "fixed", left: ringX, top: ringY, x: "-50%", y: "-50%",
        width: hovering ? 60 : 32, height: hovering ? 60 : 32, borderRadius: "50%",
        border: `1px solid ${hovering ? COLORS.accent2 : COLORS.accent}80`,
        background: hovering ? `${COLORS.accent2}10` : "transparent",
        pointerEvents: "none", zIndex: 9998, transition: "width 0.25s, height 0.25s, background 0.25s",
      }} />
    </>
  );
};

// ─── FILM GRAIN OVERLAY ────────────────────────────────────────────
// SVG feTurbulence noise, fixed full-screen, low opacity — the subtle
// texture that makes flat dark backgrounds on sites like this feel
// tactile instead of like a plain CSS gradient.
const GrainOverlay = () => (
  <svg style={{
    position: "fixed", inset: 0, width: "100%", height: "100%",
    zIndex: 2, pointerEvents: "none", opacity: 0.035, mixBlendMode: "overlay",
  }}>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
    </filter>
    <rect width="100%" height="100%" filter="url(#grain)" />
  </svg>
);

// ─── MAGNETIC BUTTON ────────────────────────────────────────────────
// Shifts a few px toward the cursor on hover, snaps back on leave.
const MagneticButton = ({ children, onClick, style, primary }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { damping: 15, stiffness: 200 });
  const springY = useSpring(y, { damping: 15, stiffness: 200 });

  const handleMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.35);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.35);
  };
  const handleLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.button
      ref={ref}
      data-cursor="hover"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onClick}
      style={{ x: springX, y: springY, ...style }}
      whileTap={{ scale: 0.94 }}
    >{children}</motion.button>
  );
};

// ─── HERO 3D SCENE ──────────────────────────────────────────────────
// A distorted, organic wireframe/glass blob — the real WebGL centerpiece.
// Reacts to scroll: shrinks and drifts as the user scrolls past the hero.
const HeroBlob = ({ scrollRef }) => {
  const meshRef = useRef();
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.rotation.x = t * 0.15;
    meshRef.current.rotation.y = t * 0.2;
    const scroll = scrollRef.current;
    meshRef.current.scale.setScalar(1.6 - scroll * 0.9);
    meshRef.current.position.y = scroll * -2.2;
  });
  return (
    <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.5}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.4, 6]} />
        <MeshDistortMaterial
          color={COLORS.accent}
          attach="material"
          distort={0.45}
          speed={1.8}
          roughness={0.15}
          metalness={0.6}
          wireframe
          transparent
          opacity={0.55}
        />
      </mesh>
    </Float>
  );
};

const HeroScene = ({ scrollRef }) => (
  <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
    <Canvas camera={{ position: [0, 0, 5], fov: 45 }} gl={{ alpha: true, antialias: true }} dpr={[1, 1.5]}>
      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={0.6} color={COLORS.accent2} />
        <HeroBlob scrollRef={scrollRef} />
      </Suspense>
    </Canvas>
  </div>
);

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
      borderTop: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}`,
      padding: "0.9rem 0", overflow: "hidden", position: "relative",
    }}>
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        style={{ display: "flex", gap: "3rem", whiteSpace: "nowrap", width: "max-content" }}
      >
        {repeated.map((t, i) => (
          <span key={i} style={{
            fontFamily: "JetBrains Mono, monospace", fontSize: "0.72rem",
            color: COLORS.textDim, letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "0.8rem",
          }}>
            <span style={{ color: COLORS.accent2 }}>◆</span> {t.toUpperCase()}
          </span>
        ))}
      </motion.div>
    </div>
  );
};

// ─── DATA ───────────────────────────────────────────────────────────
const TIERS_DATA = [
  { name: "Wanderer", minElo: 0, maxElo: 499, color: "#6b6a80", description: "Every legend starts here." },
  { name: "Vanguard", minElo: 500, maxElo: 999, color: "#4d8cff", description: "Your voice is sharpening." },
  { name: "Oracle", minElo: 1000, maxElo: 1499, color: "#a06bff", description: "Words flow like prophecy." },
  { name: "Ascendant", minElo: 1500, maxElo: 1999, color: "#4caf82", description: "Logic and fire combined." },
  { name: "Sovereign", minElo: 2000, maxElo: 2499, color: "#7c5cff", description: "You command the arena." },
  { name: "Conqueror", minElo: 2500, maxElo: 2999, color: "#ff5c7c", description: "Unstoppable. Undefeated." },
  { name: "Immortal", minElo: 3000, maxElo: Infinity, color: "#00e5ff", description: "Top 100. Your name echoes." },
];

const FEATURES = [
  { title: "Live Video Debates", description: "Face your opponent in real-time HD video. Your voice, your arguments, your legend." },
  { title: "Audience Decides", description: "Real viewers vote in real-time. No biased judges. The crowd determines the champion." },
  { title: "ELO Ranking", description: "Every debate moves you up or down. Climb from Wanderer to Immortal." },
  { title: "Debate DNA", description: "Your unique fighting style tracked. Aggressive, Analytical, Logical — own it." },
  { title: "Rivalries", description: "Win streaks create rivalries. Challenge your nemesis. Build history worth remembering." },
  { title: "Hall of Legends", description: "The greatest debaters immortalized forever. Will your name be written?" },
];

const DIVISIONS = [
  { name: "Philosophy", color: "#a06bff" },
  { name: "Science", color: "#4caf82" },
  { name: "Politics", color: "#4d8cff" },
  { name: "Gaming", color: "#ff5c7c" },
  { name: "Cinema", color: "#7c5cff" },
  { name: "Sports", color: "#00e5ff" },
];

// ─── SECTION HEADER ───────────────────────────────────────────────
const SectionHeader = ({ eyebrow, title }) => (
  <div style={{ textAlign: "center", marginBottom: "3rem" }}>
    <motion.div
      initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
      style={{
        fontFamily: "JetBrains Mono, monospace", fontSize: "0.7rem",
        color: COLORS.accent2, letterSpacing: "0.3em", marginBottom: "0.8rem",
      }}
    >{eyebrow}</motion.div>
    <motion.h2
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ delay: 0.1 }}
      style={{
        fontFamily: "Cinzel, serif", fontSize: "clamp(2rem,5vw,3.2rem)",
        color: COLORS.text, fontWeight: 700,
      }}
    >{title}</motion.h2>
  </div>
);

// ─── MAIN ─────────────────────────────────────────────────────────
const Landing = () => {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const { scrollYProgress } = useScroll();
  const scrollRef = useRef(0);
  useEffect(() => scrollYProgress.on("change", (v) => { scrollRef.current = v; }), [scrollYProgress]);

  const heroOpacity = useTransform(scrollYProgress, [0, 0.14], [1, 0]);
  const heroTextY = useTransform(scrollYProgress, [0, 0.14], [0, -80]);

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", position: "relative", overflow: "hidden", cursor: "none" }}>
      <CustomCursor />
      <GrainOverlay />

      {/* ── NAV ─────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: isMobile ? "1rem 1.2rem" : "1.2rem 2.5rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: `${COLORS.bg}c0`, backdropFilter: "blur(14px)",
        borderBottom: `1px solid ${COLORS.border}`,
      }}>
        <Logo size={28} showText />
        <div style={{ display: "flex", gap: "0.8rem" }}>
          <button data-cursor="hover" onClick={() => navigate("/login")} style={{
            background: "transparent", border: `1px solid ${COLORS.borderStrong}`, color: COLORS.textDim,
            padding: "0.5rem 1.2rem", borderRadius: 6, fontFamily: "Cinzel,serif",
            fontSize: "0.7rem", letterSpacing: "0.1em", cursor: "pointer",
          }}>SIGN IN</button>
          <button data-cursor="hover" onClick={() => navigate("/register")} style={{
            background: `linear-gradient(135deg,${COLORS.accent},#5a3fd6)`, border: "none", color: "#fff",
            padding: "0.5rem 1.2rem", borderRadius: 6, fontFamily: "Cinzel,serif",
            fontSize: "0.7rem", letterSpacing: "0.1em", cursor: "pointer", fontWeight: 700,
          }}>ENTER ARENA</button>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <motion.section style={{
        opacity: heroOpacity, height: "100vh", position: "relative",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <HeroScene scrollRef={scrollRef} />
        <motion.div style={{ y: heroTextY, textAlign: "center", position: "relative", zIndex: 1, padding: "0 1.5rem" }}>
          <div style={{
            fontFamily: "JetBrains Mono, monospace", fontSize: "0.72rem",
            color: COLORS.accent2, letterSpacing: "0.4em", marginBottom: "1.2rem",
          }}>◆ THE FUTURE OF COMPETITIVE DEBATE ◆</div>
          <h1 style={{
            fontFamily: "Cinzel, serif", fontWeight: 700, lineHeight: 0.95,
            fontSize: isMobile ? "3.5rem" : "clamp(5rem,14vw,11rem)",
            background: `linear-gradient(135deg,${COLORS.accent},${COLORS.accent2})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: "-0.02em", marginBottom: "1.5rem",
          }}><ScrambleText text="UDA" /></h1>
          <p style={{
            fontFamily: "Inter, sans-serif", fontSize: isMobile ? "1rem" : "1.25rem",
            color: COLORS.textDim, maxWidth: 560, margin: "0 auto 2.5rem", lineHeight: 1.7,
          }}>
            The world's first competitive debating esport.<br/>
            Debate. Rank up. <span style={{ color: COLORS.accent2 }}>Become Immortal.</span>
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <MagneticButton
              onClick={() => navigate("/register")}
              style={{
                padding: "1rem 2.2rem", background: `linear-gradient(135deg,${COLORS.accent},#5a3fd6)`,
                border: "none", borderRadius: 8, color: "#fff", fontFamily: "Cinzel,serif",
                fontSize: "0.85rem", letterSpacing: "0.12em", cursor: "pointer", fontWeight: 700,
              }}
            >ENTER THE ARENA</MagneticButton>
            <MagneticButton
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              style={{
                padding: "1rem 2.2rem", background: "transparent", border: `1px solid ${COLORS.borderStrong}`,
                borderRadius: 8, color: COLORS.textDim, fontFamily: "Cinzel,serif",
                fontSize: "0.85rem", letterSpacing: "0.12em", cursor: "pointer",
              }}
            >HOW IT WORKS</MagneticButton>
          </div>
        </motion.div>
        <motion.div
          animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}
          style={{ position: "absolute", bottom: 32, color: COLORS.textFaint, fontSize: "1.2rem" }}
        >▾</motion.div>
      </motion.section>

      <div style={{ position: "relative", zIndex: 1, background: COLORS.bg }}>
        <Ticker />

        {/* ── STATS ───────────────────────────────────────────────── */}
        <div style={{
          display: "flex", justifyContent: "center", flexWrap: "wrap",
          gap: isMobile ? "2rem" : "4rem", padding: "4rem 1.5rem",
        }}>
          {[
            { number: "7", suffix: "", label: "RANK TIERS" },
            { number: "6", suffix: "", label: "DIVISIONS" },
            { number: "3", suffix: "", label: "ROUNDS" },
            { number: "90", suffix: "s", label: "PREP WINDOW" },
            { number: "∞", suffix: "", label: "LEGACY" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{
                fontFamily: "Cinzel, serif", fontSize: "clamp(2rem,4vw,3rem)",
                fontWeight: 700, color: COLORS.accent2,
              }}><AnimatedCounter target={stat.number} suffix={stat.suffix} /></div>
              <div style={{
                fontFamily: "Inter, sans-serif", fontSize: "0.68rem",
                color: COLORS.textFaint, letterSpacing: "0.15em", marginTop: "0.3rem",
              }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── HOW IT WORKS ────────────────────────────────────────── */}
        <div id="how-it-works" style={{ maxWidth: 900, margin: "0 auto", padding: "5rem 1.5rem" }}>
          <SectionHeader eyebrow="THE PROCESS" title="How The Arena Works" />
          {[
            { n: "01", title: "Choose Your Division", desc: "Philosophy, Science, Politics, Gaming, Cinema, or Sports. Pick your battlefield." },
            { n: "02", title: "Get Matched", desc: "Our system finds an opponent near your ELO. Fair fights, every time." },
            { n: "03", title: "90 Seconds to Prep", desc: "Research your angle. Build your argument. The clock is already running." },
            { n: "04", title: "3 Rounds, Live", desc: "Face off in real-time video. The audience watches. The audience decides." },
            { n: "05", title: "Climb or Fall", desc: "ELO shifts after every debate. Wanderer to Immortal — the arena remembers." },
          ].map((step, i) => (
            <motion.div key={step.n}
              initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.08 }}
              style={{
                display: "flex", gap: "1.5rem", padding: "1.5rem 0",
                borderBottom: i < 4 ? `1px solid ${COLORS.border}` : "none", alignItems: "flex-start",
              }}
            >
              <div style={{
                fontFamily: "JetBrains Mono, monospace", fontSize: "1.6rem",
                color: COLORS.textFaint, fontWeight: 700, minWidth: 60,
              }}>{step.n}</div>
              <div>
                <div style={{ fontFamily: "Cinzel, serif", fontSize: "1.1rem", color: COLORS.text, marginBottom: "0.3rem" }}>{step.title}</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: COLORS.textDim, lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── TIERS ───────────────────────────────────────────────── */}
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "5rem 1.5rem" }}>
          <SectionHeader eyebrow="YOUR JOURNEY" title="Seven Tiers of Glory" />
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(4,1fr)",
            gap: "1rem",
          }}>
            {TIERS_DATA.map((tier, i) => (
              <motion.div key={tier.name}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4, borderColor: `${tier.color}60` }}
                data-cursor="hover"
                style={{
                  background: COLORS.bgElevated, border: `1px solid ${COLORS.border}`,
                  borderRadius: 12, padding: "1.4rem", transition: "border-color 0.2s",
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: tier.color, marginBottom: "0.8rem", boxShadow: `0 0 12px ${tier.color}` }} />
                <div style={{ fontFamily: "Cinzel, serif", fontSize: "1.05rem", color: tier.color, fontWeight: 700 }}>{tier.name}</div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: COLORS.textFaint, margin: "0.3rem 0 0.6rem" }}>
                  {tier.minElo}–{tier.maxElo === Infinity ? "∞" : tier.maxElo} ELO
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.78rem", color: COLORS.textDim }}>{tier.description}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── FEATURES ────────────────────────────────────────────── */}
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "5rem 1.5rem" }}>
          <SectionHeader eyebrow="THE PLATFORM" title="Built For Competition" />
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)",
            gap: "1rem",
          }}>
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.06 }}
                data-cursor="hover"
                style={{ background: COLORS.bgElevated, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "1.6rem" }}
              >
                <div style={{ fontFamily: "Cinzel, serif", fontSize: "1rem", color: COLORS.text, marginBottom: "0.6rem", fontWeight: 600 }}>{f.title}</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: COLORS.textDim, lineHeight: 1.6 }}>{f.description}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── DIVISIONS ───────────────────────────────────────────── */}
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "5rem 1.5rem", textAlign: "center" }}>
          <SectionHeader eyebrow="PICK YOUR BATTLEFIELD" title="Six Divisions" />
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.8rem" }}>
            {DIVISIONS.map((div, i) => (
              <motion.div key={div.name}
                initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.06 }}
                data-cursor="hover"
                style={{
                  padding: "0.7rem 1.4rem", borderRadius: 30,
                  border: `1px solid ${div.color}40`, background: `${div.color}10`,
                  fontFamily: "Cinzel, serif", fontSize: "0.85rem", color: div.color, cursor: "pointer",
                }}
              >{div.name}</motion.div>
            ))}
          </div>
        </div>

        {/* ── FINAL CTA ───────────────────────────────────────────── */}
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "6rem 1.5rem", textAlign: "center" }}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ fontFamily: "Cinzel, serif", fontSize: "clamp(2.2rem,6vw,3.5rem)", color: COLORS.text, lineHeight: 1.15, marginBottom: "0.5rem" }}
          >ARE YOU READY</motion.h2>
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            style={{
              fontFamily: "Cinzel, serif", fontSize: "clamp(2.2rem,6vw,3.5rem)", fontWeight: 700, lineHeight: 1.15,
              background: `linear-gradient(135deg,${COLORS.accent},${COLORS.accent2})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "1.5rem",
            }}
          >TO DEBATE?</motion.h2>
          <p style={{ fontFamily: "Inter, sans-serif", color: COLORS.textDim, marginBottom: "2rem", lineHeight: 1.7 }}>
            Join the arena. Your first match is one click away.<br/>Every legend was once a Wanderer.
          </p>
          <MagneticButton
            onClick={() => navigate("/register")}
            style={{
              padding: "1.1rem 2.8rem", background: `linear-gradient(135deg,${COLORS.accent},#5a3fd6)`,
              border: "none", borderRadius: 8, color: "#fff", fontFamily: "Cinzel,serif",
              fontSize: "0.9rem", letterSpacing: "0.14em", cursor: "pointer", fontWeight: 700,
            }}
          >BEGIN YOUR LEGACY</MagneticButton>
        </div>

        {/* ── FOOTER ──────────────────────────────────────────────── */}
        <div style={{
          borderTop: `1px solid ${COLORS.border}`, padding: "2rem 1.5rem",
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem",
        }}>
          <Logo size={20} showText />
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: COLORS.textFaint }}>
            © 2026 UDA - Unlimited Debate Arena
          </span>
        </div>
      </div>
    </div>
  );
};

export default Landing;