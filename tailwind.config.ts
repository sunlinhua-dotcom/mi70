import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                gold: {
                    light: '#F3E5AB',
                    DEFAULT: '#D4AF37',
                    dark: '#AA8C2C',
                    glow: 'rgba(212, 175, 55, 0.5)',
                },
                dark: {
                    bg: '#050505',
                    card: '#111111',
                    border: '#222222',
                }
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gold-gradient': 'linear-gradient(135deg, #F3E5AB 0%, #D4AF37 50%, #AA8C2C 100%)',
                'glass-dark': 'linear-gradient(180deg, rgba(20,20,20,0.7) 0%, rgba(10,10,10,0.9) 100%)',
            },
            animation: {
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'shine': 'shine 2s linear infinite',
            },
            keyframes: {
                shine: {
                    '0%': { backgroundPosition: '200% center' },
                    '100%': { backgroundPosition: '-200% center' },
                }
            }
        },
    },
    plugins: [],
};
export default config;
