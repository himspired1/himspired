import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

export default {
    darkMode: ["class"],
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
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			'gray-250': '#7E7E7E',
  			'gray-850': '#1E1E1E',
  			'white-100': '#FFF3E3',
  			'white-200': '#F4F4F4',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		spacing: {
  			'15': '60px',
  			'30': '120px',
  			'32.5': '130px',
  			'12.5': '50px',
  			'7.5': '30px',
  			'4.5': '18px'
  		},
  		borderRadius: {
  			'25': '100px',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		fontSize: {
  			'40': [
  				'160px',
  				'160px'
  			],
  			'50': [
  				'200px',
  				'200px'
  			],
  			'62.5': [
  				'250px',
  				'250px'
  			]
  		},
  		fontFamily: {
  			activo: [
  				'Archivo',
  				'sans-serif'
  			],
  			moon: [
  				'Moon',
  				'sans-serif'
  			],
  			kiona: [
  				'Kiona',
  				'sans-serif'
  			]
  		},
  		keyframes: {
  			fadeIn: {
  				'0%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			}
  		},
  		animation: {
  			fadeIn: 'fadeIn 1s ease-in-out forwards'
  		}
  	}
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
      require("tailwindcss-animate")
],
} satisfies Config;
