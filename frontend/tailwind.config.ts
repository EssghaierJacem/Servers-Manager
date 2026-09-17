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
      white: '#ffffff',
      black: '#000000',
      bg: {
        base: 'rgb(var(--bg-base) / <alpha-value>)',
        panel: 'rgb(var(--bg-panel) / <alpha-value>)',
        elevated: 'rgb(var(--bg-elevated) / <alpha-value>)',
      },
      border: {
        DEFAULT: 'rgb(var(--border) / <alpha-value>)',
        strong: 'rgb(var(--border-strong) / <alpha-value>)',
      },
      text: {
        primary: 'rgb(var(--text-primary) / <alpha-value>)',
        secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
        muted: 'rgb(var(--text-muted) / <alpha-value>)',
      },
      accent: {
        DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
        strong: 'rgb(var(--accent-strong) / <alpha-value>)',
      },
      status: {
        healthy: 'rgb(var(--status-healthy) / <alpha-value>)',
        warning: 'rgb(var(--status-warning) / <alpha-value>)',
        critical: 'rgb(var(--status-critical) / <alpha-value>)',
        unknown: 'rgb(var(--status-unknown) / <alpha-value>)',
      },
    },
    fontFamily: {
      sans: ['"Inter Variable"', 'system-ui', 'sans-serif'],
      mono: ['"JetBrains Mono Variable"', 'ui-monospace', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1.1rem' }],
      sm: ['0.8125rem', { lineHeight: '1.25rem' }],
      base: ['0.9375rem', { lineHeight: '1.5rem' }],
      lg: ['1.0625rem', { lineHeight: '1.6rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
      '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.01em' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
    },
    // Standard Tailwind spacing scale (key * 4px) - restated explicitly since the
    // rest of the default theme is replaced, not extended, but kept numerically
    // conventional so `w-64` etc. behave the way every Tailwind class does.
    spacing: {
      0: '0px',
      px: '1px',
      0.5: '2px',
      1: '4px',
      1.5: '6px',
      2: '8px',
      2.5: '10px',
      3: '12px',
      3.5: '14px',
      4: '16px',
      5: '20px',
      6: '24px',
      7: '28px',
      8: '32px',
      9: '36px',
      10: '40px',
      11: '44px',
      12: '48px',
      14: '56px',
      16: '64px',
      20: '80px',
      24: '96px',
      28: '112px',
      32: '128px',
      36: '144px',
      40: '160px',
      44: '176px',
      48: '192px',
      52: '208px',
      56: '224px',
      60: '240px',
      64: '256px',
      72: '288px',
      80: '320px',
      96: '384px',
    },
    borderRadius: {
      none: '0px',
      sm: '4px',
      DEFAULT: '6px',
      md: '8px',
      lg: '12px',
      xl: '16px',
      '2xl': '20px',
      full: '9999px',
    },
    extend: {
      keyframes: {
        holdfill: {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
      },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / 0.3), 0 8px 24px -12px rgb(0 0 0 / 0.5)',
        popover: '0 4px 12px rgb(0 0 0 / 0.4), 0 16px 40px -16px rgb(0 0 0 / 0.6)',
      },
    },
  },
  plugins: [],
} satisfies Config;
