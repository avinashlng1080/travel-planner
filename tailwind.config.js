/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Extended breakpoints with xs for small phones and 3xl for ultra-wide screens
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
        // Height-based breakpoints for landscape/portrait
        'tall': { 'raw': '(min-height: 800px)' },
        'short': { 'raw': '(max-height: 600px)' },
        // Aspect ratio breakpoints
        'landscape': { 'raw': '(orientation: landscape)' },
        'portrait': { 'raw': '(orientation: portrait)' },
      },

      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },

      colors: {
        // Tropical Sunset palette - warm, inviting, Malaysian vibes
        'sunset': {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',  // Primary coral
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        'ocean': {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',  // Secondary teal
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        'sand': {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',  // Accent gold
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },

      // Responsive font sizes that scale with viewport
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        // Fluid font sizes using clamp
        'fluid-xs': ['clamp(0.625rem, 0.5rem + 0.5vw, 0.75rem)', { lineHeight: '1.5' }],
        'fluid-sm': ['clamp(0.75rem, 0.625rem + 0.5vw, 0.875rem)', { lineHeight: '1.5' }],
        'fluid-base': ['clamp(0.875rem, 0.75rem + 0.5vw, 1rem)', { lineHeight: '1.6' }],
        'fluid-lg': ['clamp(1rem, 0.875rem + 0.5vw, 1.125rem)', { lineHeight: '1.5' }],
        'fluid-xl': ['clamp(1.125rem, 1rem + 0.5vw, 1.25rem)', { lineHeight: '1.4' }],
        'fluid-2xl': ['clamp(1.25rem, 1rem + 1vw, 1.5rem)', { lineHeight: '1.3' }],
        'fluid-3xl': ['clamp(1.5rem, 1.25rem + 1vw, 1.875rem)', { lineHeight: '1.2' }],
        'fluid-4xl': ['clamp(1.875rem, 1.5rem + 1.5vw, 2.25rem)', { lineHeight: '1.2' }],
      },

      // Responsive spacing scale
      spacing: {
        'safe-top': 'env(safe-area-inset-top, 0)',
        'safe-bottom': 'env(safe-area-inset-bottom, 0)',
        'safe-left': 'env(safe-area-inset-left, 0)',
        'safe-right': 'env(safe-area-inset-right, 0)',
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },

      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin-slow': 'spin 2s linear infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },

      boxShadow: {
        'glow-sunset': '0 0 20px rgba(249, 115, 22, 0.3)',
        'glow-ocean': '0 0 20px rgba(13, 148, 136, 0.3)',
        'glow-sand': '0 0 20px rgba(251, 191, 36, 0.3)',
        'mobile': '0 -2px 10px rgba(0, 0, 0, 0.1)',
        'floating': '0 4px 20px rgba(0, 0, 0, 0.15)',
      },

      zIndex: {
        '40': '40',
        '50': '50',
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },

      // Border radius for consistent rounded corners
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },

      // Transition durations
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },

      // Max width utilities
      maxWidth: {
        'screen-3xl': '1920px',
      },

      // Min height utilities
      minHeight: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-top, 0) - env(safe-area-inset-bottom, 0))',
        'screen-safe-mobile': 'calc(100dvh - env(safe-area-inset-top, 0) - env(safe-area-inset-bottom, 0))',
      },

      // Height utilities
      height: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-top, 0) - env(safe-area-inset-bottom, 0))',
        'screen-safe-mobile': 'calc(100dvh - env(safe-area-inset-top, 0) - env(safe-area-inset-bottom, 0))',
      },
    },
  },

  plugins: [
    // Plugin for safe area and responsive utilities
    function({ addUtilities, addComponents }) {
      // Safe area utilities for notched devices
      addUtilities({
        '.safe-area-inset': {
          paddingTop: 'env(safe-area-inset-top, 0)',
          paddingBottom: 'env(safe-area-inset-bottom, 0)',
          paddingLeft: 'env(safe-area-inset-left, 0)',
          paddingRight: 'env(safe-area-inset-right, 0)',
        },
        '.safe-area-inset-x': {
          paddingLeft: 'env(safe-area-inset-left, 0)',
          paddingRight: 'env(safe-area-inset-right, 0)',
        },
        '.safe-area-inset-y': {
          paddingTop: 'env(safe-area-inset-top, 0)',
          paddingBottom: 'env(safe-area-inset-bottom, 0)',
        },
        '.safe-area-inset-top': {
          paddingTop: 'env(safe-area-inset-top, 0)',
        },
        '.safe-area-inset-bottom': {
          paddingBottom: 'env(safe-area-inset-bottom, 0)',
        },
        '.safe-area-inset-left': {
          paddingLeft: 'env(safe-area-inset-left, 0)',
        },
        '.safe-area-inset-right': {
          paddingRight: 'env(safe-area-inset-right, 0)',
        },
      });

      // Touch action utilities
      addUtilities({
        '.touch-pan-x': {
          touchAction: 'pan-x',
        },
        '.touch-pan-y': {
          touchAction: 'pan-y',
        },
        '.touch-pan-left': {
          touchAction: 'pan-left',
        },
        '.touch-pan-right': {
          touchAction: 'pan-right',
        },
        '.touch-pan-up': {
          touchAction: 'pan-up',
        },
        '.touch-pan-down': {
          touchAction: 'pan-down',
        },
        '.touch-pinch-zoom': {
          touchAction: 'pinch-zoom',
        },
        '.touch-manipulation': {
          touchAction: 'manipulation',
        },
      });

      // Touch target utilities
      addUtilities({
        '.touch-target': {
          minWidth: '44px',
          minHeight: '44px',
        },
        '.touch-target-comfortable': {
          minWidth: '48px',
          minHeight: '48px',
        },
        '.touch-target-large': {
          minWidth: '56px',
          minHeight: '56px',
        },
      });

      // Hide scrollbar utilities
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.scrollbar-default': {
          '-ms-overflow-style': 'auto',
          'scrollbar-width': 'auto',
          '&::-webkit-scrollbar': {
            display: 'block',
          },
        },
      });

      // Line clamp utilities
      addUtilities({
        '.line-clamp-1': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '1',
        },
        '.line-clamp-2': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '2',
        },
        '.line-clamp-3': {
          overflow: 'hidden',
          display: '-webkit-box',
          '-webkit-box-orient': 'vertical',
          '-webkit-line-clamp': '3',
        },
        '.line-clamp-none': {
          overflow: 'visible',
          display: 'block',
          '-webkit-box-orient': 'horizontal',
          '-webkit-line-clamp': 'unset',
        },
      });

      // Responsive container utilities
      addComponents({
        '.container-responsive': {
          width: '100%',
          maxWidth: '100%',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: '1rem',
          paddingRight: '1rem',
          '@screen sm': {
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
          },
          '@screen md': {
            paddingLeft: '2rem',
            paddingRight: '2rem',
          },
          '@screen lg': {
            maxWidth: '1024px',
            paddingLeft: '2rem',
            paddingRight: '2rem',
          },
          '@screen xl': {
            maxWidth: '1280px',
          },
          '@screen 2xl': {
            maxWidth: '1536px',
          },
        },
        '.container-full': {
          width: '100%',
          maxWidth: '100%',
          paddingLeft: '1rem',
          paddingRight: '1rem',
          '@screen sm': {
            paddingLeft: '1.5rem',
            paddingRight: '1.5rem',
          },
          '@screen md': {
            paddingLeft: '2rem',
            paddingRight: '2rem',
          },
        },
      });
    },
  ],
};
