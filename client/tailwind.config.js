/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5",
        secondary: "#10B981",
        danger: "#EF4444",
        warning: "#F59E0B",
        background: "#F9FAFB",
        card: "#FFFFFF",
        textPrimary: "#111827",
        textSecondary: "#6B7280",
      },
    },
  },
  plugins: [],
};
