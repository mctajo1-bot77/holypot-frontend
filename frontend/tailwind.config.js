/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#2962FF", // blue FundingPips buttons
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#f1f3f6",
          foreground: "#000000",
        },
        destructive: {
          DEFAULT: "#ff006e",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f1f3f6",
          foreground: "#6b7280",
        },
        accent: {
          DEFAULT: "#e2e8f0",
          foreground: "#000000",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#000000",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#000000",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
}