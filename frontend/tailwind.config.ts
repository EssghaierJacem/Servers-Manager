import type { Config } from 'tailwindcss';

/**
 * The default Tailwind theme (color palette, spacing scale, font stack) is
 * intentionally not extended but fully replaced - this app's palette is
 * functional-status-only, not a general-purpose design system.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      bg: {
        base: 'rgb(var(--bg-base) / <alpha-value>)',
        panel: 'rgb(var(--bg-panel) / <alpha-value>)',
      },
      border: {
        DEFAULT: 'rgb(var(--border) / <alpha-value>)',
      },
      text: {
        primary: 'rgb(var(--text-primary) / <alpha-value>)',
        muted: 'rgb(var(--text-muted) / <alpha-value>)',
      },
      accent: 'rgb(var(--accent) / <alpha-value>)',
      status: {
        healthy: 'rgb(var(--status-healthy) / <alpha-value>)',
        warning: 'rgb(var(--status-warning) / <alpha-value>)',
        critical: 'rgb(var(--status-critical) / <alpha-value>)',
        unknown: 'rgb(var(--status-unknown) / <alpha-value>)',
      },
    },
    fontFamily: {
      sans: ['"Instrument Sans Variable"', 'system-ui', 'sans-serif'],
      mono: ['"Spline Sans Mono"', 'ui-monospace', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1.1rem' }],
      sm: ['0.8125rem', { lineHeight: '1.25rem' }],
      base: ['0.9375rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.6rem' }],
      xl: ['1.375rem', { lineHeight: '1.8rem' }],
      '2xl': ['1.75rem', { lineHeight: '2.1rem' }],
    },
    spacing: {
      0: '0px',
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      5: '20px',
      6: '24px',
      8: '32px',
      10: '40px',
      12: '48px',
      16: '64px',
      20: '80px',
      24: '96px',
    },
    borderRadius: {
      none: '0px',
      sm: '3px',
      DEFAULT: '4px',
      md: '6px',
      lg: '10px',
      xl: '14px',
      full: '9999px',
    },
    extend: {
      keyframes: {
        holdfill: {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
