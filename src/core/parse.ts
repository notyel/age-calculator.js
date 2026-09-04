// src/core/parse.ts
//
// Conversión de cualquier entrada admitida a una fecha civil. El punto clave y
// la razón de que este módulo exista: `new Date("1990-05-25")` interpreta la
// cadena como medianoche UTC, mientras que `new Date()` es local. Restarlas
// devuelve un día de menos en todo el continente americano y un día de más en
// Asia y Oceanía. Aquí las cadenas de sólo fecha se tratan como lo que son:
// una fecha de calendario, sin instante ni zona asociada.

import { InvalidDateError } from '../errors.js';
import type { CivilDate, DateInput, DateOrder } from '../types.js';
import { civilDateInZone, isValidCivilDate } from './calendar.js';

/** Sólo fecha: `1990-05-25`, `+001990-05-25`, `-000044-03-15`. */
const ISO_DATE_ONLY = /^([+-]\d{6}|\d{4})-(\d{2})-(\d{2})$/;

/** Fecha con hora: se delega en `Date.parse`, que la define el estándar. */
const ISO_DATE_TIME = /^([+-]\d{6}|\d{4})-\d{2}-\d{2}[T ]\d{2}:\d{2}/;

/** Formato regional numérico: `25/05/1990`, `25-5-1990`, `1990.05.25`. */
const NUMERIC_PARTS = /^(\d{1,6})\s*[/.\-\s]\s*(\d{1,2})\s*[/.\-\s]\s*(\d{1,6})$/;

/** Formato con nombre de mes: `25 de mayo de 1990`, `May 25, 1990`, `25 May 1990`. */
const HAS_LETTERS = /\p{L}{3,}/u;

const orderCache = new Map<string, DateOrder>();
const monthNameCache = new Map<string, Map<string, number>>();

/**
 * Deduce el orden de día/mes/año del formato corto de un locale.
 *
 * Es lo que separa `03/04/2020` = 3 de abril en `es-ES` de 4 de marzo en
 * `en-US`. Sin esta desambiguación, cualquier librería que acepte fechas
 * cortas se equivoca en la mitad del mundo.
 */
export function detectDateOrder(locale?: string): DateOrder {
  const key = locale ?? '';
  const cached = orderCache.get(key);
  if (cached) return cached;

  let order: DateOrder = 'YMD';
  try {
    const parts = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      timeZone: 'UTC',
    }).formatToParts(new Date(Date.UTC(2000, 0, 2)));

    const sequence = parts
      .filter((p) => p.type === 'year' || p.type === 'month' || p.type === 'day')
      .map((p) => p.type[0]!.toUpperCase())
      .join('');

    if (sequence === 'DMY' || sequence === 'MDY' || sequence === 'YMD') {
      order = sequence;
    }
  } catch {
    // Locale desconocido: se queda el orden ISO, que nunca es ambiguo.
  }

  orderCache.set(key, order);
  return order;
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\.$/, '')
    .toLowerCase();
}

/** Índice de nombres de mes (largos y cortos) del locale hacia su número 1-12. */
function monthNames(locale?: string): Map<string, number> {
  const key = locale ?? '';
  const cached = monthNameCache.get(key);
  if (cached) return cached;

  const index = new Map<string, number>();
  for (const style of ['long', 'short'] as const) {
    let fmt: Intl.DateTimeFormat;
    try {
      fmt = new Intl.DateTimeFormat(locale, { month: style, timeZone: 'UTC' });
    } catch {
      continue;
    }
    for (let month = 1; month <= 12; month++) {
      const name = fmt.format(new Date(Date.UTC(2000, month - 1, 15)));
      // Algunos locales devuelven el número del mes en vez de un nombre.
      if (HAS_LETTERS.test(name)) index.set(normalize(name), month);
    }
  }

  monthNameCache.set(key, index);
  return index;
}

function build(year: number, month: number, day: number, input: unknown): CivilDate {
  const date = { year, month, day };
  if (!isValidCivilDate(date)) {
    throw new InvalidDateError(
      input,
      `El día ${day}/${month}/${year} no existe en el calendario.`,
    );
  }
  return date;
}

/**
 * Expande un año de dos cifras con la ventana deslizante habitual: se asume
 * que una fecha de nacimiento no es futura, así que `25` es 2025 pero `99` es
 * 1999.
 */
function expandTwoDigitYear(year: number, currentYear: number): number {
  const century = Math.floor(currentYear / 100) * 100;
  const candidate = century + year;
  return candidate > currentYear ? candidate - 100 : candidate;
}

