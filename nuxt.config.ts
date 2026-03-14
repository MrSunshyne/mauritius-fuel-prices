export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  app: {
    baseURL: '/mauritius-fuel-prices/',
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Track petrol and diesel price changes in Mauritius from 2002 to present. Data sourced from STC.' },
        { name: 'keywords', content: 'mauritius, fuel, petrol, diesel, prices, STC, price history' },
        { name: 'author', content: 'Sandeep Ramgolam' },
        { property: 'og:title', content: 'Mauritius Fuel Prices' },
        { property: 'og:description', content: 'Track petrol and diesel price changes in Mauritius from 2002 to present.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: '/mauritius-fuel-prices/og-image.png' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/mauritius-fuel-prices/favicon.svg' },
      ],
    },
  },
})
