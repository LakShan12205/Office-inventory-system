import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f7f5",
          100: "#dce9e2",
          500: "#1f6f5f",
          700: "#175648",
          900: "#123c34"
        },
        warning: "#c97a1b",
        danger: "#d14f77",
        success: "#2c8f5f"
      },
      fontFamily: {
        sans: [
          "Segoe UI",
          "ui-sans-serif",
          "system-ui"
        ]
      },
      boxShadow: {
        panel: "0 18px 50px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;

