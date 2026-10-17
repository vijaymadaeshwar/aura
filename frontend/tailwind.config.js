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
        sre: {
          bg: "#0B1120",
          card: "#111827",
          surface: "#172033",
          border: "#1E293B",
          hover: "#1F293D",
          healthy: "#10B981",
          warning: "#F59E0B",
          high: "#F97316",
          critical: "#EF4444",
          info: "#3B82F6",
          purple: "#8B5CF6",
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
      }
    },
  },
  plugins: [],
}
