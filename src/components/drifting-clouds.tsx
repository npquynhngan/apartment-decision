export function DriftingClouds() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-14 overflow-hidden select-none"
      style={{ zIndex: 0 }}
    >
      {/* Slower, larger cloud */}
      <svg
        className="cloud-a absolute top-1 left-0"
        width="160"
        height="40"
        viewBox="0 0 160 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="50"  cy="28" rx="50"  ry="14" fill="#D8D0F0" opacity="0.28" />
        <ellipse cx="85"  cy="22" rx="38"  ry="18" fill="#D8D0F0" opacity="0.28" />
        <ellipse cx="120" cy="28" rx="35"  ry="13" fill="#D8D0F0" opacity="0.28" />
        <ellipse cx="148" cy="30" rx="20"  ry="10" fill="#D8D0F0" opacity="0.20" />
      </svg>

      {/* Faster, smaller cloud — different y position for parallax */}
      <svg
        className="cloud-b absolute top-5 left-0"
        width="100"
        height="28"
        viewBox="0 0 100 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse cx="32"  cy="19" rx="32"  ry="10" fill="#D8D0F0" opacity="0.18" />
        <ellipse cx="58"  cy="15" rx="26"  ry="13" fill="#D8D0F0" opacity="0.18" />
        <ellipse cx="82"  cy="19" rx="22"  ry="9"  fill="#D8D0F0" opacity="0.14" />
      </svg>
    </div>
  );
}
