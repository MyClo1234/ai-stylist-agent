/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#cffafe', // Cyan 100
                    glow: 'rgba(207, 250, 254, 0.5)',
                },
                accent: '#a78bfa', // Violet 400
                'bg-dark': '#09090b',
                'bg-card': '#18181b',
                'bg-card-hover': '#27272a',
                'text-main': '#fafafa',
                'text-muted': '#a1a1aa',
                'border-light': 'rgba(255, 255, 255, 0.1)',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
