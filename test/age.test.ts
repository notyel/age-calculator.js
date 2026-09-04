// test/age.test.ts

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  AgeCalculator,
  calculateAge,
  compareByAge,
  daysUntilNextBirthday,
  FutureDateError,
  getAgeAt,
  getAgeBreakdown,
  getAgeDetails,
  getAgeIn,
  getBirthDateRange,
  getNextBirthday,
  InvalidDateError,
  InvalidTimeZoneError,
  isBirthdayToday,
  toISO,
} from '../src/index.js';

/** Fecha de referencia fija para que las pruebas no dependan del reloj. */
const TODAY = '2026-09-04';

describe('calculateAge — compatibilidad con la versión 1', () => {
  it('mantiene la firma de un solo argumento y devuelve un número', () => {
    const age = calculateAge('1990-05-25');
    assert.equal(typeof age, 'number');
    assert.ok(age > 0 && age < 130);
  });

  it('cuenta los años cumplidos', () => {
    assert.equal(calculateAge('1990-05-25', { referenceDate: TODAY }), 36);
  });

  it('no cuenta el año en curso hasta el día del cumpleaños', () => {
    assert.equal(calculateAge('1990-09-05', { referenceDate: TODAY }), 35);
    assert.equal(calculateAge('1990-09-04', { referenceDate: TODAY }), 36);
    assert.equal(calculateAge('1990-09-03', { referenceDate: TODAY }), 36);
  });

  it('devuelve 0 el día del nacimiento', () => {
    assert.equal(calculateAge(TODAY, { referenceDate: TODAY }), 0);
  });
});

describe('zonas horarias', () => {
  // El fallo de la versión 1: `new Date('1990-05-25')` es medianoche UTC, pero
  // `new Date()` es local. En Bogotá (UTC-5) el 25 de mayo a las 20:00 locales
  // ya es 26 de mayo en UTC, así que la resta adelantaba el cumpleaños un día.
  const eveningInBogota = Date.UTC(2026, 4, 25, 1, 30); // 24-05 20:30 en Bogotá

  it('respeta el día vivido en la zona indicada, no el de UTC', () => {
    assert.equal(
      calculateAge('1990-05-25', {
        referenceDate: eveningInBogota,
        timeZone: 'America/Bogota',
      }),
      35,
      'en Bogotá todavía es 24 de mayo: aún no ha cumplido',
    );

    assert.equal(
      calculateAge('1990-05-25', {
        referenceDate: eveningInBogota,
        timeZone: 'UTC',
      }),
      36,
      'en UTC ya es 25 de mayo: ya cumplió',
    );
  });

  it('acierta al otro lado de la línea de cambio de fecha', () => {
    const instant = Date.UTC(2026, 4, 24, 20, 0); // 25-05 05:00 en Tokio
    assert.equal(
      calculateAge('1990-05-25', { referenceDate: instant, timeZone: 'Asia/Tokyo' }),
      36,
    );
    assert.equal(
      calculateAge('1990-05-25', { referenceDate: instant, timeZone: 'America/Bogota' }),
      35,
    );
  });

  it('soporta husos con desfase de media hora', () => {
    const instant = Date.UTC(2026, 4, 24, 19, 0); // 25-05 00:30 en Katmandú
    assert.equal(
      calculateAge('1990-05-25', { referenceDate: instant, timeZone: 'Asia/Kathmandu' }),
      36,
    );
  });

  it('rechaza una zona horaria inexistente', () => {
    assert.throws(
      () => calculateAge('1990-05-25', { timeZone: 'Mordor/Barad-dur' }),
      InvalidTimeZoneError,
    );
  });

  it('no desplaza el día al cruzar el cambio de horario de verano', () => {
    // En Madrid, el 29-03-2026 la madrugada salta de las 02:00 a las 03:00.
    assert.equal(
      getAgeIn('2026-03-29', 'hours', {
        referenceDate: '2026-03-30',
        timeZone: 'Europe/Madrid',
      }),
      23,
      'ese día dura 23 horas reales',
    );
    assert.equal(
      getAgeIn('2026-03-29', 'days', {
        referenceDate: '2026-03-30',
        timeZone: 'Europe/Madrid',
      }),
      1,
      'pero sigue siendo un día de calendario',
    );
  });
});

describe('29 de febrero', () => {
  const leapling = '2004-02-29';

  it("con la regla 'feb28' cumple el 28 en los años no bisiestos", () => {
    assert.equal(calculateAge(leapling, { referenceDate: '2026-02-28' }), 22);
    assert.equal(calculateAge(leapling, { referenceDate: '2026-02-27' }), 21);
    assert.ok(isBirthdayToday(leapling, { referenceDate: '2026-02-28' }));
  });

  it("con la regla 'mar1' espera al 1 de marzo", () => {
    const options = { leapDayRule: 'mar1' as const };
    assert.equal(calculateAge(leapling, { ...options, referenceDate: '2026-02-28' }), 21);
    assert.equal(calculateAge(leapling, { ...options, referenceDate: '2026-03-01' }), 22);
    assert.ok(isBirthdayToday(leapling, { ...options, referenceDate: '2026-03-01' }));
    assert.ok(!isBirthdayToday(leapling, { ...options, referenceDate: '2026-02-28' }));
  });

  it('cumple el 29 cuando el año sí es bisiesto, con cualquier regla', () => {
    assert.equal(calculateAge(leapling, { referenceDate: '2028-02-29' }), 24);
    assert.equal(
      calculateAge(leapling, { referenceDate: '2028-02-29', leapDayRule: 'mar1' }),
      24,
    );
  });

  it('lo señala en el informe detallado', () => {
    assert.ok(getAgeDetails(leapling, { referenceDate: TODAY }).bornOnLeapDay);
    assert.ok(!getAgeDetails('2004-03-01', { referenceDate: TODAY }).bornOnLeapDay);
  });
});

