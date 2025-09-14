/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#3b82f6", // Tailwind blue
          dark: "#1e40af",
        }
      },
      boxShadow: {
        glow: "0 0 15px rgba(59, 130, 246, 0.5)"
      }
    },
  },
  plugins: [],
};
