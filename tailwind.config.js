/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Bebas Neue', 'Impact', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'xp-pop': 'xpPop 0.4s ease-out',
        'pulse-once': 'pulseOnce 0.6s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        xpPop: {
          '0%': { transform: 'scale(0.5) translateY(0)', opacity: '0' },
          '60%': { transform: 'scale(1.3) translateY(-12px)', opacity: '1' },
          '100%': { transform: 'scale(1) translateY(-20px)', opacity: '0' },
        },
        pulseOnce: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
