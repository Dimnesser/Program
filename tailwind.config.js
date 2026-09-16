/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--nova-${name}) / <alpha-value>)`;

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        card: token('card'),
        elevated: token('elevated'),
        line: token('border'),
        'line-strong': token('border-strong'),
        ink: token('text'),
        muted: token('muted'),
        faint: token('faint'),
        accent: {
          DEFAULT: token('accent'),
          soft: token('accent-soft'),
          fg: token('accent-fg'),
        },
        success: token('success'),
        warning: token('warning'),
        danger: token('danger'),
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'JetBrains Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        xl: '14px',
        '2xl': '18px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        soft: '0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px -12px rgb(0 0 0 / 0.16)',
        lift: '0 2px 4px rgb(0 0 0 / 0.06), 0 18px 40px -20px rgb(0 0 0 / 0.35)',
        glow: '0 0 0 1px rgb(var(--nova-accent) / 0.25), 0 0 32px -8px rgb(var(--nova-accent) / 0.45)',
        pop: '0 24px 70px -24px rgb(0 0 0 / 0.55)',
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      screens: {
        xs: '420px',
        '3xl': '1800px',
      },
      transitionTimingFunction: {
        nova: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'translateY(-6px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgb(var(--nova-accent) / 0.35)' },
          '70%': { boxShadow: '0 0 0 12px rgb(var(--nova-accent) / 0)' },
          '100%': { boxShadow: '0 0 0 0 rgb(var(--nova-accent) / 0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out both',
        'rise-in': 'rise-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in': 'scale-in 0.18s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.6s infinite',
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
      },
    },
  },
  plugins: [],
};
