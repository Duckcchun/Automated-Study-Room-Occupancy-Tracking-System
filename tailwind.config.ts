import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./phase3_dashboard_page.tsx"],
  theme: {
    extend: {
      boxShadow: {
        glow: "0 0 40px rgba(34, 211, 238, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
