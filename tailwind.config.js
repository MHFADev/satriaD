/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brutal-orange': '#FF5C00',
        'brutal-blue': '#0057FF',
        'brutal-pink': '#FF00D6',
        'brutal-yellow': '#FFD600',
        'brutal-cream': '#FDFDFD',
        'brutal-bg': '#F4F4F4',
      },
      boxShadow: {
        'brutal': '4px 4px 0px 0px #000000',
        'brutal-lg': '8px 8px 0px 0px #000000',
        'brutal-xl': '12px 12px 0px 0px #000000',
      },
      borderWidth: {
        '3': '3px',
      },
      fontFamily: {
        'brutal': ['"Space Grotesk"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
