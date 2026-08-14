/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nyamleng: {
          50: '#fff5f2',
          100: '#ffe8e1',
          200: '#ffd0c4',
          300: '#ffab99',
          400: '#ff775a',
          500: '#e64a19', // Primary Brand Terracotta Persimmon
          600: '#ac2d00', // Dark Accent
          700: '#872100',
          800: '#5b1700',
          900: '#3b0900',
        },
        charcoal: {
          DEFAULT: '#2D2D2D',
          light: '#424242',
          dark: '#1B1C1C',
        },
        parchment: {
          DEFAULT: '#FBF9F9',
          soft: '#F5F5F1',
          card: '#FFFFFF',
          border: '#E8E5E1',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Lexend', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft-card': '0 4px 20px -2px rgba(45, 45, 45, 0.06)',
        'floating-cart': '0 10px 30px -5px rgba(230, 74, 25, 0.3)',
      }
    },
  },
  plugins: [],
};
