import { useId } from "react";

/**
 * Frise inspirée des toiles peintes de Korhogo (motifs tracés à la main) :
 * l'élément signature du site. Purement décoratif.
 */
export function KorhogoBand({ className = "", color = "currentColor" }: { className?: string; color?: string }) {
  const id = useId();
  return (
    <svg className={className} height="28" width="100%" aria-hidden="true" focusable="false">
      <defs>
        <pattern id={id} width="112" height="28" patternUnits="userSpaceOnUse">
          <g fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {/* poisson */}
            <path d="M4 14c6-7 16-7 22 0-6 7-16 7-22 0Zm22 0 5-5v10Z" />
            <circle cx="11" cy="13" r="1" fill={color} />
            {/* chevrons */}
            <path d="M40 8l5 6-5 6M47 8l5 6-5 6" />
            {/* oiseau / calao */}
            <path d="M62 20c3-8 9-11 15-9l5-3-2 5c1 4-2 7-7 7Z M66 20v4m6-4v4" />
            {/* points de semis */}
            <circle cx="92" cy="9" r="1.6" fill={color} />
            <circle cx="98" cy="14" r="1.6" fill={color} />
            <circle cx="92" cy="19" r="1.6" fill={color} />
            <circle cx="104" cy="9" r="1.6" fill={color} />
            <circle cx="104" cy="19" r="1.6" fill={color} />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="28" fill={`url(#${id})`} />
    </svg>
  );
}
