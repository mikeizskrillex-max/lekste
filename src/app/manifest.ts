import type { MetadataRoute } from 'next';

/** Installable web app: "Add to home screen" opens Lėkštė full-screen like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Lėkštė — Valgyk geriau. Išleisk mažiau.',
    short_name: 'Lėkštė',
    description: 'Savaitės meniu pagal tikslą ir biudžetą + pigiausias krepšelis jūsų parduotuvėje.',
    start_url: '/app',
    scope: '/',
    display: 'standalone',
    background_color: '#F8F7F2',
    theme_color: '#174B35',
    lang: 'lt',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Meniu', url: '/app/menu' },
      { name: 'Pirkiniai', url: '/app/shopping' },
    ],
  };
}
