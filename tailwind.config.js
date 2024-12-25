module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1B329A',
        'primary-dark': '#14266D',
        secondary: '#59B8F0',
        'secondary-dark': '#3A8BBF', // Add a dark version of secondary
        accent: '#E2B13B',
        'accent-dark': '#B38A2E', // Add a darker version of accent
        neutral: '#F9FAFB',
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ['Poppins', 'Arial', 'Helvetica', 'sans-serif'], // Set Poppins as default
      },
    },
  },
  plugins: [],
}
