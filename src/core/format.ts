// src/core/format.ts
//
// Todo el formateo se delega en `Intl`, que ya viene en Node y en el navegador
// con los datos CLDR completos. La librería no lleva ni una sola cadena
// traducida a mano: pedirle "35 años" en catalán o en japonés funciona sin que
// nadie tenga que mantener un diccionario.

import type { AgeBreakdown, AgeOptions, DateInput } from '../types.js';
import { getAgeBreakdown, getNextBirthday } from './age.js';
import { resolveOptions } from './options.js';
import { parseCivilDate } from './parse.js';
import { instantFromZoned } from './calendar.js';

/** Opciones de presentación de {@link formatAge}. */
export interface FormatAgeOptions extends AgeOptions {
  /**
   * Qué partes mostrar. `'years'` da "35 años"; `'full'` da
   * "35 años, 3 meses y 10 días". Por defecto `'years'`.
   */
  precision?: 'years' | 'years-months' | 'full';
  /** Longitud del nombre de la unidad, como en `Intl.NumberFormat`. */
  unitDisplay?: 'long' | 'short' | 'narrow';
  /** Incluir las partes que valen cero. Por defecto `false`. */
  includeZero?: boolean;
}

type CountUnit = 'year' | 'month' | 'day';

function formatUnit(
  value: number,
  unit: CountUnit,
  locale: string | undefined,
  unitDisplay: 'long' | 'short' | 'narrow',
): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay }).format(value);
  } catch {
    // Entornos sin datos de unidades (algún Node compilado con small-icu).
    return `${value} ${unit}${value === 1 ? '' : 's'}`;
  }
}

function joinParts(parts: string[], locale: string | undefined): string {
  if (parts.length <= 1) return parts[0] ?? '';
  try {
    return new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(parts);
  } catch {
    return parts.join(', ');
  }
}

/**
 * Edad en texto, en el idioma que se pida.
 *
 * @example
 * formatAge('1990-05-25', { locale: 'es-CO' });                      // "35 años"
 * formatAge('1990-05-25', { locale: 'en-US', precision: 'full' });   // "35 years, 3 months and 10 days"
 * formatAge('1990-05-25', { locale: 'ja-JP', precision: 'full' });   // "35 年、3 か月、10 日"
 */
export function formatAge(birthDate: DateInput, options: FormatAgeOptions = {}): string {
  const { precision = 'years', unitDisplay = 'long', includeZero = false, locale } = options;
  const age = getAgeBreakdown(birthDate, options);

  const wanted: Array<[number, CountUnit]> =
    precision === 'years'
      ? [[age.years, 'year']]
      : precision === 'years-months'
        ? [
            [age.years, 'year'],
            [age.months, 'month'],
          ]
        : [
            [age.years, 'year'],
            [age.months, 'month'],
            [age.days, 'day'],
          ];

  const parts = wanted
    .filter(([value], i) => includeZero || value !== 0 || (i === 0 && wanted.length === 1))
    .map(([value, unit]) => formatUnit(value, unit, locale, unitDisplay));

  return parts.length > 0 ? joinParts(parts, locale) : formatUnit(0, 'year', locale, unitDisplay);
}

/** Formatea un desglose ya calculado, sin volver a calcularlo. */
export function formatBreakdown(
  age: AgeBreakdown,
  options: Pick<FormatAgeOptions, 'locale' | 'unitDisplay' | 'includeZero'> = {},
): string {
  const { locale, unitDisplay = 'long', includeZero = false } = options;
  const parts = ([
    [age.years, 'year'],
    [age.months, 'month'],
    [age.days, 'day'],
  ] as Array<[number, CountUnit]>)
    .filter(([value]) => includeZero || value !== 0)
    .map(([value, unit]) => formatUnit(value, unit, locale, unitDisplay));

  return parts.length > 0 ? joinParts(parts, locale) : formatUnit(0, 'day', locale, unitDisplay);
}

/** Opciones de {@link formatBirthDate}. */
export interface FormatDateOptions extends AgeOptions {
  /** Estilo de fecha de `Intl.DateTimeFormat`. Por defecto `'long'`. */
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  /**
   * Calendario con el que mostrarla: `'gregory'`, `'islamic-umalqura'`,
   * `'hebrew'`, `'japanese'`, `'buddhist'`, `'persian'`, `'chinese'`, `'indian'`…
   * El cálculo de la edad sigue siendo gregoriano; esto sólo cambia cómo se
   * escribe la fecha.
   */
  calendar?: string;
}

/**
 * Escribe una fecha de nacimiento en el idioma y el calendario que se pidan.
 *
 * @example
 * formatBirthDate('1990-05-25', { locale: 'es-ES' });
 * // "25 de mayo de 1990"
 * formatBirthDate('1990-05-25', { locale: 'ar-SA', calendar: 'islamic-umalqura' });
 * // "١ ذو القعدة ١٤١٠ هـ"
 */
export function formatBirthDate(
  birthDate: DateInput,
  options: FormatDateOptions = {},
): string {
  const resolved = resolveOptions({ ...options, allowFuture: true });
  const civil = parseCivilDate(birthDate, resolved);
  // Se formatea al mediodía UTC para que ningún desfase de huso corra el día.
  const instant = new Date(instantFromZoned(civil, 'UTC', 12));

  const locale = options.calendar
    ? `${options.locale ?? 'en'}-u-ca-${options.calendar}`
    : options.locale;

  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: options.dateStyle ?? 'long',
      timeZone: 'UTC',
    }).format(instant);
  } catch {
    return instant.toISOString().slice(0, 10);
  }
}

/**
 * Cuánto falta para el próximo cumpleaños, en lenguaje natural.
 *
 * @example
 * formatTimeToNextBirthday('1990-05-25', { locale: 'es' }); // "dentro de 3 meses"
 */
export function formatTimeToNextBirthday(
  birthDate: DateInput,
  options: AgeOptions & { numeric?: 'always' | 'auto' } = {},
): string {
  const { daysUntil } = getNextBirthday(birthDate, options);

  try {
    const rtf = new Intl.RelativeTimeFormat(options.locale, {
      numeric: options.numeric ?? 'auto',
    });
    if (daysUntil === 0) return rtf.format(0, 'day');
    if (daysUntil < 31) return rtf.format(daysUntil, 'day');
    if (daysUntil < 365) return rtf.format(Math.round(daysUntil / 30.44), 'month');
    return rtf.format(Math.round(daysUntil / 365.25), 'year');
  } catch {
    return `${daysUntil} d`;
  }
}

/** Nombre del día de la semana (0 = domingo … 6 = sábado) en el locale dado. */
export function formatWeekday(
  weekday: number,
  options: { locale?: string; style?: 'long' | 'short' | 'narrow' } = {},
): string {
  // 1970-01-04 fue domingo, así que sirve de origen para el índice 0.
  const sample = new Date(Date.UTC(1970, 0, 4 + (((weekday % 7) + 7) % 7)));
  try {
    return new Intl.DateTimeFormat(options.locale, {
      weekday: options.style ?? 'long',
      timeZone: 'UTC',
    }).format(sample);
  } catch {
    return String(weekday);
  }
}
