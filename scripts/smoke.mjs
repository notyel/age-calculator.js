// scripts/smoke.mjs
//
// Comprueba el paquete ya construido, no el código fuente: que `require` y
// `import` resuelvan a los archivos correctos, que las declaraciones de tipos
// estén donde dice `package.json`, y que la ruta profunda de la versión 1
// siga respondiendo. Son los fallos que las pruebas unitarias no ven porque
// importan de `src/`.

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const checks = [];

function check(name, fn) {
  try {
    fn();
    checks.push(`✔ ${name}`);
  } catch (error) {
    checks.push(`✖ ${name}\n    ${error.message}`);
    process.exitCode = 1;
  }
}

// --- CommonJS ---------------------------------------------------------------

const cjs = require(resolve(root, 'dist/node/index.js'));

check('require() expone calculateAge', () => {
  assert.equal(typeof cjs.calculateAge, 'function');
  assert.equal(cjs.calculateAge('1990-05-25', { referenceDate: '2026-09-04' }), 36);
});

check('require() expone el API nuevo completo', () => {
  for (const name of [
    'getAgeDetails',
    'getNextBirthday',
    'getLegalStatus',
    'getZodiacSign',
    'getChineseZodiac',
    'formatAge',
    'AgeCalculator',
    'InvalidDateError',
  ]) {
    assert.equal(typeof cjs[name], 'function', `falta ${name}`);
  }
});

check('la ruta profunda de la v1 sigue funcionando', () => {
  const legacy = require(resolve(root, 'dist/node/ageCalculator.js'));
  assert.equal(typeof legacy.calculateAge, 'function');
  assert.equal(legacy.calculateAge('1990-05-25', { referenceDate: '2026-09-04' }), 36);
});

// --- ESM --------------------------------------------------------------------

const esm = await import(pathToFileURL(resolve(root, 'dist/browser/index.js')).href);

check('import expone calculateAge como export nombrado y por defecto', () => {
  assert.equal(typeof esm.calculateAge, 'function');
  assert.equal(typeof esm.default, 'function');
  assert.equal(esm.default('1990-05-25', { referenceDate: '2026-09-04' }), 36);
});

check('ambos formatos dan el mismo resultado', () => {
  const options = { referenceDate: '2026-09-04', timeZone: 'America/Bogota' };
  assert.deepEqual(
    esm.getAgeDetails('1990-05-25', options),
    cjs.getAgeDetails('1990-05-25', options),
  );
});

check('la clase se instancia desde el paquete construido', () => {
  const calculator = new esm.AgeCalculator({ locale: 'es-CO', referenceDate: '2026-09-04' });
  assert.equal(calculator.age('25/05/1990'), 36);
  assert.equal(calculator.format('25/05/1990'), '36 años');
});

// --- Empaquetado ------------------------------------------------------------

check('los marcadores de formato de módulo están en su sitio', () => {
  assert.equal(require(resolve(root, 'dist/browser/package.json')).type, 'module');
  assert.equal(require(resolve(root, 'dist/node/package.json')).type, 'commonjs');
});

check('las declaraciones de tipos existen donde las anuncia package.json', () => {
  const manifest = require(resolve(root, 'package.json'));
  for (const path of [manifest.types, manifest.main, manifest.module]) {
    assert.ok(existsSync(resolve(root, path)), `no existe ${path}`);
  }
});

console.log(checks.join('\n'));
console.log(process.exitCode ? '\nHay comprobaciones fallidas.' : '\nPaquete verificado.');
