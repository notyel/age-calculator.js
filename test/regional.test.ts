// test/regional.test.ts

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  ageOfMajorityFor,
  DEFAULT_AGE_OF_MAJORITY,
  formatAge,
  formatBirthDate,
  formatTimeToNextBirthday,
  formatWeekday,
  getChineseZodiac,
  getDateAtAge,
  getGeneration,
  getLegalStatus,
  getLifeStage,
  getZodiacSign,
  isAdult,
  isAtLeast,
} from '../src/index.js';

const TODAY = '2026-09-04';
const base = { referenceDate: TODAY } as const;

describe('formatAge', () => {
  it('escribe la edad en el idioma pedido', () => {
    assert.equal(formatAge('1990-05-25', { ...base, locale: 'es-CO' }), '36 años');
    assert.equal(formatAge('1990-05-25', { ...base, locale: 'en-US' }), '36 years');
  });

  it('desglosa con la precisión pedida', () => {
    const full = formatAge('1990-05-25', { ...base, locale: 'es-CO', precision: 'full' });
    assert.match(full, /36 años/);
    assert.match(full, /3 meses/);
    assert.match(full, /10 días/);

    const short = formatAge('1990-05-25', {
      ...base,
      locale: 'es-CO',
      precision: 'years-months',
    });
    assert.match(short, /36 años/);
    assert.ok(!short.includes('días'), 'no debería incluir los días');
  });

  it('omite las partes en cero salvo que se pidan', () => {
    const options = { referenceDate: '2026-05-25', locale: 'es-CO', precision: 'full' } as const;
    assert.equal(formatAge('1990-05-25', options), '36 años');
    assert.match(formatAge('1990-05-25', { ...options, includeZero: true }), /0 meses/);
  });

  it('funciona con idiomas que no llevan traducción en la librería', () => {
    // Nada de esto está escrito a mano: lo pone Intl con los datos de CLDR.
    assert.ok(formatAge('1990-05-25', { ...base, locale: 'ja-JP' }).includes('36'));
    assert.ok(formatAge('1990-05-25', { ...base, locale: 'ar-EG' }).length > 0);
  });
});

describe('formatBirthDate', () => {
  it('respeta el orden y el idioma de cada región', () => {
    assert.equal(formatBirthDate('1990-05-25', { locale: 'es-ES' }), '25 de mayo de 1990');
    assert.equal(formatBirthDate('1990-05-25', { locale: 'en-US' }), 'May 25, 1990');
  });

  it('no se corre de día por culpa de la zona horaria', () => {
    for (const timeZone of ['Pacific/Kiritimati', 'Pacific/Midway', 'UTC']) {
      assert.match(
        formatBirthDate('1990-05-25', { locale: 'es-ES', timeZone }),
        /25 de mayo de 1990/,
        `se desplazó en ${timeZone}`,
      );
    }
  });

  it('puede mostrarla en otro calendario sin cambiar el cálculo', () => {
    const islamic = formatBirthDate('1990-05-25', {
      locale: 'es',
      calendar: 'islamic-umalqura',
    });
    assert.ok(islamic.includes('1410'), `se esperaba el año 1410 AH, se obtuvo "${islamic}"`);

    const japanese = formatBirthDate('1990-05-25', { locale: 'ja', calendar: 'japanese' });
    assert.ok(japanese.length > 0);
  });
});

describe('formatTimeToNextBirthday y formatWeekday', () => {
  it('describe la espera en lenguaje natural', () => {
    const texto = formatTimeToNextBirthday('1990-12-25', { ...base, locale: 'es' });
    assert.match(texto, /\d/);
  });

  it('nombra el día de la semana en el idioma pedido', () => {
    assert.equal(formatWeekday(0, { locale: 'es' }), 'domingo');
    assert.equal(formatWeekday(5, { locale: 'es' }), 'viernes');
    assert.equal(formatWeekday(5, { locale: 'en' }), 'Friday');
  });
});

