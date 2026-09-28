/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./product.html",
    "./assets/js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        'luxury-bg': '#fbfaf8',
        'luxury-card': '#f6f4ef',
        'luxury-ink': '#141716',
        'luxury-gold': '#c5a059',
        'luxury-gold-dark': '#a07d3b',
        'luxury-gold-light': '#ebd9ab'
      }
    }
  },
  plugins: []
}
