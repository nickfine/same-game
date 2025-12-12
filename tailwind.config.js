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
        // Brand colors
        primary: '#6E0CFF',           // Electric violet
        'primary-foreground': '#FFFFFF',
        secondary: '#FF3B6E',         // Hot coral
        accent: '#00FFBD',            // Emerald correct
        destructive: '#FF3B6E',
        
        // Backgrounds
        background: '#0F0F1A',        // Deep space
        surface: '#1A0F33',           // Surface violet
        muted: '#2A1A4D',
        
        // Text
        text: '#FFFFFF',
        'text-muted': 'rgba(255, 255, 255, 0.6)',
        
        // Legacy (for compatibility)
        success: '#00FFBD',
        fail: '#FF3B6E',
      },
      borderRadius: {
        '4xl': '32px',
      },
      fontSize: {
        '4xl': ['36px', { lineHeight: '44px' }],
        '5xl': ['48px', { lineHeight: '56px' }],
      },
    },
  },
  plugins: [],
};
