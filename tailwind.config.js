/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#F5F5DC',
        background: {
          light: '#F7F7F5',
          dark: '#1a1a1a',
        },
        card: {
          light: '#ffffff',
          dark: '#242424',
        },
        border: {
          light: '#e5e7eb',
          dark: '#3a3a3a',
        },
        text: {
          primary: {
            light: '#37352f',
            dark: '#f5f5dc',
          },
          secondary: {
            light: '#787774',
            dark: '#c4c4b0',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
