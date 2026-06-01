/**
 * Service Worker de descarga.
 *
 * Por que existe: cuando el front esta embebido en www.cgiar.org, la CSP
 * `frame-src` del host NO incluye `blob:`. En Firefox, FileSaver.saveAs intenta
 * materializar el `blob:` como un frame -> bloqueado -> la descarga del Excel falla
 * (en Chrome/Edge si funciona). Validado con Playwright + Firefox.
 *
 * Solucion: en vez de un `blob:`, servimos el archivo desde una URL https real
 * del propio origin (`/__dl__/<id>`) con `Content-Disposition: attachment`.
 * Eso NO pasa por `frame-src` -> descarga en todos los navegadores y contenedores.
 *
 * El front (bi.prms.cgiar.org) y el host (www.cgiar.org) son el mismo site
 * (cgiar.org), asi que el SW no sufre el particionado de storage de terceros.
 */
const FILES = new Map();

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('message', e => {
  const { id, buffer, filename, type } = e.data || {};
  if (!id) return;
  FILES.set(id, { buffer, filename, type });
  if (e.source) e.source.postMessage({ ready: id });
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.pathname.startsWith('/__dl__/')) {
    const id = decodeURIComponent(url.pathname.slice('/__dl__/'.length));
    const f = FILES.get(id);
    if (f) {
      FILES.delete(id);
      e.respondWith(
        new Response(f.buffer, {
          headers: {
            'Content-Type': f.type || 'application/octet-stream',
            'Content-Disposition':
              'attachment; filename="' + (f.filename || 'file').replace(/"/g, '') + '"'
          }
        })
      );
    }
  }
});
