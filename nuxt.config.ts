export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  watch: {
    exclude: ['.output', 'node_modules'],
  },

  app: {
    baseURL: '/',
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Track petrol and diesel price changes in Mauritius from 2002 to present. Data sourced from STC.' },
        { name: 'keywords', content: 'mauritius, fuel, petrol, diesel, prices, STC, price history' },
        { name: 'author', content: 'Sandeep Ramgolam' },
        { property: 'og:title', content: 'Mauritius Fuel Price Index' },
        { property: 'og:description', content: 'Comprehensive analysis of fuel price fluctuations in Mauritius from 2002 to present.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: 'https://fuel.ramgolam.com/og-image.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Mauritius Fuel Price Index' },
        { name: 'twitter:description', content: 'Track petrol and diesel price changes in Mauritius since 2002.' },
        { name: 'twitter:image', content: 'https://fuel.ramgolam.com/og-image.png' },
      ],
      script: [
        { src: 'https://cloud.umami.is/script.js', defer: true, 'data-website-id': '1008a54e-9dad-4e60-852a-1cdf95eeede7' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap' },
      ],
    },
  },
})
