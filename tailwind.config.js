/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // GSG Energies brand — dark purple primary
        primary: {
          50:  '#eeeaf8',
          100: '#d3caef',
          200: '#b5a7e5',
          300: '#9783da',
          400: '#7f66d2',
          500: '#674ac9',
          600: '#5840b8',
          700: '#473299',
          800: '#3d2e8a',   // main brand purple
          900: '#2d1f70',
          950: '#1a0f4a',
        },
        // GSG Energies brand — red accent
        accent: {
          50:  '#fef0f2',
          100: '#fdd8dd',
          200: '#fbb0ba',
          300: '#f77d8d',
          400: '#f24d62',
          500: '#e8243b',
          600: '#cc1234',   // main brand red
          700: '#b01030',
          800: '#8f0e28',
          900: '#720c21',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
}
