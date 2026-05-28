export default function EECLogo({ size = 44 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size * 0.83}
      viewBox="0 0 240 200"
      xmlns="http://www.w3.org/2000/svg"
      className="logo-mark"
    >
      <defs>
        <linearGradient id="lp-sailGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFD93D" />
          <stop offset="100%" stopColor="#F5C518" />
        </linearGradient>
      </defs>
      <path
        d="M 18 32 Q 80 12 168 22 Q 152 90 144 168 Q 80 110 24 60 Q 14 46 18 32 Z"
        fill="url(#lp-sailGrad)"
        stroke="#C99A0E"
        strokeWidth="1.5"
      />
      <g fill="#0F5A2A" fontFamily="Georgia, serif" fontWeight="900" fontStyle="italic" fontSize="48" letterSpacing="-2">
        <text x="44" y="92">E</text>
        <text x="74" y="92">E</text>
        <text x="104" y="92">C</text>
      </g>
      <path d="M 38 110 Q 70 116 102 108 T 158 102" stroke="#0F5A2A" strokeWidth="2" fill="none" strokeLinecap="round" />
      <text x="80" y="148" fill="#0F5A2A" fontFamily="Inter, sans-serif" fontWeight="600" fontSize="6.5" letterSpacing="1.2" textAnchor="middle">
        LA MARCHE ENSEMBLE
      </text>
      <g fill="#FFFFFF" stroke="#E8E1D2" strokeWidth="0.8">
        <rect x="186" y="50" width="14" height="120" rx="1" />
        <rect x="166" y="78" width="54" height="14" rx="1" />
      </g>
    </svg>
  );
}
