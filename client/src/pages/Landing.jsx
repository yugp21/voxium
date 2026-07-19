import { useEffect, useRef, useState, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useInView, useSpring, useMotionValue } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Float } from "@react-three/drei";
import {
  Video, Users, TrendingUp, Fingerprint, Swords, Landmark,
  Compass, Zap as ZapIcon, Crown, Flame, Sparkles, Star,
  ArrowRight, ChevronDown,
} from "lucide-react";
import Logo from "../components/Logo";
import { COLORS } from "../constants/theme";

gsap.registerPlugin(ScrollTrigger);

// ─── RESPONSIVE HOOK ──────────────────────────────────────────────
const useResponsive = () => {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return { isMobile: width < 640, isTablet: width >= 640 && width < 1024, isDesktop: width >= 1024 };
};

// ─── CUSTOM CURSOR ──────────────────────────────────────────────────
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
      mx.set(e.clientX); my.set(e.clientY);
      setHovering(!!e.target.closest('[data-cursor="hover"]'));
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [isDesktop, mx, my]);
  if (!isDesktop) return null;
  return (
    <>
      <motion.div style={{ position: "fixed", left: mx, top: my, x: "-50%", y: "-50%", width: 6, height: 6, borderRadius: "50%", background: COLORS.accent2, pointerEvents: "none", zIndex: 9999 }} />
      <motion.div style={{
        position: "fixed", left: ringX, top: ringY, x: "-50%", y: "-50%",
        width: hovering ? 52 : 30, height: hovering ? 52 : 30, borderRadius: "50%",
        border: `1px solid ${hovering ? COLORS.accent2 : COLORS.accent}80`,
        background: hovering ? `${COLORS.accent2}0c` : "transparent",
        pointerEvents: "none", zIndex: 9998, transition: "width 0.2s, height 0.2s, background 0.2s",
      }} />
    </>
  );
};

// ─── GRAIN OVERLAY ──────────────────────────────────────────────────
const GrainOverlay = () => (
  <svg style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 2, pointerEvents: "none", opacity: 0.03, mixBlendMode: "overlay" }}>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" /></filter>
    <rect width="100%" height="100%" filter="url(#grain)" />
  </svg>
);

// ─── MAGNETIC BUTTON ────────────────────────────────────────────────
const MagneticButton = ({ children, onClick, style }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { damping: 15, stiffness: 200 });
  const springY = useSpring(y, { damping: 15, stiffness: 200 });
  const handleMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.3);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.3);
  };
  const handleLeave = () => { x.set(0); y.set(0); };
  return (
    <motion.button ref={ref} data-cursor="hover"
      onMouseMove={handleMove} onMouseLeave={handleLeave} onClick={onClick}
      style={{ x: springX, y: springY, ...style }} whileTap={{ scale: 0.95 }}
    >{children}</motion.button>
  );
};

// ─── HERO 3D SCENE — the one real WebGL centerpiece, kept ─────────
const HeroBlob = ({ scrollRef }) => {
  const meshRef = useRef();
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.rotation.x = t * 0.12;
    meshRef.current.rotation.y = t * 0.16;
    const scroll = scrollRef.current;
    meshRef.current.scale.setScalar(1.5 - scroll * 0.8);
    meshRef.current.position.y = scroll * -2;
  });
  return (
    <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.5}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.35, 6]} />
        <MeshDistortMaterial color={COLORS.accent} attach="material" distort={0.4} speed={1.6} roughness={0.2} metalness={0.5} wireframe transparent opacity={0.5} />
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

