// src/core/age.ts
//
// El cálculo propiamente dicho. Todo se apoya en la comparación con el
// aniversario del año en curso, que es como se define la edad legalmente en
// casi todas partes, y no en dividir milisegundos entre 365,25.

import { FutureDateError } from '../errors.js';
import type {
  AgeBreakdown,
  AgeDetails,
  AgeOptions,
  AgeUnit,
  BirthDateRange,
  CivilDate,
  DateInput,
  LeapDayRule,
  NextBirthday,
} from '../types.js';
import {
  addDays,
  addMonths,
  addYears,
  compareCivil,
  daysBetween,
  instantFromZoned,
  toISODate,
  weekdayOf,
} from './calendar.js';
import { resolveOptions, type ResolvedOptions } from './options.js';
import { parseCivilDate } from './parse.js';

/**
 * Ancla de la fecha de nacimiento desplazada `months` meses, aplicando la regla
 * del 29 de febrero.
 *
 * `addMonths` ya recorta al último día del mes destino, que es exactamente la
 * regla `'feb28'`. Para `'mar1'` hay que empujar un día el recorte, y sólo ese:
 * el 31 de enero + 1 mes sigue siendo el 28 de febrero.
 */
function anchorAt(birth: CivilDate, months: number, rule: LeapDayRule): CivilDate {
  const anchor = addMonths(birth, months);
  const clampedLeapDay =
    rule === 'mar1' &&
    birth.month === 2 &&
    birth.day === 29 &&
    anchor.month === 2 &&
    anchor.day === 28;
  return clampedLeapDay ? addDays(anchor, 1) : anchor;
}

/** Fecha en la que se celebra el cumpleaños de `birth` durante el año `year`. */
export function birthdayInYear(
  birth: CivilDate,
  year: number,
  rule: LeapDayRule = 'feb28',
): CivilDate {
  return anchorAt(birth, (year - birth.year) * 12, rule);
}

function assertNotFuture(birth: CivilDate, resolved: ResolvedOptions): void {
  if (!resolved.allowFuture && compareCivil(birth, resolved.today) > 0) {
    throw new FutureDateError(toISODate(birth), toISODate(resolved.today));
  }
}

/** Años cumplidos según el criterio occidental, con signo si la fecha es futura. */
function westernYears(birth: CivilDate, resolved: ResolvedOptions): number {
  const { today, leapDayRule } = resolved;

  // Una fecha futura se mide al revés y se le pone el signo, para que el
  // resultado sea el simétrico exacto y no uno más por el redondeo.
  if (compareCivil(birth, today) > 0) {
    return -westernYears(today, { ...resolved, today: birth });
  }

  let years = today.year - birth.year;
  const anniversary = birthdayInYear(birth, today.year, leapDayRule);
  if (compareCivil(today, anniversary) < 0) years--;
  return years;
}

function reckon(birth: CivilDate, resolved: ResolvedOptions): number {
  switch (resolved.reckoning) {
    // Se nace con 1 año y se suma otro cada 1 de enero, no en el cumpleaños.
    case 'east-asian':
      return resolved.today.year - birth.year + 1;
    // 연 나이: la que usan en Corea la ley de menores y la de servicio militar.
    case 'korean-year':
      return resolved.today.year - birth.year;
    default:
      return westernYears(birth, resolved);
  }
}

/**
 * Calcula la edad en años cumplidos.
 *
 * Firma compatible con la versión 1: `calculateAge('1990-05-25')` sigue
 * devolviendo un número. Lo que cambia es que ahora acierta cerca de la
 * medianoche y en cualquier zona horaria.
 *
 * @example
 * calculateAge('1990-05-25');
 * calculateAge('1990-05-25', { timeZone: 'America/Bogota' });
 * calculateAge('25/05/1990', { locale: 'es-CO' });
 */
export function calculateAge(birthDate: DateInput, options: AgeOptions = {}): number {
  const resolved = resolveOptions(options);
  const birth = parseCivilDate(birthDate, resolved);
  assertNotFuture(birth, resolved);
  return reckon(birth, resolved);
}

/**
 * Edad a una fecha concreta, sin tocar el resto de opciones.
 *
 * Atajo de `calculateAge(birthDate, { ...options, referenceDate })` para el
 * caso frecuente de "qué edad tenía en la fecha del contrato".
 */
export function getAgeAt(
  birthDate: DateInput,
  referenceDate: DateInput,
  options: AgeOptions = {},
): number {
  return calculateAge(birthDate, { ...options, referenceDate });
}

/** Desglose en años, meses y días de calendario completos. */
export function getAgeBreakdown(
  birthDate: DateInput,
  options: AgeOptions = {},
): AgeBreakdown {
  const resolved = resolveOptions(options);
  const birth = parseCivilDate(birthDate, resolved);
  assertNotFuture(birth, resolved);
  return breakdown(birth, resolved);
}

function breakdown(birth: CivilDate, resolved: ResolvedOptions): AgeBreakdown {
  const { today, leapDayRule } = resolved;
  const sign = compareCivil(birth, today) > 0 ? -1 : 1;
  const [from, to] = sign === 1 ? [birth, today] : [today, birth];

  const years = Math.max(0, westernYears(from, { ...resolved, today: to }));
  let months = 0;
  while (months < 12 && compareCivil(anchorAt(from, years * 12 + months + 1, leapDayRule), to) <= 0) {
    months++;
  }
  const days = daysBetween(anchorAt(from, years * 12 + months, leapDayRule), to);

  return { years: years * sign, months: months * sign, days: days * sign };
}

