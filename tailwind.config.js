/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        lavender: {
          50: '#f8f7ff',
          100: '#f0edff',
          200: '#e4defb',
          300: '#d4caf7',
          400: '#b8a4ef',
          500: '#9b7fe0',
          600: '#7c5bc7',
          700: '#6745a8',
          800: '#523884',
          900: '#43306b',
        },
        babyblue: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc6fb',
          400: '#36a9f6',
          500: '#0e8de3',
          600: '#016fc0',
          700: '#02599e',
          800: '#064b81',
          900: '#0a3f6c',
        },
        mint: {
          50: '#f0fdf9',
          100: '#ccfbef',
          200: '#9af5dd',
          300: '#5eebc8',
          400: '#29d6ad',
          500: '#0fbd91',
          600: '#079a76',
          700: '#087a60',
          800: '#0b604c',
          900: '#0c4f40',
        },
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'soft': '0 2px 12px 0 rgba(155, 127, 224, 0.08)',
        'soft-lg': '0 8px 30px 0 rgba(155, 127, 224, 0.12)',
        'card': '0 2px 16px -4px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
};
