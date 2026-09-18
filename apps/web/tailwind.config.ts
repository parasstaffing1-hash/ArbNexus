import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}', '../../packages/ui/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#09090b',
        foreground: '#fafafa',
        cyber: {
          green: '#10b981',
          rose: '#f43f5e',
          cyan: '#06b6d4',
          violet: '#8b5cf6',
          amber: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
};

export default config;
