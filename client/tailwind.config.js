/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#07090e',
          900: '#0b0f19',
          850: '#111726',
          800: '#161f33',
          700: '#1e2942',
          600: '#2d3c5e',
        },
        cf: {
          newbie: '#808080',
          pupil: '#008000',
          specialist: '#03a89e',
          expert: '#0000ff',
          cm: '#aa00aa',
          master: '#ff8c00',
          gm: '#ff0000',
        },
        brand: {
          primary: '#6366f1',
          accent: '#38bdf8',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-primary': '0 0 20px -3px rgba(99, 102, 241, 0.4)',
        'glow-cyan': '0 0 20px -3px rgba(56, 189, 248, 0.4)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
}