/** Edad expresada en una sola unidad, truncada hacia abajo. */
export function getAgeIn(
  birthDate: DateInput,
  unit: AgeUnit,
  options: AgeOptions = {},
): number {
  const resolved = resolveOptions(options);
  const birth = parseCivilDate(birthDate, resolved);
  assertNotFuture(birth, resolved);

  switch (unit) {
    case 'years':
      return westernYears(birth, resolved);
    case 'months': {
      const { years, months } = breakdown(birth, resolved);
      return years * 12 + months;
    }
    case 'weeks':
      return Math.trunc(daysBetween(birth, resolved.today) / 7);
    case 'days':
      return daysBetween(birth, resolved.today);
    default: {
      // Por debajo del día ya no basta el calendario: hay que bajar a
      // instantes reales para que los cambios de horario de verano cuenten.
      const from = instantFromZoned(birth, resolved.timeZone);
      const to = instantFromZoned(resolved.today, resolved.timeZone);
      const seconds = Math.trunc((to - from) / 1000);
      if (unit === 'seconds') return seconds;
      if (unit === 'minutes') return Math.trunc(seconds / 60);
      return Math.trunc(seconds / 3600);
    }
  }
}

/** ¿Hoy es el cumpleaños, en la zona horaria indicada? */
export function isBirthdayToday(birthDate: DateInput, options: AgeOptions = {}): boolean {
  const resolved = resolveOptions(options);
  const birth = parseCivilDate(birthDate, resolved);
  const anniversary = birthdayInYear(birth, resolved.today.year, resolved.leapDayRule);
  return compareCivil(anniversary, resolved.today) === 0;
}

/** Próximo cumpleaños: fecha, días restantes, edad que cumple y día de la semana. */
export function getNextBirthday(
  birthDate: DateInput,
  options: AgeOptions = {},
): NextBirthday {
  const resolved = resolveOptions(options);
  const birth = parseCivilDate(birthDate, resolved);
  assertNotFuture(birth, resolved);

  const { today, leapDayRule } = resolved;
  let next = birthdayInYear(birth, today.year, leapDayRule);
  if (compareCivil(next, today) < 0) {
    next = birthdayInYear(birth, today.year + 1, leapDayRule);
  }

  const daysUntil = daysBetween(today, next);
  return {
    date: toISODate(next),
    daysUntil,
    turningAge: next.year - birth.year,
    weekday: weekdayOf(next),
    isToday: daysUntil === 0,
  };
}

/** Días que faltan para el próximo cumpleaños; `0` si es hoy. */
export function daysUntilNextBirthday(
  birthDate: DateInput,
  options: AgeOptions = {},
): number {
  return getNextBirthday(birthDate, options).daysUntil;
}

/** Informe completo en una sola pasada, sin recalcular la fecha de referencia. */
export function getAgeDetails(
  birthDate: DateInput,
  options: AgeOptions = {},
): AgeDetails {
  const resolved = resolveOptions(options);
  const birth = parseCivilDate(birthDate, resolved);
  assertNotFuture(birth, resolved);

  const { today, leapDayRule } = resolved;
  const parts = breakdown(birth, resolved);
  const totalDays = daysBetween(birth, today);

  let next = birthdayInYear(birth, today.year, leapDayRule);
  if (compareCivil(next, today) < 0) {
    next = birthdayInYear(birth, today.year + 1, leapDayRule);
  }

  return {
    ...parts,
    birthDate: toISODate(birth),
    referenceDate: toISODate(today),
    timeZone: resolved.timeZone,
    totalMonths: parts.years * 12 + parts.months,
    totalWeeks: Math.trunc(totalDays / 7),
    totalDays,
    nextBirthday: toISODate(next),
    daysUntilNextBirthday: daysBetween(today, next),
    isBirthdayToday: compareCivil(next, today) === 0,
    weekdayBorn: weekdayOf(birth),
    bornOnLeapDay: birth.month === 2 && birth.day === 29,
    reckonedAge: reckon(birth, resolved),
  };
}

/**
 * Rango de fechas de nacimiento de quien tiene exactamente `age` años hoy.
 *
 * Pensado para consultas: `WHERE birth_date BETWEEN :from AND :to` es
 * indexable, mientras que calcular la edad de cada fila no lo es.
 */
export function getBirthDateRange(age: number, options: AgeOptions = {}): BirthDateRange {
  if (!Number.isInteger(age) || age < 0) {
    throw new RangeError(`La edad debe ser un entero no negativo; se recibió ${age}.`);
  }
  const { today } = resolveOptions(options);
  return {
    from: toISODate(addDays(addYears(today, -(age + 1)), 1)),
    to: toISODate(addYears(today, -age)),
  };
}

/**
 * Comparador para `Array#sort`: ordena de mayor a menor edad, es decir, de la
 * fecha de nacimiento más antigua a la más reciente.
 */
export function compareByAge(
  a: DateInput,
  b: DateInput,
  options: AgeOptions = {},
): number {
  const resolved = resolveOptions({ ...options, allowFuture: true });
  return compareCivil(parseCivilDate(a, resolved), parseCivilDate(b, resolved));
}

/** Normaliza cualquier entrada admitida a una fecha ISO `YYYY-MM-DD`. */
export function toISO(birthDate: DateInput, options: AgeOptions = {}): string {
  const resolved = resolveOptions({ ...options, allowFuture: true });
  return toISODate(parseCivilDate(birthDate, resolved));
}

/** Convierte una entrada admitida a un `Date` en la medianoche de la zona dada. */
export function toDate(birthDate: DateInput, options: AgeOptions = {}): Date {
  const resolved = resolveOptions({ ...options, allowFuture: true });
  const civil = parseCivilDate(birthDate, resolved);
  return new Date(instantFromZoned(civil, resolved.timeZone));
}
