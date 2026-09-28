import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  // El panel permite scripts externos del sitio; CSP bloquea scripts inline.
  vite: { build: { assetsInlineLimit: 0 } },
  security: {
    checkOrigin: false,
    allowedDomains: [
      { hostname: 'localhost' },
      { hostname: '127.0.0.1' },
      { protocol: 'https', hostname: 'deco-site-kappa.vercel.app' },
      { protocol: 'https', hostname: '**.vercel.app' }
    ]
  },
  adapter: vercel()
});
