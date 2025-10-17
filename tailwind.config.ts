import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // Safelist critical gradient classes
    'bg-gradient-to-br',
    'bg-gradient-to-r',
    'from-slate-50',
    'via-white',
    'to-slate-50',
    'from-slate-950',
    'via-slate-900',
    'to-slate-950',
    'from-accent',
    'to-accent/80',
    'from-accent-hover',
    'to-accent',
    // Shadow classes
    'shadow-xl',
    'shadow-2xl',
    'shadow-black/5',
    'shadow-black/10',
    'shadow-black/20',
    'shadow-black/30',
    'shadow-accent/20',
    'shadow-accent/25',
    'shadow-accent/30',
    'shadow-accent/40',
    // Border radius
    'rounded-2xl',
    'rounded-xl',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        accent: 'var(--accent-color, #3b82f6)',
        'accent-hover': 'var(--accent-hover, #2563eb)',
      },
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'sans-serif'],
      },
      borderWidth: {
        DEFAULT: 'var(--border-width, 1px)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
export default config

