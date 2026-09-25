/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta propia de la clínica: navy como columna estructural (nav, sidebars,
        // footer, hero), coral reservado a CTAs de conversión pública, lavanda como
        // acento de marca solo en la landing. indigo/emerald/slate/amber/red de Tailwind
        // se usan como acentos secundarios y semántica de estado.
        navy: {
          50: '#EEF0F8',
          100: '#DCE0F2',
          200: '#C7CCE8',
          300: '#A8AFDA',
          400: '#4B5488',
          500: '#3B4570',
          600: '#2E3568',
          700: '#232A5C',
          800: '#1B2247',
          900: '#1B2A4A',
          950: '#10142C',
        },
        coral: {
          400: '#FF9270',
          500: '#FF7A50',
          600: '#F2603A',
        },
        lavender: {
          50: '#F4F5FB',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(14px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: 0, transform: 'scale(.94)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        slideInRight: {
          '0%': { opacity: 0, transform: 'translateX(16px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        pop: {
          '0%': { opacity: 0, transform: 'scale(.5)' },
          '70%': { opacity: 1, transform: 'scale(1.08)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn .4s ease-out both',
        'fade-in-up': 'fadeInUp .5s ease-out both',
        'scale-in': 'scaleIn .2s ease-out both',
        'slide-in-right': 'slideInRight .3s ease-out both',
        pop: 'pop .45s cubic-bezier(.34,1.56,.64,1) both',
      },
    },
  },
  plugins: [],
};
