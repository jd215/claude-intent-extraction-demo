// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-21',
  devtools: { enabled: false },

  modules: ['@nuxtjs/tailwindcss'],

  css: ['~/assets/css/main.css'],

  // Dark mode is the default; class lives on <html>. Tailwind is configured
  // with darkMode: 'class' (see tailwind.config.ts).
  app: {
    head: {
      htmlAttrs: { lang: 'en', class: 'dark' },
      title: 'Claude Intent Extraction Demo',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Turn natural-language search queries into structured JSON filters using the Claude API and tool_use.',
        },
        { name: 'color-scheme', content: 'dark light' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap',
        },
      ],
      script: [
        {
          // Apply the persisted theme before paint to avoid a flash of the
          // wrong color scheme. Defaults to dark.
          innerHTML:
            "(function(){try{var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){}})()",
          tagPosition: 'head',
        },
      ],
    },
  },

  // The Anthropic key and Vercel KV credentials are read from process.env
  // server-side only (see server/api/extract.post.ts). They never reach the
  // client bundle.
  typescript: {
    typeCheck: false, // run explicitly via `npm run typecheck`
    strict: true,
  },
})
