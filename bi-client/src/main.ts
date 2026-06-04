import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Registramos el Service Worker de descarga lo antes posible para que ya controle
// la pagina cuando el usuario presione "Export data" (ver SwDownloadService / sw.js).
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(err => {
    console.warn('[main] no se pudo registrar el SW de descarga:', err);
  });
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
