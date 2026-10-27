/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        vault: {
          bg: '#070b14',
          surface: '#0d1527',
          card: '#121d36',
          border: 'rgba(255, 255, 255, 0.08)',
          red: '#e11d2e',
          'red-glow': 'rgba(225, 29, 46, 0.35)',
          blue: '#2f6bff',
          'blue-glow': 'rgba(47, 107, 255, 0.35)',
          text: '#ffffff',
          muted: '#8b9bb4',
        },
      },
      fontFamily: {
        heading: ['Orbitron', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
