import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#08111f',
        panel: '#101a2c',
        brand: '#5eead4',
        accent: '#60a5fa',
        danger: '#f97316',
      },
      boxShadow: {
        glow: '0 12px 40px rgba(96, 165, 250, 0.15)',
      },
    },
  },
  plugins: [],
} satisfies Config;
