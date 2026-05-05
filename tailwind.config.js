/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172026",
        muted: "#64748b",
        primary: {
          50: "#f4f0ff",
          100: "#ebe4ff",
          500: "#6b46e8",
          600: "#5b35d5",
          700: "#4f2dbb"
        },
        success: "#28b870",
        warning: "#f47a39",
        danger: "#e04d4d",
        surface: "#ffffff",
        wash: "#f7f7fa"
      },
      boxShadow: {
        soft: "0 12px 30px rgba(17, 24, 39, 0.06)",
        card: "0 4px 18px rgba(17, 24, 39, 0.05)"
      }
    }
  },
  plugins: []
};
