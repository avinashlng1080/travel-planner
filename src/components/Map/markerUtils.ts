/**
 * Marker Utilities
 *
 * Shared marker SVG generation for map components.
 * Extracted from FullScreenMap.tsx for reuse across map implementations.
 */

// Vibrant, dramatic colors for map markers - high saturation for maximum visibility
export const CATEGORY_COLORS: Record<string, string> = {
  'home-base': '#FF4500',       // OrangeRed - dramatic home beacon
  'toddler-friendly': '#FF1493', // DeepPink - vibrant, playful
  attraction: '#00CED1',         // DarkTurquoise - eye-catching adventure
  shopping: '#FFD700',           // Gold - luxurious shine
  restaurant: '#FF6347',         // Tomato - appetizing warmth
  nature: '#00FF7F',             // SpringGreen - vivid natural
  temple: '#DC143C',             // Crimson - sacred, bold
  playground: '#1E90FF',         // DodgerBlue - electric playful
  medical: '#FF0000',            // Red - universal emergency
  avoid: '#94A3B8',              // Lighter slate - muted
  'ai-suggested': '#FF4500',     // OrangeRed for AI
};

// Plan indicator type
export type PlanIndicator = 'A' | 'B' | 'both' | null;

// Plan ring colors
export const PLAN_A_COLOR = '#10B981'; // Green
export const PLAN_B_COLOR = '#6366F1'; // Indigo

/**
 * Create SVG marker for a specific category
 *
 * Each marker has a distinctive silhouette shape that's recognizable at a glance.
 * Supports plan indicator rings (A, B, or both) around the marker.
 */
