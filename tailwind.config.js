/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Sora", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      colors: {
        // Ported from the prototype's design tokens — see reference/kirana-store-app.jsx
        brand: {
          DEFAULT: "#4F46E5",
          light: "#818CF8",
        },
        ink: "#000000",
        muted: "#6B7280",
        border: "#E7E9F3",
      },
    },
  },
  plugins: [],
};
