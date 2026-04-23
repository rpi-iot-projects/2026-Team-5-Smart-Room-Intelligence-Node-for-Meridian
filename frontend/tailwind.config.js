/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        surface: '#FAFAF8',
        accent: '#6366F1',
        'accent-light': 'rgba(123, 140, 255, 0.2)',
      },
      animation: {
        'pulse-border': 'pulse-border 1s ease-in-out',
      },
      keyframes: {
        'pulse-border': {
          '0%': { boxShadow: '0 0 0 0 rgba(99, 102, 241, 0.5)' },
          '50%': { boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.3)' },
          '100%': { boxShadow: '0 0 0 0 rgba(99, 102, 241, 0)' },
        },
      },
    },
  },
  plugins: [],
}
