// src/app/app.config.ts

import {
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  type ApplicationConfig,
} from '@angular/core';

/**
 * La aplicación es zoneless: no se instala `zone.js` y la detección de cambios
 * la disparan las señales. Encaja bien con la librería, que es toda funciones
 * puras: el `computed` del informe se recalcula sólo cuando cambia una entrada.
 */
export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideZonelessChangeDetection()],
};