describe('getAgeBreakdown', () => {
  it('desglosa años, meses y días', () => {
    assert.deepEqual(getAgeBreakdown('1990-05-25', { referenceDate: TODAY }), {
      years: 36,
      months: 3,
      days: 10,
    });
  });

  it('es cero en el día del nacimiento', () => {
    assert.deepEqual(getAgeBreakdown(TODAY, { referenceDate: TODAY }), {
      years: 0,
      months: 0,
      days: 0,
    });
  });

  it('recorta al último día del mes cuando el destino es más corto', () => {
    // Del 31 de enero al 28 de febrero es exactamente un mes, no menos.
    assert.deepEqual(getAgeBreakdown('2026-01-31', { referenceDate: '2026-02-28' }), {
      years: 0,
      months: 1,
      days: 0,
    });
    assert.deepEqual(getAgeBreakdown('2026-01-31', { referenceDate: '2026-03-01' }), {
      years: 0,
      months: 1,
      days: 1,
    });
  });

  it('nunca produce meses o días negativos con fechas pasadas', () => {
    for (let day = 1; day <= 28; day++) {
      const iso = `2000-01-${String(day).padStart(2, '0')}`;
      const parts = getAgeBreakdown(iso, { referenceDate: TODAY });
      assert.ok(parts.months >= 0 && parts.months < 12, `meses fuera de rango en ${iso}`);
      assert.ok(parts.days >= 0 && parts.days < 32, `días fuera de rango en ${iso}`);
    }
  });
});

describe('getAgeIn', () => {
  const options = { referenceDate: '2026-01-01', timeZone: 'UTC' } as const;

  it('cuenta días completos', () => {
    assert.equal(getAgeIn('2025-01-01', 'days', options), 365);
    assert.equal(getAgeIn('2024-01-01', 'days', options), 731, '2024 fue bisiesto');
  });

  it('cuenta semanas, meses y años', () => {
    assert.equal(getAgeIn('2025-01-01', 'weeks', options), 52);
    assert.equal(getAgeIn('2025-01-01', 'months', options), 12);
    assert.equal(getAgeIn('2025-01-01', 'years', options), 1);
  });

  it('baja a horas, minutos y segundos', () => {
    assert.equal(getAgeIn('2025-12-31', 'hours', options), 24);
    assert.equal(getAgeIn('2025-12-31', 'minutes', options), 1440);
    assert.equal(getAgeIn('2025-12-31', 'seconds', options), 86_400);
  });
});

describe('getNextBirthday', () => {
  it('apunta al del año en curso si aún no ha pasado', () => {
    const next = getNextBirthday('1990-12-25', { referenceDate: TODAY });
    assert.equal(next.date, '2026-12-25');
    assert.equal(next.turningAge, 36);
    assert.equal(next.isToday, false);
    assert.equal(next.weekday, 5, 'el 25-12-2026 cae en viernes');
  });

  it('salta al año siguiente si ya pasó', () => {
    const next = getNextBirthday('1990-05-25', { referenceDate: TODAY });
    assert.equal(next.date, '2027-05-25');
    assert.equal(next.turningAge, 37);
  });

  it('devuelve 0 días cuando el cumpleaños es hoy', () => {
    const next = getNextBirthday('1990-09-04', { referenceDate: TODAY });
    assert.equal(next.daysUntil, 0);
    assert.equal(next.isToday, true);
    assert.equal(next.turningAge, 36, 'la edad que cumple hoy');
    assert.equal(daysUntilNextBirthday('1990-09-04', { referenceDate: TODAY }), 0);
  });

  it('coincide con el desglose: días restantes + días vividos = año completo', () => {
    const details = getAgeDetails('1990-05-25', { referenceDate: TODAY });
    assert.equal(details.nextBirthday, '2027-05-25');
    assert.equal(details.daysUntilNextBirthday, 263);
  });
});

describe('getAgeDetails', () => {
  const details = getAgeDetails('1990-05-25', { referenceDate: TODAY, timeZone: 'UTC' });

  it('normaliza las fechas a ISO', () => {
    assert.equal(details.birthDate, '1990-05-25');
    assert.equal(details.referenceDate, TODAY);
    assert.equal(details.timeZone, 'UTC');
  });

  it('mantiene coherentes los totales', () => {
    assert.equal(details.totalMonths, details.years * 12 + details.months);
    assert.equal(details.totalWeeks, Math.trunc(details.totalDays / 7));
    assert.equal(details.totalDays, 13_251);
  });

  it('resuelve el día de la semana del nacimiento', () => {
    assert.equal(details.weekdayBorn, 5, 'el 25-05-1990 fue viernes');
  });
});