// ─── ANIMATED COUNTER ─────────────────────────────────────────────
const AnimatedCounter = ({ target, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || target === "∞") return;
    const num = parseFloat(target);
    const start = Date.now();
    const timer = setInterval(() => {
      const p = Math.min((Date.now() - start) / 1600, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * num));
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
    <div style={{ borderTop: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}`, padding: "0.9rem 0", overflow: "hidden" }}>
      <motion.div animate={{ x: ["0%", "-50%"] }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }} style={{ display: "flex", gap: "3rem", whiteSpace: "nowrap", width: "max-content" }}>
        {repeated.map((t, i) => (
          <span key={i} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.72rem", color: COLORS.textDim, letterSpacing: "0.03em", display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <Sparkles size={11} color={COLORS.accent2} /> {t.toUpperCase()}
          </span>
        ))}
      </motion.div>
    </div>
  );
};

// ─── DATA ───────────────────────────────────────────────────────────
const TIERS_DATA = [
  { name: "Wanderer", minElo: 0, maxElo: 499, color: "#6b6a80", icon: Compass, description: "Every legend starts here." },
  { name: "Vanguard", minElo: 500, maxElo: 999, color: "#4d8cff", icon: Swords, description: "Your voice is sharpening." },
  { name: "Oracle", minElo: 1000, maxElo: 1499, color: "#a06bff", icon: Sparkles, description: "Words flow like prophecy." },
  { name: "Ascendant", minElo: 1500, maxElo: 1999, color: "#4caf82", icon: Star, description: "Logic and fire combined." },
  { name: "Sovereign", minElo: 2000, maxElo: 2499, color: "#7c5cff", icon: Crown, description: "You command the arena." },
  { name: "Conqueror", minElo: 2500, maxElo: 2999, color: "#ff5c7c", icon: Flame, description: "Unstoppable. Undefeated." },
  { name: "Immortal", minElo: 3000, maxElo: Infinity, color: "#00e5ff", icon: ZapIcon, description: "Top 100. Your name echoes." },
];
const FEATURES = [
  { title: "Live Video Debates", description: "Face your opponent in real-time HD video. Your voice, your legend.", icon: Video, big: true },
  { title: "Audience Decides", description: "Real viewers vote live. No biased judges.", icon: Users },
  { title: "ELO Ranking", description: "Every debate moves you up or down.", icon: TrendingUp },
  { title: "Debate DNA", description: "Your fighting style, tracked and owned.", icon: Fingerprint },
  { title: "Rivalries", description: "Win streaks create nemeses worth remembering.", icon: Swords },
  { title: "Hall of Legends", description: "The greatest, immortalized forever.", icon: Landmark },
];
const DIVISIONS = [
  { name: "Philosophy", color: "#a06bff" }, { name: "Science", color: "#4caf82" },
  { name: "Politics", color: "#4d8cff" }, { name: "Gaming", color: "#ff5c7c" },
  { name: "Cinema", color: "#7c5cff" }, { name: "Sports", color: "#00e5ff" },
];

const SectionHeader = ({ eyebrow, title }) => (
  <div style={{ textAlign: "center", marginBottom: "3rem" }}>
    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
      style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.7rem", color: COLORS.accent2, letterSpacing: "0.25em", marginBottom: "0.8rem", fontWeight: 600 }}
    >{eyebrow}</motion.div>
    <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
      style={{ fontFamily: "Inter, sans-serif", fontSize: "clamp(1.9rem,4.5vw,2.9rem)", color: COLORS.text, fontWeight: 700, letterSpacing: "-0.02em" }}
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

  const heroSectionRef = useRef(null);
  const badgeRef = useRef(null);
  const titleRef = useRef(null);
  const subtextRef = useRef(null);
  const ctaRef = useRef(null);

  // Real GSAP ScrollTrigger choreography: the hero PINS in place for an
  // extra viewport of scroll distance while its contents exit in a
  // staggered sequence (badge → title → subtext → CTAs), each scrubbed
  // directly to scroll position rather than firing on a timer. This is
  // the actual "pinned section" / "scroll-linked reveal" pattern from
  // the brief — framer-motion's whileInView can't pin an element.
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: heroSectionRef.current,
          start: "top top",
          end: "+=100%",
          scrub: 0.6,
          pin: true,
        },
      });
      tl.to(badgeRef.current, { y: -40, opacity: 0, ease: "none" }, 0)
        .to(titleRef.current, { scale: 0.85, opacity: 0, y: -60, ease: "none" }, 0.05)
        .to(subtextRef.current, { y: -30, opacity: 0, ease: "none" }, 0.1)
        .to(ctaRef.current, { y: -20, opacity: 0, ease: "none" }, 0.15);
    });
    return () => ctx.revert();
  }, []);

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", position: "relative", overflow: "hidden", cursor: "none", fontFamily: "Inter, -apple-system, sans-serif" }}>
      <CustomCursor />
      <GrainOverlay />

      {/* ── NAV ─────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: isMobile ? "1rem 1.2rem" : "1.2rem 2.5rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: `${COLORS.bg}c8`, backdropFilter: "blur(14px)", borderBottom: `1px solid ${COLORS.border}`,
      }}>
        <Logo size={28} showText />
        {!isMobile && (
          <div style={{ display: "flex", gap: "2rem" }}>
            {["Process", "Tiers", "Divisions"].map((l) => (
              <span key={l} data-cursor="hover" style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", fontWeight: 500, color: COLORS.textDim, cursor: "pointer" }}>{l}</span>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: "0.7rem" }}>
          <button data-cursor="hover" onClick={() => navigate("/login")} style={{
            background: "transparent", border: `1px solid ${COLORS.borderStrong}`, color: COLORS.textDim,
            padding: "0.55rem 1.2rem", borderRadius: 8, fontFamily: "Inter,sans-serif", fontWeight: 600,
            fontSize: "0.8rem", cursor: "pointer",
          }}>Sign In</button>
          <button data-cursor="hover" onClick={() => navigate("/register")} style={{
            background: `linear-gradient(135deg,${COLORS.accent},#5a3fd6)`, border: "none", color: "#fff",
            padding: "0.55rem 1.2rem", borderRadius: 8, fontFamily: "Inter,sans-serif", fontWeight: 600,
            fontSize: "0.8rem", cursor: "pointer",
          }}>Enter Arena</button>
        </div>
      </nav>

      {/* ── HERO (GSAP ScrollTrigger pinned) ───────────────────── */}
      <section ref={heroSectionRef} style={{ height: "100vh", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <HeroScene scrollRef={scrollRef} />
        <div style={{ textAlign: "center", position: "relative", zIndex: 1, padding: "0 1.5rem" }}>
          <div ref={badgeRef} style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            fontFamily: "JetBrains Mono, monospace", fontSize: "0.72rem", fontWeight: 600,
            color: COLORS.accent2, letterSpacing: "0.15em", marginBottom: "1.4rem",
            border: `1px solid ${COLORS.accentDim}`, borderRadius: 20, padding: "0.4rem 1rem",
          }}><ZapIcon size={12} /> THE WORLD'S FIRST COMPETITIVE DEBATE ESPORT</div>
          <h1 ref={titleRef} style={{
            fontFamily: "Inter, sans-serif", fontWeight: 800, lineHeight: 0.95,
            fontSize: isMobile ? "3.6rem" : "clamp(5rem,12vw,9rem)",
            background: `linear-gradient(135deg,${COLORS.text},${COLORS.accent} 60%,${COLORS.accent2})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: "-0.04em", marginBottom: "1.5rem",
          }}>UDA</h1>
          <p ref={subtextRef} style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: isMobile ? "1rem" : "1.2rem", color: COLORS.textDim, maxWidth: 540, margin: "0 auto 2.5rem", lineHeight: 1.7 }}>
            Debate. Rank up. <span style={{ color: COLORS.text, fontWeight: 600 }}>Become Immortal.</span>
          </p>
          <div ref={ctaRef} style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <MagneticButton onClick={() => navigate("/register")} style={{
              padding: "1rem 2.2rem", background: `linear-gradient(135deg,${COLORS.accent},#5a3fd6)`,
              border: "none", borderRadius: 10, color: "#fff", fontFamily: "Inter,sans-serif", fontWeight: 700,
              fontSize: "0.88rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem",
            }}>Enter The Arena <ArrowRight size={16} /></MagneticButton>
            <MagneticButton onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} style={{
              padding: "1rem 2.2rem", background: "transparent", border: `1px solid ${COLORS.borderStrong}`,
              borderRadius: 10, color: COLORS.textDim, fontFamily: "Inter,sans-serif", fontWeight: 600,
              fontSize: "0.88rem", cursor: "pointer",
            }}>How It Works</MagneticButton>
          </div>
        </div>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }} style={{ position: "absolute", bottom: 32, color: COLORS.textFaint }}>
          <ChevronDown size={22} />
        </motion.div>
      </section>

      <div style={{ position: "relative", zIndex: 1, background: COLORS.bg }}>
        <Ticker />

        {/* ── STATS ───────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: isMobile ? "2rem" : "4rem", padding: "4rem 1.5rem" }}>
          {[
            { number: "7", suffix: "", label: "RANK TIERS" }, { number: "6", suffix: "", label: "DIVISIONS" },
            { number: "3", suffix: "", label: "ROUNDS" }, { number: "90", suffix: "s", label: "PREP WINDOW" },
            { number: "∞", suffix: "", label: "LEGACY" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 700, color: COLORS.text }}>
                <AnimatedCounter target={stat.number} suffix={stat.suffix} />
              </div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: COLORS.accent2, letterSpacing: "0.15em", marginTop: "0.3rem", fontWeight: 600 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── HOW IT WORKS ────────────────────────────────────────── */}
        <div id="how-it-works" style={{ maxWidth: 1000, margin: "0 auto", padding: "5rem 1.5rem" }}>
          <SectionHeader eyebrow="THE PROCESS" title="How the arena works" />
          {[
            { n: "01", title: "Choose Your Division", desc: "Philosophy, Science, Politics, Gaming, Cinema, or Sports. Pick your battlefield." },
            { n: "02", title: "Get Matched", desc: "Our system finds an opponent near your ELO. Fair fights, every time." },
            { n: "03", title: "90 Seconds to Prep", desc: "Research your angle. Build your argument. The clock is already running." },
            { n: "04", title: "3 Rounds, Live", desc: "Face off in real-time video. The audience watches. The audience decides." },
            { n: "05", title: "Climb or Fall", desc: "ELO shifts after every debate. Wanderer to Immortal — the arena remembers." },
          ].map((step, i) => (
            <motion.div key={step.n}
              initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.08 }}
              style={{ display: "flex", gap: "1.5rem", padding: "1.5rem 0", borderBottom: i < 4 ? `1px solid ${COLORS.border}` : "none", alignItems: "flex-start" }}
            >
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "1.5rem", color: COLORS.accentDim, fontWeight: 700, minWidth: 56 }}>{step.n}</div>
              <div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.05rem", color: COLORS.text, marginBottom: "0.3rem", fontWeight: 600 }}>{step.title}</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.85rem", color: COLORS.textDim, lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── TIERS ───────────────────────────────────────────────── */}
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "5rem 1.5rem" }}>
          <SectionHeader eyebrow="YOUR JOURNEY" title="Seven tiers of glory" />
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(4,1fr)", gap: "1rem" }}>
            {TIERS_DATA.map((tier, i) => (
              <motion.div key={tier.name}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.05 }} whileHover={{ y: -4, borderColor: `${tier.color}60` }} data-cursor="hover"
                style={{ background: COLORS.bgElevated, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "1.4rem", transition: "border-color 0.2s" }}
              >
                <tier.icon size={22} color={tier.color} strokeWidth={1.75} style={{ marginBottom: "0.8rem" }} />
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: "1.02rem", color: tier.color, fontWeight: 700 }}>{tier.name}</div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "0.65rem", color: COLORS.textFaint, margin: "0.3rem 0 0.6rem" }}>
                  {tier.minElo}–{tier.maxElo === Infinity ? "∞" : tier.maxElo} ELO
                </div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.8rem", color: COLORS.textDim }}>{tier.description}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── FEATURES ────────────────────────────────────────────── */}
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "5rem 1.5rem" }}>
          <SectionHeader eyebrow="THE PLATFORM" title="Built for competition" />
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: "1rem" }}>
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.06 }} data-cursor="hover"
                style={{
                  background: f.big ? `linear-gradient(135deg,${COLORS.accentSoft},${COLORS.bgElevated})` : COLORS.bgElevated,
                  border: `1px solid ${f.big ? COLORS.accentDim : COLORS.border}`, borderRadius: 12, padding: "1.6rem",
                  gridColumn: f.big && !isMobile ? "span 2" : "span 1",
                }}
              >
                <f.icon size={24} color={f.big ? COLORS.accent2 : COLORS.accent} strokeWidth={1.75} style={{ marginBottom: "0.9rem" }} />
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: f.big ? "1.15rem" : "1rem", color: COLORS.text, marginBottom: "0.5rem", fontWeight: 600 }}>{f.title}</div>
                <div style={{ fontFamily: "Inter, sans-serif", fontSize: "0.82rem", color: COLORS.textDim, lineHeight: 1.6 }}>{f.description}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── DIVISIONS ───────────────────────────────────────────── */}
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "5rem 1.5rem", textAlign: "center" }}>
          <SectionHeader eyebrow="PICK YOUR BATTLEFIELD" title="Six divisions" />
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.8rem" }}>
            {DIVISIONS.map((div, i) => (
              <motion.div key={div.name}
                initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                transition={{ delay: i * 0.05 }} whileHover={{ scale: 1.06 }} data-cursor="hover"
                style={{ padding: "0.7rem 1.4rem", borderRadius: 30, border: `1px solid ${div.color}40`, background: `${div.color}12`, fontFamily: "Inter, sans-serif", fontSize: "0.85rem", fontWeight: 600, color: div.color, cursor: "pointer" }}
              >{div.name}</motion.div>
            ))}
          </div>
        </div>

        {/* ── FINAL CTA ───────────────────────────────────────────── */}
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "6rem 1.5rem", textAlign: "center" }}>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: "clamp(2.2rem,5.5vw,3.4rem)", color: COLORS.text, lineHeight: 1.15, marginBottom: "1.5rem" }}
          >Ready to <span style={{
            background: `linear-gradient(135deg,${COLORS.accent},${COLORS.accent2})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>debate?</span></motion.h2>
          <p style={{ fontFamily: "Inter, sans-serif", color: COLORS.textDim, marginBottom: "2rem", lineHeight: 1.7 }}>
            Join the arena. Your first match is one click away.<br/>Every legend was once a Wanderer.
          </p>
          <MagneticButton onClick={() => navigate("/register")} style={{
            padding: "1.1rem 2.6rem", background: `linear-gradient(135deg,${COLORS.accent},#5a3fd6)`,
            border: "none", borderRadius: 10, color: "#fff", fontFamily: "Inter,sans-serif", fontWeight: 700,
            fontSize: "0.92rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.5rem",
          }}>Begin Your Legacy <ArrowRight size={16} /></MagneticButton>
        </div>

        <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: "2rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <Logo size={20} showText />
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: "0.72rem", color: COLORS.textFaint }}>© 2026 UDA - Unlimited Debate Arena</span>
        </div>
      </div>
    </div>
  );
};

export default Landing;