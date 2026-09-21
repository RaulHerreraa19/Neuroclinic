/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta tomada de image.png (mockup de marca): navy para texto/encabezados,
        // lavanda para el fondo de página. Los acentos indigo/emerald/orange de Tailwind
        // ya coinciden casi exactamente con el resto del mockup, así que no se redefinen.
        navy: {
          50: '#EEF0F8',
          100: '#DCE0F2',
          400: '#4B5488',
          700: '#232A5C',
          800: '#1B2247',
          900: '#1B2A4A',
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
