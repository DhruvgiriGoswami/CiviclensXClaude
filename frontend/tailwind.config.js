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
          500: 'rgb(var(--dark-500) / <alpha-value>)',
          600: 'rgb(var(--dark-600) / <alpha-value>)',
          700: 'rgb(var(--dark-700) / <alpha-value>)',
          800: 'rgb(var(--dark-800) / <alpha-value>)',
          900: 'rgb(var(--dark-900) / <alpha-value>)'
        },
        crimson: {
          50: 'rgb(var(--crimson-50) / <alpha-value>)',
          100: 'rgb(var(--crimson-100) / <alpha-value>)',
          200: 'rgb(var(--crimson-200) / <alpha-value>)',
          300: 'rgb(var(--crimson-300) / <alpha-value>)',
          400: 'rgb(var(--crimson-400) / <alpha-value>)',
          500: 'rgb(var(--crimson-500) / <alpha-value>)',
          600: 'rgb(var(--crimson-600) / <alpha-value>)',
          700: 'rgb(var(--crimson-700) / <alpha-value>)',
          800: 'rgb(var(--crimson-800) / <alpha-value>)',
          900: 'rgb(var(--crimson-900) / <alpha-value>)'
        },
        slate: {
          50: 'rgb(var(--slate-50) / <alpha-value>)',
          100: 'rgb(var(--slate-100) / <alpha-value>)',
          200: 'rgb(var(--slate-200) / <alpha-value>)',
          300: 'rgb(var(--slate-300) / <alpha-value>)',
          400: 'rgb(var(--slate-400) / <alpha-value>)',
          500: 'rgb(var(--slate-500) / <alpha-value>)',
          600: 'rgb(var(--slate-600) / <alpha-value>)',
          700: 'rgb(var(--slate-700) / <alpha-value>)',
          800: 'rgb(var(--slate-800) / <alpha-value>)',
          900: 'rgb(var(--slate-900) / <alpha-value>)',
          950: 'rgb(var(--slate-950) / <alpha-value>)'
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

