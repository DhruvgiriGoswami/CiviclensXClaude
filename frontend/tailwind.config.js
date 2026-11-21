import plugin from 'tailwindcss/plugin';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0B0D12',
          800: '#12151E',
          700: '#1B202E',
          600: '#262D3E',
          500: '#364057'
        },
        crimson: {
          500: '#E63946',
          600: '#D62837',
          700: '#B81D2B',
          800: '#8F1622',
          900: '#5E0E16'
        },
        // Role colours: selection is never red, success is green.
        role: {
          select: 'var(--role-select)',
          success: 'var(--role-success)'
        }
      },
      // Phase 0: 8px for controls, 16px for containers. md and 3xl are remapped so old classes fall in line.
      borderRadius: {
        md: '0.5rem',
        '3xl': '1rem'
      },
      boxShadow: {
        sm: 'var(--elev-1)',
        DEFAULT: 'var(--elev-1)',
        md: 'var(--elev-1)',
        lg: 'var(--elev-3)',
        xl: 'var(--elev-3)',
        '2xl': 'var(--elev-3)'
      },
      // Only Inter 400 to 700 is loaded.
      fontWeight: { extrabold: '700', black: '700' },
      transitionDuration: { DEFAULT: '200ms' },
      transitionTimingFunction: { DEFAULT: 'cubic-bezier(0.2, 0, 0, 1)' },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    },
  },
  plugins: [
    plugin(function({ addVariant }) {
      addVariant('light', 'html.light &');
    }),
  ],
}

