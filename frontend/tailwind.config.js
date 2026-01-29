/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Keposhka Official Palette - Draag Regime
        keposhka: {
          red: '#89181A',
          'red-dark': '#6B1315',
          'red-light': '#A51E21',
          black: '#000000',
          white: '#FFFFFF',
          // Propaganda accent colors
          cream: '#F5F0E6',
          steel: '#2A2A2A',
          concrete: '#1A1A1A',
          rust: '#4A1A1B',
        },
      },
      fontFamily: {
        // Constructivist display font
        'display': ['"Bebas Neue"', 'sans-serif'],
        // Industrial heading font
        'heading': ['"Oswald"', 'sans-serif'],
        // Monospace for code/data
        'mono': ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        // Soviet propaganda diagonal stripes
        'diagonal-stripes': 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(137, 24, 26, 0.1) 2px, rgba(137, 24, 26, 0.1) 4px)',
        // Industrial noise texture
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
      },
      animation: {
        'scan': 'scan 8s linear infinite',
        'flicker': 'flicker 0.15s infinite',
        'stamp': 'stamp 0.3s ease-out forwards',
      },
      keyframes: {
        scan: {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '0% 100%' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.95' },
        },
        stamp: {
          '0%': { transform: 'scale(1.5) rotate(-15deg)', opacity: '0' },
          '70%': { transform: 'scale(0.95) rotate(-12deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(-12deg)', opacity: '1' },
        },
      },
      boxShadow: {
        'brutal': '4px 4px 0px 0px #89181A',
        'brutal-sm': '2px 2px 0px 0px #89181A',
        'brutal-black': '4px 4px 0px 0px #000000',
        'inner-glow': 'inset 0 0 20px rgba(137, 24, 26, 0.3)',
      },
    },
  },
  plugins: [],
}
