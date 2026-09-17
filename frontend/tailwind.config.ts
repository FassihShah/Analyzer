import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        moss: "var(--accent)",
        coral: "var(--danger)",
        paper: "var(--canvas)",
        line: "var(--line)"
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px"
      }
    }
  },
  plugins: []
};

export default config;
