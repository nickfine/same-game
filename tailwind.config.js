/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#f4f4f5',
        success: '#00E054',
        fail: '#FF0055',
        text: '#18181b',
      },
    },
  },
  plugins: [],
};
