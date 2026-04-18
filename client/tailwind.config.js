export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: '#0a0a0b',
          card: '#111113',
          elevated: '#1a1a1d',
          border: 'rgba(255,255,255,0.08)',
        },
        neon: {
          DEFAULT: '#8B5CF6',
          light: '#A78BFA',
          dim: '#6D28D9',
        },
        orange: {
          accent: '#FF9500',
        },
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        'orb-drift': 'orb-drift 8s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
        typewrite: 'typewrite 2s steps(64,end) forwards',
        'pulse-ring': 'pulse-ring 1.5s ease-out infinite',
        'count-up': 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) both',
        'confetti-fall': 'confettiFall 1s ease-in forwards',
        'stepper-in': 'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) both',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'orb-drift': {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(30px,-20px) scale(1.05)' },
          '66%': { transform: 'translate(-20px,30px) scale(0.95)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        typewrite: {
          from: { width: '0' },
          to: { width: '100%' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        confettiFall: {
          '0%': { transform: 'translateY(-20px) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
      },
      boxShadow: {
        purple: '0 0 30px rgba(139,92,246,0.25)',
        'purple-lg': '0 20px 40px rgba(0,0,0,0.4), 0 0 40px rgba(139,92,246,0.2)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(139,92,246,0.15)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
