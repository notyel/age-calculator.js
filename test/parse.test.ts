// test/parse.test.ts

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { calculateAge, detectDateOrder, InvalidDateError, toISO } from '../src/index.js';

const TODAY = '2026-09-04';
const base = { referenceDate: TODAY, timeZone: 'UTC' } as const;

describe('formatos ISO', () => {
  it('toma una fecha sin hora al pie de la letra, sin desplazarla de huso', () => {
    // La versión 1 fallaba justo aquí: interpretaba la cadena en UTC y la
    // comparaba contra un "hoy" local.
    for (const timeZone of ['America/Bogota', 'UTC', 'Asia/Tokyo', 'Pacific/Kiritimati']) {
      assert.equal(toISO('1990-05-25', { timeZone }), '1990-05-25', `falla en ${timeZone}`);
    }
  });

  it('proyecta un instante con hora sobre la zona pedida', () => {
    const midnightUTC = '2026-01-01T00:30:00Z';
    assert.equal(toISO(midnightUTC, { timeZone: 'UTC' }), '2026-01-01');
    assert.equal(toISO(midnightUTC, { timeZone: 'America/Bogota' }), '2025-12-31');
  });

  it('acepta Date y timestamps', () => {
    const instant = Date.UTC(1990, 4, 25, 12);
    assert.equal(toISO(instant, { timeZone: 'UTC' }), '1990-05-25');
    assert.equal(toISO(new Date(instant), { timeZone: 'UTC' }), '1990-05-25');
  });

  it('acepta una fecha civil ya descompuesta', () => {
    assert.equal(toISO({ year: 1990, month: 5, day: 25 }), '1990-05-25');
  });
});

describe('desambiguación regional de fechas cortas', () => {
  it('deduce el orden de los componentes a partir del locale', () => {
    assert.equal(detectDateOrder('es-CO'), 'DMY');
    assert.equal(detectDateOrder('es-ES'), 'DMY');
    assert.equal(detectDateOrder('en-US'), 'MDY');
    assert.equal(detectDateOrder('ja-JP'), 'YMD');
  });

  it('lee 03/04/2020 como cada región la escribe', () => {
    assert.equal(toISO('03/04/2020', { locale: 'es-ES', ...base }), '2020-04-03');
    assert.equal(toISO('03/04/2020', { locale: 'en-US', ...base }), '2020-03-04');
    assert.equal(toISO('03/04/2020', { locale: 'en-GB', ...base }), '2020-04-03');
  });

  it('acepta un orden explícito que gana al del locale', () => {
    assert.equal(
      toISO('03/04/2020', { locale: 'en-US', dateOrder: 'DMY', ...base }),
      '2020-04-03',
    );
  });

  it('admite guiones, puntos y espacios como separadores', () => {
    for (const text of ['25/05/1990', '25-05-1990', '25.05.1990', '25 05 1990']) {
      assert.equal(toISO(text, { locale: 'es-CO', ...base }), '1990-05-25', text);
    }
  });

  it('reconoce el año cuando va primero, aunque el locale diga otra cosa', () => {
    assert.equal(toISO('1990/05/25', { locale: 'en-US', ...base }), '1990-05-25');
  });

  it('corrige el orden cuando un componente no puede ser un mes', () => {
    // 25 no es un mes válido: aunque en-US diga MDY, sólo cabe leerlo como día.
    assert.equal(toISO('25/05/1990', { locale: 'en-US', ...base }), '1990-05-25');
  });

  it('expande años de dos cifras sin mandar a nadie al futuro', () => {
    assert.equal(toISO('25/05/90', { locale: 'es-CO', ...base }), '1990-05-25');
    assert.equal(toISO('25/05/25', { locale: 'es-CO', ...base }), '2025-05-25');
  });
});

describe('nombres de mes localizados', () => {
  it('entiende el mes escrito en el idioma del locale', () => {
    assert.equal(toISO('25 de mayo de 1990', { locale: 'es', ...base }), '1990-05-25');
    assert.equal(toISO('May 25, 1990', { locale: 'en', ...base }), '1990-05-25');
    assert.equal(toISO('25 mai 1990', { locale: 'fr', ...base }), '1990-05-25');
    assert.equal(toISO('25 de maio de 1990', { locale: 'pt', ...base }), '1990-05-25');
  });

  it('tolera abreviaturas, mayúsculas y tildes ausentes', () => {
    assert.equal(toISO('25 dic 1990', { locale: 'es', ...base }), '1990-12-25');
    assert.equal(toISO('25 DICIEMBRE 1990', { locale: 'es', ...base }), '1990-12-25');
    assert.equal(toISO('1 marzo 1990', { locale: 'es', ...base }), '1990-03-01');
  });

  it('rechaza un mes que no existe en ese idioma', () => {
    assert.throws(() => toISO('25 de smarch de 1990', { locale: 'es' }), InvalidDateError);
  });
});

describe('entradas inválidas', () => {
  const casos: Array<[string, unknown]> = [
    ['cadena vacía', ''],
    ['texto libre', 'ayer'],
    ['día que no existe', '2026-02-30'],
    ['mes fuera de rango', '2026-13-01'],
    ['31 de febrero en formato regional', '31/02/2020'],
    ['Date inválido', new Date('nope')],
    ['NaN', Number.NaN],
    ['null', null],
    ['undefined', undefined],
  ];

  for (const [nombre, valor] of casos) {
    it(`rechaza ${nombre}`, () => {
      assert.throws(
        () => calculateAge(valor as string, { locale: 'es-CO' }),
        InvalidDateError,
      );
    });
  }

  it('el error conserva la entrada original para poder informarla', () => {
    assert.throws(
      () => calculateAge('2026-02-30'),
      (error: unknown) => {
        assert.ok(error instanceof InvalidDateError);
        assert.equal(error.input, '2026-02-30');
        assert.match(error.message, /no existe en el calendario/);
        return true;
      },
    );
  });
});