export function createCategoryMarkerSVG(
  category: string,
  size: number,
  isSelected: boolean,
  planIndicator: PlanIndicator = null
): string {
  // Dramatic multi-layer shadows for maximum visibility
  const isHomeBase = category === 'home-base';
  const isImportant = ['toddler-friendly', 'medical', 'attraction'].includes(category);

  let shadow: string;
  if (isHomeBase) {
    // Home base: Strong orange glow + multiple shadow layers
    shadow = isSelected
      ? 'filter: drop-shadow(0 0 20px rgba(255, 69, 0, 0.8)) drop-shadow(0 8px 16px rgba(0,0,0,0.6)) drop-shadow(0 4px 8px rgba(0,0,0,0.4));'
      : 'filter: drop-shadow(0 0 12px rgba(255, 69, 0, 0.6)) drop-shadow(0 6px 12px rgba(0,0,0,0.5)) drop-shadow(0 3px 6px rgba(0,0,0,0.3));';
  } else if (isImportant) {
    shadow = isSelected
      ? 'filter: drop-shadow(0 6px 12px rgba(0,0,0,0.5)) drop-shadow(0 3px 6px rgba(0,0,0,0.3));'
      : 'filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4)) drop-shadow(0 2px 4px rgba(0,0,0,0.2));';
  } else {
    shadow = isSelected
      ? 'filter: drop-shadow(0 5px 10px rgba(0,0,0,0.5));'
      : 'filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4));';
  }

  const pulse = isSelected ? 'animation: pulse 1s ease-in-out infinite;' : '';
  const color = CATEGORY_COLORS[category] || '#64748b';

  // Increased stroke widths for better visibility
  const ringStrokeWidth = isHomeBase ? 4 : isImportant ? 3 : 2.5;
  const ringRadius = 22;

  // Create plan indicator ring
  let planRing = '';
  if (planIndicator === 'A') {
    planRing = `<circle cx="20" cy="22" r="${ringRadius}" fill="none" stroke="${PLAN_A_COLOR}" stroke-width="${ringStrokeWidth}"/>`;
  } else if (planIndicator === 'B') {
    planRing = `<circle cx="20" cy="22" r="${ringRadius}" fill="none" stroke="${PLAN_B_COLOR}" stroke-width="${ringStrokeWidth}"/>`;
  } else if (planIndicator === 'both') {
    planRing = `
      <path d="M20 ${22 - ringRadius} A${ringRadius} ${ringRadius} 0 0 1 20 ${22 + ringRadius}"
            fill="none" stroke="${PLAN_A_COLOR}" stroke-width="${ringStrokeWidth}"/>
      <path d="M20 ${22 + ringRadius} A${ringRadius} ${ringRadius} 0 0 1 20 ${22 - ringRadius}"
            fill="none" stroke="${PLAN_B_COLOR}" stroke-width="${ringStrokeWidth}"/>
    `;
  }

  const markers: Record<string, string> = {
    // ULTRA-PROMINENT home base - MASSIVE and BRIGHT (no animations for Google Maps compatibility)
    'home-base': `
      <svg width="${size * 1.8}" height="${size * 1.8}" viewBox="0 0 60 66" style="${shadow}">
        ${planRing}
        <!-- Multiple bright glow rings - static but very visible -->
        <circle cx="30" cy="33" r="42" fill="none" stroke="#FFD700" stroke-width="4" opacity="0.6"/>
        <circle cx="30" cy="33" r="38" fill="none" stroke="#FF4500" stroke-width="3" opacity="0.5"/>
        <circle cx="30" cy="33" r="34" fill="none" stroke="#FFD700" stroke-width="2" opacity="0.7"/>
        <!-- Solid bright white background -->
        <circle cx="30" cy="33" r="30" fill="#FFFFFF" opacity="1"/>
        <!-- Bright border circle -->
        <circle cx="30" cy="33" r="30" fill="none" stroke="#FFD700" stroke-width="3"/>
        <!-- HUGE house icon with bold strokes -->
        <path d="M30 8 L52 26 L52 58 L8 58 L8 26 Z" fill="${color}" stroke="#FFFFFF" stroke-width="5"/>
        <rect x="22" y="38" width="16" height="20" fill="#FFD700" opacity="0.7" stroke="#FFFFFF" stroke-width="2"/>
        <polygon points="30,8 8,26 52,26" fill="${color}" stroke="#FFFFFF" stroke-width="5"/>
        <rect x="36" y="30" width="10" height="10" fill="#FFD700" opacity="0.8" stroke="#FFFFFF" stroke-width="2"/>
        <!-- Big star/sparkle on top -->
        <circle cx="30" cy="10" r="4" fill="#FFD700"/>
        <circle cx="30" cy="10" r="2" fill="#FFFFFF"/>
      </svg>
    `,

    // Heart with baby for toddler-friendly
    'toddler-friendly': `
      <svg width="${size}" height="${size}" viewBox="0 0 40 44" style="${shadow}${pulse}">
        <path d="M20 38 C20 38 4 26 4 14 C4 8 9 4 15 4 C18 4 20 6 20 6 C20 6 22 4 25 4 C31 4 36 8 36 14 C36 26 20 38 20 38Z" fill="${color}" stroke="white" stroke-width="3"/>
        <circle cx="20" cy="18" r="6" fill="white" opacity="0.4"/>
        <circle cx="20" cy="16" r="3" fill="white" opacity="0.6"/>
      </svg>
    `,

    // Camera/landmark for attractions
    attraction: `
      <svg width="${size}" height="${size}" viewBox="0 0 40 44" style="${shadow}${pulse}">
        <path d="M6 12 L14 12 L17 8 L23 8 L26 12 L34 12 L34 36 L6 36 Z" fill="${color}" stroke="white" stroke-width="3"/>
        <circle cx="20" cy="24" r="8" fill="white" opacity="0.3" stroke="white" stroke-width="1"/>
        <circle cx="20" cy="24" r="5" fill="white" opacity="0.5"/>
        <rect x="28" y="14" width="4" height="3" rx="1" fill="white" opacity="0.4"/>
      </svg>
    `,

    // Shopping bag silhouette
    shopping: `
      <svg width="${size}" height="${size}" viewBox="0 0 40 44" style="${shadow}${pulse}">
        <path d="M8 14 L32 14 L34 42 L6 42 Z" fill="${color}" stroke="white" stroke-width="2.5"/>
        <path d="M14 14 L14 10 C14 6 16 4 20 4 C24 4 26 6 26 10 L26 14" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="20" cy="28" rx="6" ry="8" fill="white" opacity="0.2"/>
      </svg>
    `,

    // Plate with utensils for restaurants
    restaurant: `
      <svg width="${size}" height="${size}" viewBox="0 0 40 44" style="${shadow}${pulse}">
        <ellipse cx="20" cy="24" rx="16" ry="16" fill="${color}" stroke="white" stroke-width="2.5"/>
        <ellipse cx="20" cy="24" rx="10" ry="10" fill="white" opacity="0.2"/>
        <rect x="8" y="4" width="2" height="16" rx="1" fill="white" opacity="0.8"/>
        <rect x="12" y="4" width="2" height="16" rx="1" fill="white" opacity="0.8"/>
        <path d="M28 4 L28 12 C28 15 30 16 30 16 L30 20" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M32 4 L32 10 L28 10" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      </svg>
    `,

    // Tree silhouette for nature/parks
    nature: `
      <svg width="${size}" height="${size}" viewBox="0 0 40 44" style="${shadow}${pulse}">
        <path d="M20 2 L32 18 L26 18 L34 30 L6 30 L14 18 L8 18 Z" fill="${color}" stroke="white" stroke-width="2.5"/>
        <rect x="17" y="30" width="6" height="12" fill="#8B4513" stroke="white" stroke-width="1"/>
        <circle cx="14" cy="14" r="3" fill="white" opacity="0.3"/>
        <circle cx="26" cy="20" r="2" fill="white" opacity="0.3"/>
      </svg>
    `,

    // Pagoda/temple silhouette
    temple: `
      <svg width="${size}" height="${size}" viewBox="0 0 40 44" style="${shadow}${pulse}">
        <path d="M20 2 L28 10 L12 10 Z" fill="${color}" stroke="white" stroke-width="2.5"/>
        <path d="M8 10 L32 10 L30 18 L10 18 Z" fill="${color}" stroke="white" stroke-width="2.5"/>
        <path d="M6 18 L34 18 L31 28 L9 28 Z" fill="${color}" stroke="white" stroke-width="2.5"/>
        <path d="M4 28 L36 28 L34 42 L6 42 Z" fill="${color}" stroke="white" stroke-width="2.5"/>
        <rect x="17" y="32" width="6" height="10" fill="white" opacity="0.4"/>
        <circle cx="20" cy="6" r="2" fill="#FFD700"/>
      </svg>
    `,

    // Swing/playground silhouette
    playground: `
      <svg width="${size}" height="${size}" viewBox="0 0 40 44" style="${shadow}${pulse}">
        <path d="M4 42 L12 4 L28 4 L36 42" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
        <rect x="10" y="4" width="20" height="4" rx="2" fill="${color}" stroke="white" stroke-width="2.5"/>
        <line x1="16" y1="8" x2="16" y2="28" stroke="${color}" stroke-width="3"/>
        <line x1="24" y1="8" x2="24" y2="28" stroke="${color}" stroke-width="3"/>
        <rect x="12" y="26" width="8" height="4" rx="2" fill="${color}" stroke="white" stroke-width="2.5"/>
        <rect x="20" y="26" width="8" height="4" rx="2" fill="${color}" stroke="white" stroke-width="2.5"/>
        <circle cx="16" cy="22" r="4" fill="white" opacity="0.5"/>
        <circle cx="24" cy="22" r="4" fill="white" opacity="0.5"/>
        <path d="M2 42 L38 42" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
      </svg>
    `,

    // Cross/hospital for medical
    medical: `
      <svg width="${size}" height="${size}" viewBox="0 0 40 44" style="${shadow}${pulse}">
        <rect x="4" y="4" width="32" height="38" rx="4" fill="${color}" stroke="white" stroke-width="3"/>
        <rect x="16" y="10" width="8" height="26" rx="1" fill="white"/>
        <rect x="10" y="18" width="20" height="8" rx="1" fill="white"/>
      </svg>
    `,

    // Warning/avoid symbol
    avoid: `
      <svg width="${size}" height="${size}" viewBox="0 0 40 44" style="${shadow}${pulse}">
        <circle cx="20" cy="22" r="18" fill="${color}" stroke="white" stroke-width="2"/>
        <line x1="8" y1="34" x2="32" y2="10" stroke="white" stroke-width="4" stroke-linecap="round"/>
        <circle cx="20" cy="22" r="10" fill="none" stroke="white" stroke-width="2" opacity="0.5"/>
      </svg>
    `,
  };

  return markers[category] || markers.attraction;
}

