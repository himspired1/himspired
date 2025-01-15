import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

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
        "gray-250": "#7E7E7E",
        "gray-850": "#1E1E1E",
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
      fontFamily: {
        activo: ["Archivo", "sans-serif"],
        moon: ["Moon", "sans-serif"],
        kiona:['Kiona',"sans-serif"]
      },
    },
  },
  plugins: [
    plugin(function ({ addBase }) {
      addBase({
        "@font-face": {
          fontFamily: "Archivo",
          fontWeight: "300",
          fontStyle: "light",
          src: 'url("/fonts/Archivo-Light.ttf") format("truetype")',
        },
      });
      addBase({
        "@font-face": {
          fontFamily: "Archivo",
          fontWeight: "400",
          fontStyle: "normal",
          src: 'url("/fonts/Archivo-Regular.ttf") format("truetype")',
        },
      });
      addBase({
        "@font-face": {
          fontFamily: "Archivo",
          fontWeight: "600",
          fontStyle: "semi-bold",
          src: 'url("/fonts/Archivo-SemiBold.ttf") format("truetype")',
        },
      });
      addBase({
        "@font-face": {
          fontFamily: "Archivo",
          fontWeight: "700",
          fontStyle: "bold",
          src: 'url("/fonts/Archivo-Bold.ttf") format("truetype")',
        },
      });
      addBase({
        "@font-face": {
          fontFamily: "Moon",
          fontWeight: "400",
          fontStyle: "normal",
          src: 'url("/fonts/Moon-Walk.otf") format("truetype")',
        },
      });
      addBase({
        "@font-face": {
          fontFamily: "Moon",
          fontWeight: "700",
          fontStyle: "bold",
          src: 'url("/fonts/Moon-Walk.ttf") format("truetype")',
        },
      });
      addBase({
        "@font-face": {
          fontFamily: "Kiona",
          fontWeight: "400",
          fontStyle: "normal",
          src: 'url("/fonts/Kiona-Regular.woff") format("truetype")',
        },
      });
    }),
  ],
} satisfies Config;
