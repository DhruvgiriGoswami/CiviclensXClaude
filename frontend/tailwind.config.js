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
          glow: 'rgba(230, 57, 70, 0.4)'
        },
        emerald: {
          500: '#10B981',
           glow: 'rgba(16, 185, 129, 0.3)'
        },
        amber: {
          500: '#F59E0B',
          glow: 'rgba(245, 158, 11, 0.3)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
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