/**
 * Create SVG for dynamic AI-suggested pins
 *
 * Features:
 * - Gradient pin (coral → teal)
 * - Sparkle badge in top-right corner
 * - Pulse animation when selected
 */
export function createDynamicPinSVG(size: number, isSelected: boolean): string {
  const shadow = isSelected
    ? 'filter: drop-shadow(0 4px 12px rgba(249, 115, 22, 0.6));'
    : 'filter: drop-shadow(0 2px 8px rgba(249, 115, 22, 0.4));';
  const pulse = isSelected ? 'animation: pulse 1s ease-in-out infinite;' : '';

  return `
    <div style="position: relative; ${pulse}">
      <svg width="${size}" height="${size}" viewBox="0 0 40 44" style="${shadow}">
        <defs>
          <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#F97316"/>
            <stop offset="100%" style="stop-color:#14B8A6"/>
          </linearGradient>
        </defs>
        <path d="M20 2 C10 2 4 10 4 18 C4 30 20 42 20 42 C20 42 36 30 36 18 C36 10 30 2 20 2Z"
              fill="url(#aiGradient)" stroke="white" stroke-width="2"/>
        <circle cx="20" cy="18" r="6" fill="white" opacity="0.4"/>
        <circle cx="20" cy="18" r="3" fill="white" opacity="0.7"/>
      </svg>
      <!-- Sparkle badge -->
      <div style="
        position: absolute;
        top: -2px;
        right: -2px;
        width: 18px;
        height: 18px;
        background: linear-gradient(135deg, #FBBF24, #F59E0B);
        border-radius: 50%;
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(251, 191, 36, 0.5);
      ">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
          <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/>
        </svg>
      </div>
    </div>
  `;
}

/**
 * CSS keyframes for marker animations
 * Include this in your component's style tag
 */
export const MARKER_ANIMATION_STYLES = `
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  @keyframes homeBasePulse {
    0%, 100% {
      transform: scale(1);
      filter: drop-shadow(0 0 12px rgba(255, 69, 0, 0.6)) drop-shadow(0 6px 12px rgba(0,0,0,0.5)) drop-shadow(0 3px 6px rgba(0,0,0,0.3));
    }
    50% {
      transform: scale(1.15);
      filter: drop-shadow(0 0 24px rgba(255, 69, 0, 0.9)) drop-shadow(0 8px 16px rgba(0,0,0,0.6)) drop-shadow(0 4px 8px rgba(0,0,0,0.4));
    }
  }

  /* Accessibility: Respect reduced motion preferences */
  @media (prefers-reduced-motion: reduce) {
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
    }
    @keyframes homeBasePulse {
      0%, 100% { transform: scale(1); }
    }
  }

  /* High contrast mode support */
  @media (prefers-contrast: high) {
    svg {
      filter: contrast(1.2);
    }
  }
`;
