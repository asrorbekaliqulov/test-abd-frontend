/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'bg-primary': 'var(--bg-primary)',
                'bg-secondary': 'var(--bg-secondary)',
                'bg-tertiary': 'var(--bg-tertiary)',
                'text-primary': 'var(--text-primary)',
                'text-secondary': 'var(--text-secondary)',
                'text-tertiary': 'var(--text-tertiary)',
                'border-primary': 'var(--border-primary)',
                'border-secondary': 'var(--border-secondary)',
                'accent-primary': 'var(--accent-primary)',
                'accent-secondary': 'var(--accent-secondary)',
                'success': 'var(--success)',
                'warning': 'var(--warning)',
                'error': 'var(--error)',
                'info': 'var(--info)',
            },
            boxShadow: {
                'theme-sm': 'var(--shadow-sm)',
                'theme-md': 'var(--shadow-md)',
                'theme-lg': 'var(--shadow-lg)',
                'theme-xl': 'var(--shadow-xl)',
            },
            transitionTimingFunction: {
                'theme-fast': 'var(--transition-fast)',
                'theme-normal': 'var(--transition-normal)',
                'theme-slow': 'var(--transition-slow)',
            },
            borderRadius: {
                'sm': 'var(--radius-sm)',
                'md': 'var(--radius-md)',
                'lg': 'var(--radius-lg)',
                'xl': 'var(--radius-xl)',
            },
            keyframes: {
                fadeUp: {
                    '0%': { opacity: 0, transform: 'translateY(20px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' },
                },
            },
            animation: {
                fadeUp: 'fadeUp 0.5s ease-out forwards',
            },
        },
    },
    plugins: [require("@tailwindcss/line-clamp")],
};