describe('mayoría de edad por jurisdicción', () => {
  it('usa 18 años cuando no hay una regla más específica', () => {
    assert.equal(ageOfMajorityFor('CO'), DEFAULT_AGE_OF_MAJORITY);
    assert.equal(ageOfMajorityFor('ES'), 18);
  });

  it('conoce los países que se apartan del estándar', () => {
    assert.equal(ageOfMajorityFor('SG'), 21);
    assert.equal(ageOfMajorityFor('NZ'), 20);
    assert.equal(ageOfMajorityFor('KR'), 19);
  });

  it('afina por subdivisión y recae en el país si no la conoce', () => {
    assert.equal(ageOfMajorityFor('US'), 18);
    assert.equal(ageOfMajorityFor('US-AL'), 19);
    assert.equal(ageOfMajorityFor('US-CA'), 18);
    assert.equal(ageOfMajorityFor('GB-SCT'), 16);
    assert.equal(ageOfMajorityFor('us-al'), 19, 'sin distinguir mayúsculas');
  });

  it('cambia el veredicto según el país, con la misma fecha', () => {
    const birth = '2008-01-15'; // 18 años cumplidos al 2026-09-04
    assert.equal(isAdult(birth, { ...base, country: 'CO' }), true);
    assert.equal(isAdult(birth, { ...base, country: 'US-AL' }), false);
    assert.equal(isAdult(birth, { ...base, country: 'SG' }), false);
  });

  it('deduce el país del locale si no se indica', () => {
    const birth = '2008-01-15';
    assert.equal(isAdult(birth, { ...base, locale: 'en-SG' }), false);
    assert.equal(isAdult(birth, { ...base, locale: 'es-CO' }), true);
  });

  it('informa de cuánto falta para la mayoría de edad', () => {
    const status = getLegalStatus('2010-03-15', { ...base, country: 'ES' });
    assert.equal(status.ageOfMajority, 18);
    assert.equal(status.age, 16);
    assert.equal(status.isAdult, false);
    assert.equal(status.majorityDate, '2028-03-15');
    assert.ok(status.daysUntilMajority > 0);
  });

  it('acepta un umbral a medida para vallas de edad', () => {
    const status = getLegalStatus('2010-03-15', { ...base, ageOfMajority: 16 });
    assert.equal(status.isAdult, true);
    assert.equal(status.daysUntilMajority, 0);
    assert.equal(isAtLeast('2010-03-15', 13, base), true);
    assert.equal(isAtLeast('2010-03-15', 21, base), false);
  });

  it('getDateAtAge da la fecha exacta del umbral', () => {
    assert.equal(getDateAtAge('2010-03-15', 18), '2028-03-15');
    assert.equal(getDateAtAge('2004-02-29', 1), '2005-02-28', 'recorta el 29 de febrero');
  });
});

describe('zodiaco occidental', () => {
  const casos: Array<[string, string]> = [
    ['1990-05-25', 'gemini'],
    ['1990-01-01', 'capricorn'],
    ['1990-01-19', 'capricorn'],
    ['1990-01-20', 'aquarius'],
    ['1990-12-21', 'sagittarius'],
    ['1990-12-22', 'capricorn'],
    ['1990-12-31', 'capricorn'],
    ['2004-02-29', 'pisces'],
  ];

  for (const [fecha, esperado] of casos) {
    it(`${fecha} es ${esperado}`, () => {
      assert.equal(getZodiacSign(fecha).id, esperado);
    });
  }

  it('traduce el nombre y expone símbolo y elemento', () => {
    const signo = getZodiacSign('1990-05-25', { locale: 'es' });
    assert.equal(signo.name, 'Géminis');
    assert.equal(signo.symbol, '♊');
    assert.equal(signo.element, 'air');
    assert.equal(getZodiacSign('1990-05-25', { locale: 'en' }).name, 'Gemini');
    assert.equal(getZodiacSign('1990-05-25', { locale: 'de' }).name, 'Gemini', 'recae en inglés');
  });
});

describe('zodiaco chino', () => {
  it('usa el año nuevo lunar, no el 1 de enero', () => {
    // El año del Caballo de Metal empezó el 27-01-1990.
    assert.equal(getChineseZodiac('1990-05-25').id, 'horse');
    assert.equal(
      getChineseZodiac('1990-01-10').id,
      'snake',
      'antes del año nuevo lunar sigue siendo el año anterior',
    );
    assert.equal(getChineseZodiac('1990-01-27').id, 'horse');
  });

  it('acierta el elemento del ciclo sexagenario', () => {
    assert.equal(getChineseZodiac('1990-05-25').element, 'metal');
    assert.equal(getChineseZodiac('1984-06-01').element, 'wood', '1984 abre el ciclo');
    assert.equal(getChineseZodiac('1984-06-01').id, 'rat');
  });

  it('traduce el nombre del animal', () => {
    assert.equal(getChineseZodiac('1990-05-25', { locale: 'es' }).name, 'Caballo');
    assert.equal(getChineseZodiac('1990-05-25', { locale: 'en' }).name, 'Horse');
    assert.equal(getChineseZodiac('1990-05-25').branch, '午');
  });
});

describe('generaciones y etapas', () => {
  const generaciones: Array<[string, string]> = [
    ['1935-01-01', 'silent'],
    ['1955-01-01', 'boomer'],
    ['1975-01-01', 'gen-x'],
    ['1990-05-25', 'millennial'],
    ['2005-01-01', 'gen-z'],
    ['2015-01-01', 'gen-alpha'],
    ['2025-01-01', 'gen-beta'],
  ];

  for (const [fecha, esperada] of generaciones) {
    it(`${fecha} es ${esperada}`, () => {
      assert.equal(getGeneration(fecha).id, esperada);
    });
  }

  it('acierta en los años de corte', () => {
    assert.equal(getGeneration('1996-12-31').id, 'millennial');
    assert.equal(getGeneration('1997-01-01').id, 'gen-z');
  });

  const etapas: Array<[string, string]> = [
    ['2026-06-01', 'infant'],
    ['2024-01-01', 'toddler'],
    ['2018-01-01', 'child'],
    ['2010-01-01', 'teenager'],
    ['2004-01-01', 'young-adult'],
    ['1990-05-25', 'adult'],
    ['1950-01-01', 'senior'],
  ];

  for (const [fecha, esperada] of etapas) {
    it(`${fecha} está en la etapa ${esperada}`, () => {
      assert.equal(getLifeStage(fecha, base), esperada);
    });
  }
});
