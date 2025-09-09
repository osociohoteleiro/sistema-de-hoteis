/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sophisticated blue palette - Rare and elegant tones
        'sapphire': {
          50: '#f0f4ff',
          100: '#e1eafe', 
          200: '#c9d8fd',
          300: '#a5bffb',
          400: '#7a9df7',
          500: '#547af1',
          600: '#3d5ce6',
          700: '#2d47d3',
          800: '#2639ab',
          900: '#263387',
          950: '#1a1f52',
        },
        // Steel Blue - Professional and rare
        'steel': {
          50: '#f1f5f9',
          100: '#e3eaf2',
          200: '#ccd9e6',
          300: '#aac0d4',
          400: '#82a1be',
          500: '#6485aa',
          600: '#506d93',
          700: '#425877',
          800: '#394c64',
          900: '#334054',
          950: '#202937',
        },
        // Prussian Blue - Deep and sophisticated
        'prussian': {
          50: '#f0f3ff',
          100: '#e4e8ff',
          200: '#cdd5ff',
          300: '#a6b5ff',
          400: '#7684ff',
          500: '#4349ff',
          600: '#2d2aff',
          700: '#1f1de3',
          800: '#1a1ab8',
          900: '#1b1b92',
          950: '#121057',
        },
        // Midnight Blue - Ultra rare and elegant
        'midnight': {
          50: '#f0f4ff',
          100: '#e1eafe',
          200: '#c7d8fd',
          300: '#9cbdfa',
          400: '#6995f5',
          500: '#426eef',
          600: '#2d4de3',
          700: '#2438d0',
          800: '#242fa8',
          900: '#242d86',
          950: '#191e51',
        },
        // Royal Blue - Sophisticated and premium
        'royal': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // Neutral grays for contrast
        'slate': {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      boxShadow: {
        'blue-subtle': '0 1px 3px 0 rgba(45, 71, 211, 0.12)',
        'blue-soft': '0 2px 8px 0 rgba(45, 71, 211, 0.08)',
        'blue-elegant': '0 4px 16px 0 rgba(45, 71, 211, 0.06)',
        'sapphire-glow': '0 0 20px rgba(84, 122, 241, 0.15)',
      },
      backgroundImage: {
        'gradient-blue-depth': 'linear-gradient(135deg, #1a1f52 0%, #191e51 25%, #172554 50%, #202937 100%)',
        'gradient-sapphire': 'linear-gradient(135deg, #547af1 0%, #3d5ce6 100%)',
        'gradient-steel': 'linear-gradient(135deg, #6485aa 0%, #506d93 100%)',
        'gradient-card-blue': 'linear-gradient(145deg, rgba(240, 244, 255, 0.95) 0%, rgba(225, 234, 254, 0.85) 100%)',
      },
      spacing: {
        '128': '32rem', // 512px - for two sidebars (256px each)
      }
    },
  },
  plugins: [],
}