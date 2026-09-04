// src/core/calculator.ts

import type {
  AgeBreakdown,
  AgeDetails,
  AgeOptions,
  AgeUnit,
  BirthDateRange,
  ChineseZodiac,
  DateInput,
  LegalStatus,
  NextBirthday,
  ZodiacSign,
} from '../types.js';
import {
  calculateAge,
  compareByAge,
  daysUntilNextBirthday,
  getAgeAt,
  getAgeBreakdown,
  getAgeDetails,
  getAgeIn,
  getBirthDateRange,
  getNextBirthday,
  isBirthdayToday,
  toDate,
  toISO,
} from './age.js';
import {
  formatAge,
  formatBirthDate,
  formatTimeToNextBirthday,
  type FormatAgeOptions,
  type FormatDateOptions,
} from './format.js';
import { getDateAtAge, getLegalStatus, isAdult, isAtLeast, type LegalOptions } from './legal.js';
import {
  getChineseZodiac,
  getGeneration,
  getLifeStage,
  getZodiacSign,
  type GenerationId,
  type LifeStage,
} from './extras.js';

/**
 * Calculadora con opciones fijas.
 *
 * Toda la API funcional acepta las mismas opciones en cada llamada, lo que se
 * vuelve repetitivo en una aplicación que siempre trabaja con la misma zona
 * horaria y el mismo idioma. Esta clase las guarda una vez.
 *
 * @example
 * const co = new AgeCalculator({ timeZone: 'America/Bogota', locale: 'es-CO' });
 * co.age('25/05/1990');       // parsea en formato colombiano
 * co.format('25/05/1990');    // "35 años"
 * co.isAdult('2010-01-01');   // mayoría de edad colombiana
 */
export class AgeCalculator {
  /** Opciones que se aplican a cada llamada, salvo que se sobreescriban. */
  readonly defaults: Readonly<AgeOptions & LegalOptions>;

  constructor(defaults: AgeOptions & LegalOptions = {}) {
    this.defaults = Object.freeze({ ...defaults });
  }

  /** Nueva calculadora con las opciones actuales más las indicadas. */
  with(options: AgeOptions & LegalOptions): AgeCalculator {
    return new AgeCalculator({ ...this.defaults, ...options });
  }

  private merge<T extends AgeOptions>(options?: T): T {
    return { ...this.defaults, ...options } as T;
  }

  /** @see {@link calculateAge} */
  age(birthDate: DateInput, options?: AgeOptions): number {
    return calculateAge(birthDate, this.merge(options));
  }

  /** @see {@link getAgeAt} */
  ageAt(birthDate: DateInput, referenceDate: DateInput, options?: AgeOptions): number {
    return getAgeAt(birthDate, referenceDate, this.merge(options));
  }

  /** @see {@link getAgeBreakdown} */
  breakdown(birthDate: DateInput, options?: AgeOptions): AgeBreakdown {
    return getAgeBreakdown(birthDate, this.merge(options));
  }

  /** @see {@link getAgeIn} */
  in(birthDate: DateInput, unit: AgeUnit, options?: AgeOptions): number {
    return getAgeIn(birthDate, unit, this.merge(options));
  }

  /** @see {@link getAgeDetails} */
  details(birthDate: DateInput, options?: AgeOptions): AgeDetails {
    return getAgeDetails(birthDate, this.merge(options));
  }

  /** @see {@link getNextBirthday} */
  nextBirthday(birthDate: DateInput, options?: AgeOptions): NextBirthday {
    return getNextBirthday(birthDate, this.merge(options));
  }

  /** @see {@link daysUntilNextBirthday} */
  daysToBirthday(birthDate: DateInput, options?: AgeOptions): number {
    return daysUntilNextBirthday(birthDate, this.merge(options));
  }

  /** @see {@link isBirthdayToday} */
  isBirthdayToday(birthDate: DateInput, options?: AgeOptions): boolean {
    return isBirthdayToday(birthDate, this.merge(options));
  }

  /** @see {@link getBirthDateRange} */
  birthDateRange(age: number, options?: AgeOptions): BirthDateRange {
    return getBirthDateRange(age, this.merge(options));
  }

  /** @see {@link formatAge} */
  format(birthDate: DateInput, options?: FormatAgeOptions): string {
    return formatAge(birthDate, this.merge(options));
  }

  /** @see {@link formatBirthDate} */
  formatDate(birthDate: DateInput, options?: FormatDateOptions): string {
    return formatBirthDate(birthDate, this.merge(options));
  }

  /** @see {@link formatTimeToNextBirthday} */
  formatTimeToBirthday(birthDate: DateInput, options?: AgeOptions): string {
    return formatTimeToNextBirthday(birthDate, this.merge(options));
  }

  /** @see {@link getLegalStatus} */
  legalStatus(birthDate: DateInput, options?: LegalOptions): LegalStatus {
    return getLegalStatus(birthDate, this.merge(options));
  }

  /** @see {@link isAdult} */
  isAdult(birthDate: DateInput, options?: LegalOptions): boolean {
    return isAdult(birthDate, this.merge(options));
  }

  /** @see {@link isAtLeast} */
  isAtLeast(birthDate: DateInput, age: number, options?: AgeOptions): boolean {
    return isAtLeast(birthDate, age, this.merge(options));
  }

  /** @see {@link getDateAtAge} */
  dateAtAge(birthDate: DateInput, age: number, options?: AgeOptions): string {
    return getDateAtAge(birthDate, age, this.merge(options));
  }

  /** @see {@link getZodiacSign} */
  zodiac(birthDate: DateInput, options?: AgeOptions): ZodiacSign {
    return getZodiacSign(birthDate, this.merge(options));
  }

  /** @see {@link getChineseZodiac} */
  chineseZodiac(birthDate: DateInput, options?: AgeOptions): ChineseZodiac {
    return getChineseZodiac(birthDate, this.merge(options));
  }

  /** @see {@link getGeneration} */
  generation(
    birthDate: DateInput,
    options?: AgeOptions,
  ): { id: GenerationId; label: string; birthYear: number } {
    return getGeneration(birthDate, this.merge(options));
  }

  /** @see {@link getLifeStage} */
  lifeStage(birthDate: DateInput, options?: AgeOptions): LifeStage {
    return getLifeStage(birthDate, this.merge(options));
  }

  /** @see {@link toISO} */
  toISO(birthDate: DateInput, options?: AgeOptions): string {
    return toISO(birthDate, this.merge(options));
  }

  /** @see {@link toDate} */
  toDate(birthDate: DateInput, options?: AgeOptions): Date {
    return toDate(birthDate, this.merge(options));
  }

  /** Ordena una lista de fechas de nacimiento de mayor a menor edad. */
  sortByAge<T extends DateInput>(dates: readonly T[], options?: AgeOptions): T[] {
    const merged = this.merge(options);
    return [...dates].sort((a, b) => compareByAge(a, b, merged));
  }
}
