import { Injectable } from '@angular/core';
import * as FileSaver from 'file-saver';

/**
 * Descarga de archivos a prueba de la CSP `frame-src` del contenedor (cgiar.org).
 *
 * Estrategia: un Service Worker (`/sw.js`) sirve el archivo desde una URL https real
 * (`/__dl__/<id>`) con `Content-Disposition: attachment`, en vez de un `blob:`.
 * Asi la descarga NO pasa por `frame-src` y funciona en Firefox embebido.
 *
 * Si el SW no esta disponible (navegador sin soporte, contexto inseguro, etc.) cae
 * al metodo clasico `FileSaver.saveAs`, que ya funciona en Chrome/Edge.
 */
@Injectable({
  providedIn: 'root'
})
export class SwDownloadService {
  private registered = false;

  /** Registra el SW lo antes posible (idempotente). */
  register(): void {
    if (this.registered) return;
    this.registered = true;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(err => {
      console.warn('[SwDownload] no se pudo registrar el SW, se usara FileSaver:', err);
    });
  }

  /** Descarga el buffer como archivo. Usa el SW si puede; si no, FileSaver. */
  async download(buffer: ArrayBuffer, filename: string, type: string): Promise<void> {
    this.register();
    const controller = await this.getController();

    if (controller) {
      try {
        await this.downloadViaServiceWorker(controller, buffer, filename, type);
        return;
      } catch (err) {
        console.warn('[SwDownload] fallo la descarga via SW, fallback a FileSaver:', err);
      }
    }

    // Fallback clasico (Chrome/Edge, o contextos sin SW)
    FileSaver.saveAs(new Blob([buffer], { type }), filename);
  }

  /** Espera a que el SW controle la pagina (con timeout). null si no lo logra. */
  private getController(timeoutMs = 4000): Promise<ServiceWorker | null> {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return Promise.resolve(null);
    }
    if (navigator.serviceWorker.controller) {
      return Promise.resolve(navigator.serviceWorker.controller);
    }
    return new Promise<ServiceWorker | null>(resolve => {
      const finish = (ctrl: ServiceWorker | null) => {
        clearTimeout(timer);
        navigator.serviceWorker.removeEventListener('controllerchange', onChange);
        resolve(ctrl);
      };
      const onChange = () => finish(navigator.serviceWorker.controller);
      const timer = setTimeout(() => finish(navigator.serviceWorker.controller), timeoutMs);
      navigator.serviceWorker.addEventListener('controllerchange', onChange);
      // por si ya quedo listo entre el check y el listener
      navigator.serviceWorker.ready
        .then(() => {
          if (navigator.serviceWorker.controller) finish(navigator.serviceWorker.controller);
        })
        .catch(() => {
          /* noop: el timeout resuelve */
        });
    });
  }

  private downloadViaServiceWorker(
    controller: ServiceWorker,
    buffer: ArrayBuffer,
    filename: string,
    type: string
  ): Promise<void> {
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'dl-' + Date.now() + '-' + Math.floor(Math.random() * 1e9);

    return new Promise<void>((resolve, reject) => {
      const onMessage = (event: MessageEvent) => {
        if (event.data && event.data.ready === id) {
          navigator.serviceWorker.removeEventListener('message', onMessage);
          clearTimeout(timer);
          // El SW ya tiene el archivo listo: disparamos la descarga real
          const a = document.createElement('a');
          a.href = '/__dl__/' + encodeURIComponent(id);
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          resolve();
        }
      };
      const timer = setTimeout(() => {
        navigator.serviceWorker.removeEventListener('message', onMessage);
        reject(new Error('SW ack timeout'));
      }, 4000);

      navigator.serviceWorker.addEventListener('message', onMessage);
      // NO transferimos el buffer (sin [buffer]) para que el fallback pueda reusarlo.
      controller.postMessage({ id, buffer, filename, type });
    });
  }
}
