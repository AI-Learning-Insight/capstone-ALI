/* frontend/tailwind.config.js */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { lg: '1024px', xl: '1152px' },
    },
    extend: {
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          500: '#2563eb',
          600: '#1d4ed8',
        },
        success: { 500: '#16a34a' },
        warning: { 500: '#f59e0b' },
        danger:  { 500: '#ef4444' },
      },
      boxShadow: {
        card: '0 8px 30px rgba(2,6,23,0.06)',
        soft: '0 2px 10px rgba(2,6,23,0.05)',
      },
      borderRadius: {
        xl2: '1rem',
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
        ],
        display: [
          '"Plus Jakarta Sans"',
          'Inter',
          'ui-sans-serif',
          'system-ui',
        ],
      },
    },
  },
  plugins: [],
};
