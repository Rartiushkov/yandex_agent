/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        yandex: {
          red: '#FC3F1D',
          yellow: '#FFCC00',
          dark: '#1A1A1A',
        },
      },
    },
  },
  plugins: [],
}
