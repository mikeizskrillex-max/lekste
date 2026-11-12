/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        field: 'rgb(var(--field) / <alpha-value>)',
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        onaccent: 'rgb(var(--on-accent) / <alpha-value>)',
        deep: 'rgb(var(--deep) / <alpha-value>)',
        soft: 'rgb(var(--soft) / <alpha-value>)',
        warm: 'rgb(var(--warm) / <alpha-value>)',
        peach: 'rgb(var(--peach) / <alpha-value>)',
        rose: 'rgb(var(--rose) / <alpha-value>)',
        leaf: 'rgb(var(--leaf) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Unbounded', 'Onest', 'system-ui', 'sans-serif'],
        body: ['Onest', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: { card: '18px', btn: '16px' },
    },
  },
  plugins: [],
};
