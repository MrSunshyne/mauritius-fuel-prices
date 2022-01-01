const colors = require('tailwindcss/colors')

module.exports = {
  mode: 'jit',
  purge: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  safelist: ['prose', 'prose-sm', 'm-auto', 'text-left', 'container'],
  darkMode: 'class',
  variants: {
    extend: {
      backgroundColor: ['odd'],
      textAlign: ['last'],
    },
  },
  theme: {
    extend: {
      colors: {
        ...colors,
      },

      screens: {
        '2xl': '1536px',
      },
      maxWidth: {
        '8xl': '100rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/line-clamp'),
    require('@tailwindcss/typography'),


  ],
}
