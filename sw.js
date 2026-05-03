const CACHE_NAME = 'helpdesk-v50'

const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
]

// 🔹 INSTALAÇÃO (CORRIGIDO - NÃO QUEBRA SE FALTAR ARQUIVO)
self.addEventListener('install', (event) => {
  self.skipWaiting()

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const promises = FILES_TO_CACHE.map(url =>
        fetch(url)
          .then(response => {
            if (response.ok) {
              return cache.put(url, response)
            }
          })
          .catch(() => {}) // ignora erro (ex: 404)
      )

      return Promise.all(promises)
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

  // 🚫 NÃO CACHEAR API (SUPABASE + CLOUDFLARE)
  if (
    url.pathname.includes('/rest/') ||
    url.hostname.includes('supabase') ||
    url.pathname.includes('/cdn-cgi/')
  ) {
    return
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request)
        .then(response => {

          if (!response || response.status !== 200) return response

          const clone = response.clone()

          if (url.origin === location.origin) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clone)
            })
          }

          return response
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html')
          }
        })
    })
  )
})
