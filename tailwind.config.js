/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 0 35px rgba(204, 255, 0, 0.18)',
      },
    },
  },
  plugins: [],
};
