// tailwind.config.js
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}", // Adjust the path according to your project structure
    ],
    theme: {
        extend: {
            keyframes: {
                marquee: {
                    '0%': { transform: 'translateX(-50%)' },
                    '100%': { transform: 'translateX(0)' },
                },
            },
            animation: {
                'marquee': 'marquee 20s linear infinite',
            },
        },
    },
    plugins: [],
}
