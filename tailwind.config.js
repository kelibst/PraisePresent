/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}', './index.html'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // PraisePresent semantic surfaces/text/status (see globals.css).
        pp: {
          'surface-1': 'hsl(var(--pp-surface-1))',
          'surface-2': 'hsl(var(--pp-surface-2))',
          'surface-alt': 'hsl(var(--pp-surface-alt))',
          'surface-live': 'hsl(var(--pp-surface-live))',
          'border-soft': 'hsl(var(--pp-border-soft))',
          'border-strong': 'hsl(var(--pp-border-strong))',
          accent: 'hsl(var(--pp-accent))',
          'accent-deep': 'hsl(var(--pp-accent-deep))',
          'accent-light': 'hsl(var(--pp-accent-light))',
          'accent-hover': 'hsl(var(--pp-accent-hover))',
          success: 'hsl(var(--pp-success))',
          warn: 'hsl(var(--pp-warn))',
          error: 'hsl(var(--pp-error))',
          'text-primary': 'hsl(var(--pp-text-primary))',
          'text-body': 'hsl(var(--pp-text-body))',
          'text-label': 'hsl(var(--pp-text-label))',
          'text-muted': 'hsl(var(--pp-text-muted))',
          'text-dim': 'hsl(var(--pp-text-dim))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
        // Soft breathing pulse — e.g. a live / recording indicator dot.
        'pp-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.45', transform: 'scale(0.92)' },
        },
        // Audio-equalizer bar bounce — used for the "listening" AI indicator.
        'pp-eq': {
          '0%, 100%': { transform: 'scaleY(0.35)' },
          '50%': { transform: 'scaleY(1)' },
        },
        // Horizontal shimmer sweep — skeleton/loading affordance.
        'pp-sweep': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pp-pulse': 'pp-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pp-eq': 'pp-eq 0.9s ease-in-out infinite',
        'pp-sweep': 'pp-sweep 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
