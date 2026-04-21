export function CastleSilhouette() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute bottom-0 right-0 select-none overflow-hidden"
      style={{ opacity: 0.075 }}
    >
      <svg
        width="380"
        height="220"
        viewBox="0 0 380 220"
        fill="var(--ink-plum)"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Chimney stacks — far left */}
        <rect x="14" y="58" width="5"  height="42" />
        <rect x="22" y="46" width="5"  height="54" />
        <rect x="9"  y="68" width="4"  height="32" />

        {/* Tower 1 — tallest left */}
        <rect x="14" y="98"  width="42" height="58" />
        <polygon points="14,98 35,58 56,98" />
        <rect x="27" y="112" width="10" height="13" fill="rgba(245,236,215,0.2)" />

        {/* Tower 2 — short left */}
        <rect x="58"  y="110" width="34" height="46" />
        <polygon points="58,110 75,84 92,110" />
        <rect x="68"  y="122" width="8"  height="10" fill="rgba(245,236,215,0.2)" />

        {/* Connector section */}
        <rect x="92"  y="116" width="44" height="40" />

        {/* Chimney on connector */}
        <rect x="104" y="96" width="5"  height="22" />
        <rect x="112" y="100" width="4" height="18" />

        {/* Central tower — tallest */}
        <rect x="140" y="62"  width="58" height="94" />
        <polygon points="140,62 169,22 198,62" />
        {/* Central flag */}
        <rect x="165" y="6"   width="4"  height="20" />
        <polygon points="169,6 185,12 169,18" />
        {/* Windows */}
        <rect x="153" y="76" width="10" height="15" fill="rgba(245,236,215,0.2)" />
        <rect x="173" y="76" width="10" height="15" fill="rgba(245,236,215,0.2)" />
        <rect x="159" y="100" width="20" height="18" fill="rgba(245,236,215,0.2)" />

        {/* Tower 3 — right of centre */}
        <rect x="202" y="78"  width="44" height="78" />
        <polygon points="202,78 224,50 246,78" />
        <rect x="213" y="92" width="9"  height="12" fill="rgba(245,236,215,0.2)" />

        {/* Tower 4 — small right */}
        <rect x="250" y="98"  width="30" height="58" />
        <polygon points="250,98 265,74 280,98" />

        {/* Tower 5 — rightmost */}
        <rect x="284" y="90"  width="38" height="66" />
        <polygon points="284,90 303,62 322,90" />
        <rect x="296" y="104" width="9"  height="12" fill="rgba(245,236,215,0.2)" />

        {/* Chimney stacks — right side */}
        <rect x="330" y="72" width="5"  height="38" />
        <rect x="338" y="80" width="4"  height="30" />

        {/* Main body band connecting all towers */}
        <rect x="14" y="156" width="312" height="28" />

        {/* Decorative band line */}
        <rect x="14" y="152" width="312" height="4" opacity="0.5" />

        {/* Walking legs — 8 legs with gear circles at joints */}
        <rect x="24"  y="184" width="13" height="36" />
        <circle cx="30"  cy="183" r="6" />

        <rect x="56"  y="180" width="13" height="40" />
        <circle cx="62"  cy="179" r="6" />

        <rect x="94"  y="184" width="13" height="36" />
        <circle cx="100" cy="183" r="6" />

        <rect x="132" y="179" width="13" height="41" />
        <circle cx="138" cy="178" r="6" />

        <rect x="172" y="184" width="13" height="36" />
        <circle cx="178" cy="183" r="6" />

        <rect x="212" y="180" width="13" height="40" />
        <circle cx="218" cy="179" r="6" />

        <rect x="252" y="184" width="13" height="36" />
        <circle cx="258" cy="183" r="6" />

        <rect x="290" y="180" width="13" height="40" />
        <circle cx="296" cy="179" r="6" />

        {/* Foot pads */}
        <rect x="20"  y="218" width="21" height="4" rx="2" />
        <rect x="52"  y="218" width="21" height="4" rx="2" />
        <rect x="90"  y="218" width="21" height="4" rx="2" />
        <rect x="128" y="218" width="21" height="4" rx="2" />
        <rect x="168" y="218" width="21" height="4" rx="2" />
        <rect x="208" y="218" width="21" height="4" rx="2" />
        <rect x="248" y="218" width="21" height="4" rx="2" />
        <rect x="286" y="218" width="21" height="4" rx="2" />
      </svg>
    </div>
  );
}
