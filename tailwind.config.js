/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f3ff',
          100: '#dce3ff',
          200: '#b6c5ff',
          300: '#8aa3ff',
          400: '#5c7cff',
          500: '#1a3a6b',
          600: '#152e55',
          700: '#102240',
          800: '#0b172b',
          900: '#060d17',
          950: '#030810',
        },
        gold: {
          50: '#fffdf0',
          100: '#fff9d4',
          200: '#fff2a8',
          300: '#ffe97c',
          400: '#ffd700',
          500: '#e6c200',
          600: '#ccac00',
          700: '#b39600',
          800: '#997f00',
          900: '#806900',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

