const CACHE_NAME = 'helpdesk-v1.4'

const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
]

// INSTALAÇÃO
self.addEventListener('install', (event) => {
  self.skipWaiting()

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE)
    })
  )
})

// ATIVAÇÃO (REMOVE CACHE ANTIGO)
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

// FETCH (CACHE + REDE)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        return response
      })
      .catch(() => caches.match(event.request))
  )
})
