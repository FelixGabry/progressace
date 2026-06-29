import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef3f8",
          100: "#d9e6f0",
          200: "#b3cde1",
          300: "#8aadca",
          400: "#5c86a8",
          500: "#3d6889",
          600: "#1e4560",
          700: "#183850",
          800: "#132d40",
          900: "#0e2230",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
