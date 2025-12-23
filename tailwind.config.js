/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#faf6f3',   // Cream white
          100: '#f5ebe3',  // Light cream
          200: '#e8d5c4',  // Latte
          300: '#d4b896',  // Caramel
          400: '#b8895c',  // Light mocha
          500: '#6F4E37',  // Main mocha brown ☕
          600: '#5c4130',  // Darker mocha
          700: '#4a3528',  // Espresso
          800: '#382820',  // Dark roast
          900: '#261b16',  // Extra dark
          950: '#140e0b',  // Almost black
        },
      },
    },
  },
  plugins: [],
}
