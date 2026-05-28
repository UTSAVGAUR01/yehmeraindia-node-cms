/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { saffron: '#FF6600', parchment: '#F2F0E6', surface: '#1A1A1A' },
      fontFamily: { display: ['Georgia', 'serif'], body: ['Arial', 'sans-serif'] }
    }
  },
  plugins: []
};
