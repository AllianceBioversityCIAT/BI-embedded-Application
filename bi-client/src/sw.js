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
 *
 * IMPORTANTE: el archivo se guarda en el Cache API, NO en un Map en memoria.
 * El navegador puede TERMINAR el worker entre el `message` y el `fetch`; un Map
 * en RAM se pierde -> el fetch arranca con estado vacio -> 404 -> el .xlsx sale
 * corrupto / "no disponible". El Cache API persiste a traves de reinicios del
 * worker, asi que el archivo sigue ahi cuando llega el clic de descarga.
 */
const CACHE = 'dl-files';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('message', e => {
  const d = e.data || {};

  // Firefox NO auto-controla un iframe cross-origin en cargas posteriores: solo
  // queda controlado si `clients.claim()` corre (y `activate` solo corre 1 vez).
  // Por eso el cliente pide "claim" en cada carga y aqui re-reclamamos el control;
  // sin esto, el `fetch` a /__dl__/ no se intercepta y la descarga cae a la red.
  if (d.type === 'claim') {
    e.waitUntil(self.clients.claim().then(() => e.source && e.source.postMessage({ claimed: true })));
    return;
  }

  const { id, buffer, filename, type } = d;
  if (!id) return;
  // waitUntil mantiene vivo el worker hasta que el archivo este en el cache,
  // y el ack `ready` se manda SOLO despues de guardarlo (asi el clic de descarga
  // nunca llega antes de que el archivo exista).
  e.waitUntil(
    (async () => {
      const resp = new Response(buffer, {
        headers: {
          'Content-Type': type || 'application/octet-stream',
          'Content-Length': String(buffer.byteLength || (buffer.length ?? 0)),
          'Content-Disposition':
            'attachment; filename="' + (filename || 'file').replace(/"/g, '') + '"'
        }
      });
      const cache = await caches.open(CACHE);
      await cache.put('/__dl__/' + encodeURIComponent(id), resp);
      // Limpieza acotada: dejamos solo los ultimos N archivos. NO se borra en el
      // `fetch` porque Chromium hace MAS DE UNA request al descargar (navegacion +
      // descarga); borrar en el 1er fetch deja la 2da en 404 -> "File wasn't
      // available on site". keys() viene en orden de insercion -> borramos los viejos.
      const keys = await cache.keys();
      for (let i = 0; i < keys.length - 5; i++) await cache.delete(keys[i]);
      if (e.source) e.source.postMessage({ ready: id });
    })()
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin === self.location.origin && url.pathname.startsWith('/__dl__/')) {
    // Siempre respondemos nosotros: si el archivo existe lo servimos, si no, un 404
    // limpio en vez de dejar caer la request a la red (que serviria el index.html
    // del SPA -> .xlsx corrupto).
    // IMPORTANTE: NO borramos aqui. Chromium hace varias requests por descarga; si
    // borraramos en el 1er fetch, la 2da daria 404. La limpieza se hace al guardar
    // un archivo nuevo (arriba). El cache se sirve clonado para no consumir el body.
    e.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const match = await cache.match(e.request.url);
        return match || new Response('Not found', { status: 404 });
      })()
    );
  }
});