describe('sistemas de cómputo regionales', () => {
  // Nacido el 31 de diciembre: el caso extremo del cómputo de Asia Oriental.
  const birth = '2025-12-31';

  it('la edad occidental cuenta aniversarios', () => {
    assert.equal(calculateAge(birth, { referenceDate: '2026-01-01' }), 0);
  });

  it("'east-asian' nace con 1 año y suma otro cada 1 de enero", () => {
    assert.equal(
      calculateAge(birth, { referenceDate: '2025-12-31', reckoning: 'east-asian' }),
      1,
    );
    assert.equal(
      calculateAge(birth, { referenceDate: '2026-01-01', reckoning: 'east-asian' }),
      2,
    );
  });

  it("'korean-year' es la resta de años a secas", () => {
    assert.equal(
      calculateAge(birth, { referenceDate: '2026-01-01', reckoning: 'korean-year' }),
      1,
    );
    assert.equal(
      calculateAge('1990-05-25', { referenceDate: TODAY, reckoning: 'korean-year' }),
      36,
    );
  });

  it('el informe detallado expone ambas a la vez', () => {
    const details = getAgeDetails('1990-12-25', {
      referenceDate: TODAY,
      reckoning: 'east-asian',
    });
    assert.equal(details.years, 35, 'la occidental, en el desglose');
    assert.equal(details.reckonedAge, 37, 'la de Asia Oriental, aparte');
  });
});

describe('fechas futuras', () => {
  it('lanza FutureDateError por defecto', () => {
    assert.throws(
      () => calculateAge('2030-01-01', { referenceDate: TODAY }),
      (error: unknown) => {
        assert.ok(error instanceof FutureDateError);
        assert.equal(error.birthDate, '2030-01-01');
        assert.equal(error.referenceDate, TODAY);
        return true;
      },
    );
  });

  it('devuelve una edad negativa si se permite explícitamente', () => {
    assert.equal(
      calculateAge('2030-01-01', { referenceDate: TODAY, allowFuture: true }),
      -3,
    );
  });
});

describe('getBirthDateRange', () => {
  it('acota las fechas de quien tiene exactamente esa edad', () => {
    const range = getBirthDateRange(18, { referenceDate: TODAY });
    assert.equal(range.from, '2007-09-05');
    assert.equal(range.to, '2008-09-04');
  });

  it('los extremos del rango dan justo esa edad y los vecinos no', () => {
    const age = 30;
    const { from, to } = getBirthDateRange(age, { referenceDate: TODAY });
    assert.equal(calculateAge(from, { referenceDate: TODAY }), age);
    assert.equal(calculateAge(to, { referenceDate: TODAY }), age);
    assert.equal(
      calculateAge(toISO(from, { referenceDate: TODAY }), { referenceDate: TODAY }),
      age,
    );
  });

  it('rechaza edades no válidas', () => {
    assert.throws(() => getBirthDateRange(-1), RangeError);
    assert.throws(() => getBirthDateRange(1.5), RangeError);
  });
});

describe('getAgeAt y compareByAge', () => {
  it('calcula la edad a una fecha pasada', () => {
    assert.equal(getAgeAt('1990-05-25', '2010-01-01'), 19);
  });

  it('ordena de mayor a menor edad', () => {
    const sorted = ['2000-01-01', '1980-06-15', '1995-12-31'].sort((a, b) =>
      compareByAge(a, b),
    );
    assert.deepEqual(sorted, ['1980-06-15', '1995-12-31', '2000-01-01']);
  });
});

describe('AgeCalculator', () => {
  const co = new AgeCalculator({
    timeZone: 'America/Bogota',
    locale: 'es-CO',
    referenceDate: TODAY,
  });

  it('aplica las opciones fijas a cada llamada', () => {
    assert.equal(co.age('25/05/1990'), 36, 'parseado en formato colombiano');
    assert.equal(co.details('25/05/1990').timeZone, 'America/Bogota');
  });

  it('permite sobreescribir opciones puntualmente', () => {
    assert.equal(co.age('25/05/1990', { referenceDate: '2020-01-01' }), 29);
  });

  it('with() deriva una calculadora sin mutar la original', () => {
    const us = co.with({ locale: 'en-US', dateOrder: 'MDY' });
    assert.equal(us.age('05/25/1990'), 36);
    assert.equal(co.age('25/05/1990'), 36, 'la original no cambió');
    assert.equal(co.defaults.locale, 'es-CO');
  });

  it('ordena listas de fechas', () => {
    assert.deepEqual(co.sortByAge(['2000-01-01', '1980-06-15']), [
      '1980-06-15',
      '2000-01-01',
    ]);
  });

  it('propaga los errores de entrada', () => {
    assert.throws(() => co.age('no es una fecha'), InvalidDateError);
  });
});