function parseWithMonthName(
  text: string,
  locale: string | undefined,
  input: unknown,
  currentYear: number,
): CivilDate {
  const index = monthNames(locale);
  const tokens = text.split(/[\s,./\-]+/u).filter(Boolean);

  let month: number | undefined;
  const numbers: number[] = [];

  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      numbers.push(Number(token));
      continue;
    }
    const found = index.get(normalize(token));
    if (found !== undefined && month === undefined) month = found;
  }

  if (month === undefined || numbers.length < 2) {
    throw new InvalidDateError(input, 'No se reconoció el nombre del mes.');
  }

  // El componente de cuatro cifras es el año; si no lo hay, el último de los dos.
  let yearIdx = numbers.findIndex((n) => n > 31);
  if (yearIdx === -1) yearIdx = numbers.length - 1;
  const rawYear = numbers[yearIdx]!;
  const day = numbers[yearIdx === 0 ? 1 : 0]!;
  const year = rawYear < 100 ? expandTwoDigitYear(rawYear, currentYear) : rawYear;

  return build(year, month, day, input);
}

function parseNumericString(
  text: string,
  order: DateOrder,
  input: unknown,
  currentYear: number,
): CivilDate {
  const match = NUMERIC_PARTS.exec(text);
  if (!match) throw new InvalidDateError(input);

  const a = Number(match[1]);
  const b = Number(match[2]);
  const c = Number(match[3]);
  let year: number;
  let month: number;
  let day: number;

  // Un primer componente de cuatro cifras es inequívocamente el año, sea cual
  // sea el orden que sugiera el locale.
  if (match[1]!.length >= 4 || order === 'YMD') {
    [year, month, day] = [a, b, c];
  } else if (order === 'MDY') {
    [month, day, year] = [a, b, c];
  } else {
    [day, month, year] = [a, b, c];
  }

  // Red de seguridad: si el "mes" no puede serlo pero el "día" sí, van cambiados.
  if (month > 12 && day <= 12) [day, month] = [month, day];
  if (year < 100) year = expandTwoDigitYear(year, currentYear);

  return build(year, month, day, input);
}

/** Opciones que necesita el parseo; subconjunto de `AgeOptions` ya resuelto. */
export interface ParseContext {
  timeZone: string;
  locale?: string;
  dateOrder?: DateOrder;
  /** Año usado para expandir años de dos cifras. */
  currentYear?: number;
}

/**
 * Convierte cualquier entrada admitida en una fecha civil.
 *
 * Las cadenas de sólo fecha se toman literalmente. Los instantes (timestamp,
 * `Date`, ISO con hora) se proyectan sobre `timeZone`, porque el día que se
 * vive en ese instante depende del huso.
 */
export function parseCivilDate(input: DateInput, context: ParseContext): CivilDate {
  if (input == null) throw new InvalidDateError(input);

  if (typeof input === 'object' && !(input instanceof Date)) {
    const { year, month, day } = input;
    return build(year, month, day, input);
  }

  if (input instanceof Date) {
    const time = input.getTime();
    if (Number.isNaN(time)) {
      throw new InvalidDateError(input, 'El objeto Date es "Invalid Date".');
    }
    return civilDateInZone(time, context.timeZone);
  }

  if (typeof input === 'number') {
    if (!Number.isFinite(input)) throw new InvalidDateError(input);
    return civilDateInZone(input, context.timeZone);
  }

  const text = input.trim();
  if (!text) throw new InvalidDateError(input, 'La cadena está vacía.');

  const isoOnly = ISO_DATE_ONLY.exec(text);
  if (isoOnly) {
    return build(Number(isoOnly[1]), Number(isoOnly[2]), Number(isoOnly[3]), input);
  }

  if (ISO_DATE_TIME.test(text)) {
    const time = Date.parse(text);
    if (Number.isNaN(time)) throw new InvalidDateError(input);
    // Sin desfase explícito la cadena designa una hora local; el instante ya
    // quedó fijado por `Date.parse`, así que basta proyectarlo sobre la zona.
    return civilDateInZone(time, context.timeZone);
  }

  const currentYear =
    context.currentYear ?? civilDateInZone(Date.now(), context.timeZone).year;

  if (HAS_LETTERS.test(text)) {
    return parseWithMonthName(text, context.locale, input, currentYear);
  }

  const order = context.dateOrder ?? detectDateOrder(context.locale);
  return parseNumericString(text, order, input, currentYear);
}
