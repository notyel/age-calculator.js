// scripts/finalize-build.mjs
//
// Node decide si un `.js` es ESM o CommonJS por el campo `type` del
// `package.json` más cercano. La raíz del paquete no lo declara (por defecto,
// CommonJS), así que la carpeta ESM necesita su propio marcador; si no, Node
// se traga los `import` de `dist/browser` como si fueran CommonJS y falla.

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const markers = [
  ['dist/browser/package.json', { type: 'module' }],
  ['dist/node/package.json', { type: 'commonjs' }],
];

for (const [relativePath, contents] of markers) {
  const target = resolve(root, relativePath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(contents, null, 2)}\n`, 'utf8');
  console.log(`✔ ${relativePath}`);
}
