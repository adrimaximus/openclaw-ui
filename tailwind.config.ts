import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:    '#00899c',
        'primary-container': '#cef0f5',
        'on-primary': '#ffffff',
        'on-primary-container': '#002026',
        secondary:  '#4a6367',
        'secondary-container': '#cce8ed',
        'on-secondary-container': '#051f23',
        surface:    '#f7f9fb',
        'surface-container-lowest': '#ffffff',
        'surface-container-low':    '#f2f4f6',
        'surface-container':        '#eceef0',
        'surface-container-high':   '#e6e8ea',
        'surface-container-highest':'#e0e3e5',
        'on-surface':         '#191c1e',
        'on-surface-variant': '#3f484a',
        outline:         '#6f797a',
        'outline-variant':'#bfc8ca',
        error:           '#ba1a1a',
        'error-container': '#ffdad6',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        headline: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
}

export default config
