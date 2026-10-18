/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Exact Brand Colors from Specification
        brand: {
          primary: "#18217E",
          "primary-hover": "#121860",
          navy: "#09104D",
          secondary: "#424989",
        },
        // Exact Text Colors
        text: {
          primary: "#070724",
          secondary: "#393A50",
          muted: "#6B7280",
        },
        // Exact Background & Surfaces
        app: {
          background: "#E5EBEE",
          surface: "#FFFFFF",
          "surface-muted": "#F4F7F9",
        },
        border: {
          default: "#D0D9DE",
          focus: "#18217E",
        },
        // Exact Semantic Status Colors
        status: {
          active: "#18217E",
          delayed: "#EA341F",
          critical: "#8C2527",
          maintenance: "#8A9995",
          delivered: "#107C41",
          loading: "#424989",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(7, 7, 36, 0.07), 0 1px 2px -1px rgba(7, 7, 36, 0.07)',
        'card-hover': '0 4px 6px -1px rgba(7, 7, 36, 0.1), 0 2px 4px -2px rgba(7, 7, 36, 0.08)',
        'modal': '0 20px 25px -5px rgba(9, 16, 77, 0.2), 0 8px 10px -6px rgba(9, 16, 77, 0.15)',
      }
    },
  },
  plugins: [],
}
