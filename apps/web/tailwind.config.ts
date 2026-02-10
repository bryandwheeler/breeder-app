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
        // Expert Breeder Brand Colors
        breeder: {
          rose: '#c45a6e',
          'rose-light': '#f9e4e8',
          ivory: '#faf8f5',
          taupe: '#f5f0eb',
          orange: '#FF8A1E', // kept for PublicWebsite backwards compat
          navy: '#0B2E4E', // kept for PublicWebsite backwards compat
          blue: '#4DB3E6',
          'sky-blue': '#A9DBF4',
          'powder-blue': '#D8F0FB',
          white: '#FFFFFF',
          gray: '#E6EAF0',
          charcoal: '#1F2933',
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
        display: ['Georgia', 'serif'],
        elegant: ['Garamond', 'serif'],
        playful: ['Comic Sans MS', 'cursive'],
        handwritten: ['Brush Script MT', 'cursive'],
        modern: ['Inter', 'Helvetica Neue', 'sans-serif'],
        classic: ['Times New Roman', 'serif'],
        luxury: ['Didot', 'Bodoni MT', 'serif'],
      },
    },
  },
  plugins: [animate],
};

export default config;
