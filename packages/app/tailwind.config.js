/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#6366F1',  // indigo-500
          light: '#818CF8',    // indigo-400
          dark: '#4F46E5',     // indigo-600
          50: '#EEF2FF',       // indigo-50
          100: '#E0E7FF',      // indigo-100
        }
      },
      borderRadius: {
        DEFAULT: '8px',
      },
    },
  },
  plugins: [],
};
