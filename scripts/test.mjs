// scripts/test.mjs
//
// Lanza el runner de Node con la lista explícita de archivos en vez de un
// patrón glob: el soporte de globs en `node --test` llegó en Node 22 y se
// comporta distinto en Windows, y la librería declara soporte desde Node 18.

import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const directory = join('dist-test', 'test');
const files = readdirSync(directory)
  .filter((name) => name.endsWith('.test.js'))
  .map((name) => join(directory, name));

if (files.length === 0) {
  console.error(`No se encontró ninguna prueba en ${directory}. ¿Falta compilar?`);
  process.exit(1);
}

const extra = process.argv.slice(2);
const result = spawnSync(process.execPath, ['--test', ...extra, ...files], {
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
