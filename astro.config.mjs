// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import satteriDropcap from './src/lib/satteri-dropcap.mjs';
import satteriColumns from './src/lib/satteri-columns.mjs';

export default defineConfig({
  // Served at the root of its own subdomain, so no `base` — the absolute links
  // the pages already use (/arrival, /gala) resolve as written.
  site: 'https://hs.scribhneoir.com',
  markdown: {
    processor: satteri({ hastPlugins: [satteriDropcap, satteriColumns] }),
  },
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Manufacturing Consent',
      cssVariable: '--font-manufacturing-consent',
      weights: [400],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Impact', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Eczar',
      cssVariable: '--font-eczar',
      weights: ['400 800'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Georgia', 'serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Crimson Pro',
      cssVariable: '--font-crimson-pro',
      weights: ['300 700'],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['Georgia', 'serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Archivo',
      cssVariable: '--font-archivo',
      weights: ['400 600'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Helvetica Neue', 'sans-serif'],
    },
  ],
});
