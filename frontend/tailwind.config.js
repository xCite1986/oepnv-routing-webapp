/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wien: {
          red: '#e2001a',       // Wiener Linien Rot
          blue: '#004b9b',      // ÖBB Blau
          dark: '#1e293b',
          surface: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
          accent: '#0284c7',
        },
        transit: {
          u1: '#e2001a',        // Rot
          u2: '#8b5cf6',        // Lila
          u3: '#ea580c',        // Orange
          u4: '#16a34a',        // Grün
          u6: '#92400e',        // Braun
          sBahn: '#0284c7',     // Hellblau
          tram: '#dc2626',      // Tram Rot
          bus: '#0d9488',       // Bus Petrol
          walk: '#64748b',      // Grau
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
