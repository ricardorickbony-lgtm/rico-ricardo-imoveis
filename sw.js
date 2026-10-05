/**
 * sw.js - Service Worker Oficial do NEXO CRM
 * Permite funcionamento offline, instalação nativa PWA no celular e carregamento instantâneo.
 */

const CACHE_NAME = 'nexo-crm-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './admin.html',
  './index.html',
  './css/style.css',
  './js/db.js',
  './js/admin.js',
  './js/main.js',
  './js/supabase-config.js',
  './manifest.json',
  './favicon.ico',
  './favicon.png',
  './img/nexo-icone.png',
  './img/nexo-icon-192.png',
  './img/nexo-icon-512.png',
  './img/nexo-icon-maskable.png',
  './img/apple-touch-icon.png',
  './img/nexo-logo-horizontal.png',
  './img/nexo-logo-vertical.png'
];

// Instalação do Service Worker e pré-cache dos recursos vitais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[NEXO CRM / Service Worker] Pré-carregando arquivos para acesso rápido...');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[NEXO CRM / SW] Alguns arquivos não puderam ser pré-cacheados:', err);
      });
    })
  );
  self.skipWaiting();
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[NEXO CRM / SW] Removendo cache obsoleto:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia de Rede com Fallback para Cache (Stale-While-Revalidate / Network First)
self.addEventListener('fetch', (event) => {
  // Ignora requisições de extensões ou externas de analytics/CDN que não suportem cache
  if (!event.request.url.startsWith(self.location.origin) && !event.request.url.includes('jsdelivr.net') && !event.request.url.includes('tailwindcss.com')) {
    return;
  }

  // Não intercepta chamadas diretas da API Supabase (sempre online)
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Se a resposta for válida, atualiza o cache em background
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {});
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Se estiver offline ou sem internet, responde com o cache local
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('./admin.html');
          }
        });
      })
  );
});
