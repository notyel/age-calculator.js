// src/core/calendar.ts
//
// Aritmética de calendario "civil" (año/mes/día sin hora). La edad es una
// cuenta de calendario, no una resta de milisegundos: hacerlo con timestamps
// produce errores en los cambios de horario de verano y en los husos con
// desfase de media hora. Todo el módulo trabaja sobre días enteros y sólo baja
// a instantes reales cuando hace falta (unidades menores que el día).

import { InvalidTimeZoneError } from '../errors.js';
import type { CivilDate } from '../types.js';

const MS_PER_DAY = 86_400_000;

/** Milisegundos en un día. Exportado por conveniencia del consumidor. */
export const MILLISECONDS_PER_DAY = MS_PER_DAY;

/** ¿Es `year` bisiesto en el calendario gregoriano proléptico? */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Número de días del mes `month` (1-12) del año `year`. */
export function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return month === 4 || month === 6 || month === 9 || month === 11 ? 30 : 31;
}

/** ¿Los tres componentes forman una fecha real del calendario? */
export function isValidCivilDate(date: CivilDate): boolean {
  const { year, month, day } = date;
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }
  if (month < 1 || month > 12) return false;
  return day >= 1 && day <= daysInMonth(year, month);
}

/**
 * Días transcurridos desde 1970-01-01. Se apoya en `Date` en UTC, donde todos
 * los días duran exactamente 24 h, así que la conversión es exacta.
 */
export function toEpochDay(date: CivilDate): number {
  const d = new Date(0);
  d.setUTCFullYear(date.year, date.month - 1, date.day);
  d.setUTCHours(0, 0, 0, 0);
  return Math.round(d.getTime() / MS_PER_DAY);
}

/** Inverso de {@link toEpochDay}. */
export function fromEpochDay(epochDay: number): CivilDate {
  const d = new Date(epochDay * MS_PER_DAY);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** Día de la semana de una fecha civil: 0 = domingo … 6 = sábado. */
export function weekdayOf(date: CivilDate): number {
  // El día epoch 0 (1970-01-01) fue jueves, que es el índice 4.
  return (((toEpochDay(date) + 4) % 7) + 7) % 7;
}

/** Serializa a ISO `YYYY-MM-DD`, con años fuera de rango en formato extendido. */
export function toISODate(date: CivilDate): string {
  const { year, month, day } = date;
  const y =
    year >= 0 && year <= 9999
      ? String(year).padStart(4, '0')
      : (year < 0 ? '-' : '+') + String(Math.abs(year)).padStart(6, '0');
  return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Orden natural entre fechas civiles: negativo, cero o positivo. */
export function compareCivil(a: CivilDate, b: CivilDate): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}

/** Suma (o resta, con valores negativos) días de calendario. */
export function addDays(date: CivilDate, days: number): CivilDate {
  return fromEpochDay(toEpochDay(date) + days);
}

/**
 * Suma meses recortando el día al último del mes destino, que es la convención
 * de toda la industria: 31 de enero + 1 mes = 28/29 de febrero.
 */
export function addMonths(date: CivilDate, months: number): CivilDate {
  const total = date.year * 12 + (date.month - 1) + months;
  const year = Math.floor(total / 12);
  const month = (((total % 12) + 12) % 12) + 1;
  return { year, month, day: Math.min(date.day, daysInMonth(year, month)) };
}

/** Suma años recortando el 29 de febrero al 28 cuando el destino no es bisiesto. */
export function addYears(date: CivilDate, years: number): CivilDate {
  return addMonths(date, years * 12);
}

/** Días completos entre dos fechas civiles (`to - from`). */
export function daysBetween(from: CivilDate, to: CivilDate): number {
  return toEpochDay(to) - toEpochDay(from);
}

// --- Puente con zonas horarias ----------------------------------------------

const partsFormatterCache = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  let fmt = partsFormatterCache.get(timeZone);
  if (!fmt) {
    try {
      fmt = new Intl.DateTimeFormat('en-US-u-ca-gregory', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
        era: 'short',
      });
    } catch {
      throw new InvalidTimeZoneError(timeZone);
    }
    partsFormatterCache.set(timeZone, fmt);
  }
  return fmt;
}

/** ¿El entorno reconoce esta zona horaria IANA? */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    partsFormatter(timeZone);
    return true;
  } catch {
    return false;
  }
}

/** Zona horaria del sistema, con `'UTC'` como último recurso. */
export function systemTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

interface ZonedParts extends CivilDate {
  hour: number;
  minute: number;
  second: number;
}

function zonedParts(instant: number, timeZone: string): ZonedParts {
  const parts = partsFormatter(timeZone).formatToParts(new Date(instant));
  const bag: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') bag[part.type] = part.value;
  }
  const year = Number(bag['year']);
  return {
    // `era` viene como "BC"/"AD"; el año 1 a.C. es el año 0 astronómico.
    year: bag['era'] === 'B' || bag['era'] === 'BC' ? 1 - year : year,
    month: Number(bag['month']),
    day: Number(bag['day']),
    hour: Number(bag['hour']) % 24,
    minute: Number(bag['minute']),
    second: Number(bag['second']),
  };
}

/** La fecha de calendario que se vive en `timeZone` en un instante dado. */
export function civilDateInZone(instant: number, timeZone: string): CivilDate {
  const { year, month, day } = zonedParts(instant, timeZone);
  return { year, month, day };
}

/** Desfase de la zona respecto a UTC, en milisegundos, en un instante dado. */
function zoneOffsetMs(instant: number, timeZone: string): number {
  const p = zonedParts(instant, timeZone);
  const asUTC = new Date(0);
  asUTC.setUTCFullYear(p.year, p.month - 1, p.day);
  asUTC.setUTCHours(p.hour, p.minute, p.second, 0);
  // Los milisegundos no se formatean, así que se recuperan del instante original.
  return asUTC.getTime() - (instant - (((instant % 1000) + 1000) % 1000));
}

/**
 * Instante UTC correspondiente a una hora local de la zona indicada.
 *
 * Resuelve el desfase en dos pasadas para acertar también en los saltos de
 * horario de verano, donde el desfase del instante estimado y el del real no
 * coinciden.
 */
export function instantFromZoned(
  date: CivilDate,
  timeZone: string,
  hour = 0,
  minute = 0,
  second = 0,
): number {
  const naive = new Date(0);
  naive.setUTCFullYear(date.year, date.month - 1, date.day);
  naive.setUTCHours(hour, minute, second, 0);
  const guess = naive.getTime();

  const firstOffset = zoneOffsetMs(guess, timeZone);
  const candidate = guess - firstOffset;
  const secondOffset = zoneOffsetMs(candidate, timeZone);
  return firstOffset === secondOffset ? candidate : guess - secondOffset;
}
