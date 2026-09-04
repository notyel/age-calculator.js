// src/ageCalculator.ts
//
// Ruta heredada de la versión 1. El paquete se publicaba como
// `dist/node/ageCalculator.js`, así que quien haya fijado esa ruta profunda en
// un `require` sigue funcionando. El punto de entrada actual es `src/index.ts`.

export * from './index.js';
export { calculateAge as default } from './index.js';
