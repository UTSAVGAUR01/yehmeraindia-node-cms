/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        saffron: '#F97316',
        rosewood: '#9F1239',
        marigold: '#FBBF24',
        royal: '#1E1B4B',
        olive: '#365314',
        parchment: '#FFF7ED',
        surface: '#1C1917',
        borderline: '#7C2D12'
      },
      fontFamily: {
        display: ['DM Serif Display', 'Georgia', 'serif'],
        body: ['DM Sans', 'Arial', 'sans-serif']
      },
      boxShadow: {
        festive: '0 24px 70px rgba(159, 18, 57, 0.22)'
      }
    }
  },
  plugins: []
};
