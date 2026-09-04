// src/core/legal.ts

import type { AgeOptions, DateInput, LegalStatus } from '../types.js';
import { ageOfMajorityFor } from '../data/majority.js';
import { addYears, compareCivil, daysBetween, toISODate } from './calendar.js';
import { resolveOptions } from './options.js';
import { parseCivilDate } from './parse.js';
import { calculateAge } from './age.js';

/** Opciones de {@link getLegalStatus} y {@link isAdult}. */
export interface LegalOptions extends AgeOptions {
  /**
   * Jurisdicción ISO: `'CO'`, `'ES'`, `'US-AL'`, `'GB-SCT'`. Por defecto `'US'`
   * salvo que se deduzca del `locale`.
   */
  country?: string;
  /**
   * Umbral explícito en años. Tiene prioridad sobre la tabla por país; úsalo
   * para edades distintas de la mayoría civil (voto, conducción, contrato).
   */
  ageOfMajority?: number;
}

/** Región del locale (`'es-CO'` → `'CO'`), si la trae. */
function regionFromLocale(locale?: string): string | undefined {
  if (!locale) return undefined;
  try {
    return new Intl.Locale(locale).maximize().region ?? undefined;
  } catch {
    const parts = locale.split(/[-_]/);
    return parts.length > 1 ? parts[parts.length - 1]!.toUpperCase() : undefined;
  }
}

/**
 * Fecha exacta en la que se cumple una edad determinada.
 *
 * @example
 * getDateAtAge('2010-03-15', 18); // "2028-03-15"
 */
export function getDateAtAge(
  birthDate: DateInput,
  age: number,
  options: AgeOptions = {},
): string {
  const resolved = resolveOptions({ ...options, allowFuture: true });
  const birth = parseCivilDate(birthDate, resolved);
  return toISODate(addYears(birth, age));
}

/**
 * Situación respecto a la mayoría de edad de una jurisdicción.
 *
 * La tabla que respalda esto es informativa, no asesoría legal: consulta
 * {@link ../data/majority.ts} y sustitúyela con `ageOfMajority` si tu caso lo
 * exige.
 *
 * @example
 * getLegalStatus('2008-07-01', { country: 'CO' });
 * getLegalStatus('2008-07-01', { country: 'US-AL' });   // 19 años en Alabama
 * getLegalStatus('2008-07-01', { ageOfMajority: 16 });  // umbral a medida
 */
export function getLegalStatus(
  birthDate: DateInput,
  options: LegalOptions = {},
): LegalStatus {
  const resolved = resolveOptions(options);
  const birth = parseCivilDate(birthDate, resolved);

  const country = options.country ?? regionFromLocale(options.locale) ?? 'US';
  const threshold = options.ageOfMajority ?? ageOfMajorityFor(country);

  const majority = addYears(birth, threshold);
  const reached = compareCivil(majority, resolved.today) <= 0;

  return {
    country: country.toUpperCase(),
    ageOfMajority: threshold,
    age: calculateAge(birthDate, { ...options, allowFuture: true }),
    isAdult: reached,
    majorityDate: toISODate(majority),
    daysUntilMajority: reached ? 0 : daysBetween(resolved.today, majority),
  };
}

/** Atajo booleano de {@link getLegalStatus}. */
export function isAdult(birthDate: DateInput, options: LegalOptions = {}): boolean {
  return getLegalStatus(birthDate, options).isAdult;
}

/** ¿Tiene al menos `age` años cumplidos? Útil para vallas de edad (age gates). */
export function isAtLeast(
  birthDate: DateInput,
  age: number,
  options: AgeOptions = {},
): boolean {
  return calculateAge(birthDate, { ...options, allowFuture: true }) >= age;
}
