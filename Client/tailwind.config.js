/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,scss}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fcf8f8',
          100: '#f3e7e8',
          200: '#e8dde0',
          300: '#994d51',
          400: '#1b0e0e',
          500: '#e92932',
          600: '#d41e2a',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        accent: {
          400: '#9c27b0',
          500: '#e92932',
          600: '#d41e2a',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Noto Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}