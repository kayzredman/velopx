import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    '/Users/kwekku/Desktop/Builds/SparePartsHub/velopx/web/app/**/*.{js,ts,jsx,tsx,mdx}',
    '/Users/kwekku/Desktop/Builds/SparePartsHub/velopx/web/components/**/*.{js,ts,jsx,tsx,mdx}',
    '/Users/kwekku/Desktop/Builds/SparePartsHub/velopx/web/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070C14',
          900: '#0C1526',
          800: '#111E34',
          700: '#1E2E48',
          600: '#2D4264',
        },
        orange: {
          500: '#F5A623',
          400: '#F7BC5A',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
