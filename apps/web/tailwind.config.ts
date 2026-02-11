import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    screens: {
      xs: '475px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
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
        // Expert Breeder Brand Colors — Rustic Farmhouse
        breeder: {
          slate: '#7b8390',      // Primary slate blue-gray
          'slate-light': '#e8eaee',
          terracotta: '#946055', // Warm terracotta accent
          sage: '#9a9480',       // Sage green
          olive: '#4e4940',      // Dark olive
          linen: '#f5f0ea',      // Warm linen background
          cream: '#ece6de',      // Warm cream
          greige: '#d9d2c7',     // Border greige
          charcoal: '#3a3632',   // Text charcoal
          brown: '#8a7c6c',      // Warm brown
          orange: '#FF8A1E',     // kept for PublicWebsite backwards compat
          navy: '#0B2E4E',       // kept for PublicWebsite backwards compat
          white: '#FFFFFF',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['ui-serif', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'Menlo', 'monospace'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        elegant: ['Cormorant Garamond', 'Garamond', 'serif'],
        playful: ['Nunito', 'Quicksand', 'system-ui', 'sans-serif'],
        handwritten: ['Caveat', 'Kalam', 'cursive'],
        modern: ['Inter', 'Montserrat', 'system-ui', 'sans-serif'],
        classic: ['Times New Roman', 'serif'],
        luxury: ['Playfair Display', 'Didot', 'Bodoni MT', 'serif'],
      },
    },
  },
  plugins: [animate],
};

export default config;
