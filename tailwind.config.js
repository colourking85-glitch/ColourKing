/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      colors: {
        ck: {
          red: '#E8364E',
          'red-hover': '#D42E44',
          dark: '#0F0F0F',
          'dark-card': '#1A1A1A',
          'dark-border': '#2A2A2A',
          'dark-surface': '#141414',
          muted: 'rgba(255,255,255,0.52)',
          'muted-light': 'rgba(255,255,255,0.72)',
        },
      },
    },
  },
  plugins: [],
};
