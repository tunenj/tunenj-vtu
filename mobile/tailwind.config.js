/** @type {import('tailwindcss').Config} */
/* eslint-disable @typescript-eslint/no-require-imports */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Primary brand — matches the top stop of your gradient
        brand: '#4A3AE8',
        // Dark tone used for the deepest gradient stop & text
        'brand-night': '#1A1266',
        // Very light tint used for arrow button backgrounds
        'brand-air': '#E8E6FB',
        // Muted tint used for inactive dots
        'brand-mist': '#DDD9F7',
      },
    },
  },
  plugins: [],
};