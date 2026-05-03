const CACHE_NAME = 'helpdesk-v43'

const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
]

// 🔹 INSTALAÇÃO
self.addEventListener('install', (event) => {
  self.skipWaiting()

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE)
    })
  )
})

// 🔹 ATIVAÇÃO
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// 🔹 FETCH (CORRIGIDO)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // 🚫 NÃO CACHEAR API (SUPABASE)
  if (url.pathname.includes('/rest/') || url.hostname.includes('supabase')) {
    return
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request)
        .then(response => {
          const clone = response.clone()

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone)
          })

          return response
        })
        .catch(() => {
          // 🔥 fallback offline
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html')
          }
        })
    })
  )
})
