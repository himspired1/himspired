import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "#68191E",
        "gray-850":"#1E1E1E",
        "white-100": "#FFF3E3",
        "white-200": "#F4F4F4",
      },
      spacing: {
        32.5: "130px",
        30: "120px",
        15: "60px",
        12.5: "50px",
        7.5: "30px",
      },
      borderRadius: {
        25: "100px",
      },
    },
  },
  plugins: [],
} satisfies Config;
