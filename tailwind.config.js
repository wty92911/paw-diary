/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Shadcn/ui color variables
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        
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
        // Save feedback animations
        'save-flash': 'saveFlash 1.5s ease-out',
        'success-glow': 'successGlow 2s ease-out',
        'error-shake': 'errorShake 0.5s ease-in-out',
        'highlight-fade': 'highlightFade 2s ease-out',
        // iOS-style animations
        'ios-slide-up': 'iosSlideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        'ios-fade-in': 'iosFadeIn 0.3s ease-out',
        'ios-scale-in': 'iosScaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
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
        // Save feedback keyframes
        saveFlash: {
          '0%': { backgroundColor: 'rgba(59, 130, 246, 0.1)', transform: 'scale(1)' },
          '50%': { backgroundColor: 'rgba(59, 130, 246, 0.2)', transform: 'scale(1.02)' },
          '100%': { backgroundColor: 'transparent', transform: 'scale(1)' },
        },
        successGlow: {
          '0%': { 
            backgroundColor: 'rgba(34, 197, 94, 0.1)', 
            boxShadow: '0 0 0 rgba(34, 197, 94, 0.4)',
            transform: 'scale(1)' 
          },
          '30%': { 
            backgroundColor: 'rgba(34, 197, 94, 0.15)', 
            boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)',
            transform: 'scale(1.01)' 
          },
          '100%': { 
            backgroundColor: 'transparent', 
            boxShadow: '0 0 0 rgba(34, 197, 94, 0)',
            transform: 'scale(1)' 
          },
        },
        // iOS-style keyframes
        iosSlideUp: {
          '0%': { 
            transform: 'translateY(20px)',
            opacity: '0'
          },
          '100%': { 
            transform: 'translateY(0)',
            opacity: '1'
          },
        },
        iosFadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        iosScaleIn: {
          '0%': { 
            transform: 'scale(0.9)',
            opacity: '0'
          },
          '100%': { 
            transform: 'scale(1)',
            opacity: '1'
          },
        },
        errorShake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' },
        },
        highlightFade: {
          '0%': { 
            backgroundColor: 'rgba(249, 250, 251, 1)',
            borderColor: 'rgba(59, 130, 246, 0.5)' 
          },
          '50%': { 
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
            borderColor: 'rgba(59, 130, 246, 0.3)' 
          },
          '100%': { 
            backgroundColor: 'transparent',
            borderColor: 'transparent' 
          },
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