const Logo = ({ size = 32, showText = false, onClick, style = {} }) => (
  <div
    onClick={onClick}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: showText ? "0.65rem" : 0,
      cursor: onClick ? "pointer" : "default",
      ...style,
    }}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <rect width="64" height="64" rx="14" fill="#0a0a0a"/>
      <circle cx="32" cy="32" r="27" stroke="#c9a84c" strokeOpacity="0.22" strokeWidth="1"/>
      <path
        d="M20 16c4 8 6 14 6 20 0 6-2 12-6 20"
        stroke="url(#vox-gold-inline)"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M44 16c-4 8-6 14-6 20 0 6 2 12 6 20"
        stroke="url(#vox-gold-inline)"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M18 44 L32 22 L46 44 Z"
        fill="url(#vox-gold-inline)"
        stroke="#e8c97a"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="34" r="2.2" fill="#0a0a0a"/>
      <defs>
        <linearGradient id="vox-gold-inline" x1="18" y1="16" x2="46" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e8c97a"/>
          <stop offset="0.45" stopColor="#c9a84c"/>
          <stop offset="1" stopColor="#a07830"/>
        </linearGradient>
      </defs>
    </svg>
    {showText && (
      <span
        style={{
          fontFamily: "Cinzel Decorative, serif",
          fontSize: size * 0.42,
          color: "#c9a84c",
          letterSpacing: "0.2em",
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        UDA
      </span>
    )}
  </div>
);

export default Logo;
