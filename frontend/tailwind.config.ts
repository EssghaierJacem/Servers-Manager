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
        base: 'var(--bg-base)',
        panel: 'var(--bg-panel)',
      },
      border: {
        DEFAULT: 'var(--border)',
      },
      text: {
        primary: 'var(--text-primary)',
        muted: 'var(--text-muted)',
      },
      accent: 'var(--accent)',
      status: {
        healthy: 'var(--status-healthy)',
        warning: 'var(--status-warning)',
        critical: 'var(--status-critical)',
        unknown: 'var(--status-unknown)',
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
