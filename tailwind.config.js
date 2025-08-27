/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors based on design system
        cream: {
          50: '#FEFCFB',
          100: '#FEF9F3', // Primary cream white
          200: '#FDF4E9',
          300: '#FBEADB',
          400: '#F8DECB',
          500: '#F5D2BA',
          600: '#E5B694',
          700: '#D09E6E',
          800: '#B8854A',
          900: '#9A6E2E',
        },
        yellow: {
          50: '#FFFEF7',
          100: '#FEF7CD', // Primary light yellow
          200: '#FDF0A6',
          300: '#FCE97F',
          400: '#FBE158',
          500: '#FADB32',
          600: '#E4C228',
          700: '#CDA71F',
          800: '#B68C16',
          900: '#9F700E',
        },
        blue: {
          50: '#F0F9FF',
          100: '#E0F2FE', // Primary light blue
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
        },
        // Pet-specific colors
        paw: {
          light: '#FEF7CD',
          dark: '#B68C16',
        },
        fur: {
          brown: '#8B4513',
          black: '#2C1810',
          white: '#FEFCFB',
          gray: '#9CA3AF',
          golden: '#DAA520',
          orange: '#FF8C00',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'pet': '1rem', // Consistent rounded corners for pet cards
        'card': '0.75rem',
        'button': '0.5rem',
      },
      boxShadow: {
        'pet-card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'pet-card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'warm': '0 4px 14px 0 rgba(251, 233, 123, 0.15)',
        'blue-glow': '0 4px 14px 0 rgba(224, 242, 254, 0.25)',
      },
      animation: {
        'bounce-soft': 'bounce 1.5s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'paw-wiggle': 'pawWiggle 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pawWiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
      },
      spacing: {
        'pet-card': '16rem', // Consistent pet card width
        'pet-card-height': '20rem', // Consistent pet card height
        'safe-area': '1rem', // Safe area spacing
      },
      zIndex: {
        'modal': '50',
        'toast': '60',
        'dropdown': '40',
      }
    },
  },
  plugins: [],
}