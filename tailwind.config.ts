import type { Config } from 'tailwindcss';

/** Lėkštė design tokens (Part 4.2 of the product spec). */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}', './app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F8F7F2',
        forest: '#174B35',
        leaf: '#31966A',
        sage: '#E9F1E9',
        ink: '#17241D',
        gold: '#F0B95B',
        muted: '#5E6B63',
        line: '#E3E2DA',
        card: '#FFFFFF',
        danger: '#B4432F',
      },
      fontFamily: {
        display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: { xl2: '20px', xl3: '28px' },
      boxShadow: {
        soft: '0 1px 2px rgba(23,36,29,.04), 0 8px 24px -12px rgba(23,36,29,.18)',
        lift: '0 30px 60px -30px rgba(23,75,53,.45)',
      },
      maxWidth: { site: '1200px' },
    },
  },
  plugins: [],
};
export default config;
