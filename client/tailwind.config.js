export default {
  darkMode: 'class', // enable manual class switching for dark mode
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          sky: "#e0f2fe",
          indigo: "#e0e7ff",
          rose: "#ffe4e6",
          mint: "#dcfce7",
          yellow: "#fef9c3",
        },
      },
    },
  },
  plugins: [],
};