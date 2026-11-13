/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['"Jost"', 'system-ui', 'sans-serif'],
      },
      colors: {
        plum: { 50: '#fbf1f6', 100: '#f6e0ea', 200: '#eec0d3', 300: '#df93b3', 400: '#c9608c', 500: '#a93a6a', 600: '#8a2653', 700: '#6b1544', 800: '#561138', 900: '#430d2c', 950: '#2a0719' },
        rose: { 50: '#fff1f5', 100: '#ffe3ec', 200: '#ffc7d9', 300: '#ff9ebc', 400: '#f9698f', 500: '#ec4876', 600: '#d62d62' },
        blush: '#FFF4F6',
        gold: { 300: '#EBD28A', 400: '#DDB95A', 500: '#C9A24B', 600: '#A8812F' },
      },
      boxShadow: {
        soft: '0 10px 40px -12px rgba(107,21,68,.18)',
        lift: '0 22px 60px -18px rgba(107,21,68,.35)',
        glow: '0 0 0 4px rgba(236,72,118,.18)',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0) rotate(0)' }, '50%': { transform: 'translateY(-14px) rotate(4deg)' } },
        flutter: { '0%,100%': { transform: 'scaleX(1)' }, '50%': { transform: 'scaleX(.55)' } },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        pop: { '0%': { transform: 'scale(1)' }, '40%': { transform: 'scale(1.35)' }, '100%': { transform: 'scale(1)' } },
        sheen: { from: { transform: 'translateX(-120%) skewX(-20deg)' }, to: { transform: 'translateX(220%) skewX(-20deg)' } },
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
        flutter: 'flutter .9s ease-in-out infinite',
        marquee: 'marquee 38s linear infinite',
        shimmer: 'shimmer 1.6s linear infinite',
        pop: 'pop .45s ease',
      },
    },
  },
  plugins: [],
}
