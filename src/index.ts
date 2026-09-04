// src/index.ts
//
// Punto de entrada público. `calculateAge` mantiene la firma de la versión 1
// —una cadena de fecha, un número de vuelta— para que actualizar no rompa nada;
// el resto del API es nuevo.

export {
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
  birthdayInYear,
  toDate,
  toISO,
} from './core/age.js';

export {
  formatAge,
  formatBreakdown,
  formatBirthDate,
  formatTimeToNextBirthday,
  formatWeekday,
  type FormatAgeOptions,
  type FormatDateOptions,
} from './core/format.js';

export {
  getDateAtAge,
  getLegalStatus,
  isAdult,
  isAtLeast,
  type LegalOptions,
} from './core/legal.js';

export {
  getChineseZodiac,
  getGeneration,
  getLifeStage,
  getZodiacSign,
  type GenerationId,
  type LifeStage,
} from './core/extras.js';

export { AgeCalculator } from './core/calculator.js';

export {
  addDays,
  addMonths,
  addYears,
  compareCivil,
  civilDateInZone,
  daysBetween,
  daysInMonth,
  isLeapYear,
  isValidCivilDate,
  isValidTimeZone,
  systemTimeZone,
  toISODate,
  weekdayOf,
} from './core/calendar.js';

export { detectDateOrder } from './core/parse.js';

export { AGE_OF_MAJORITY, DEFAULT_AGE_OF_MAJORITY, ageOfMajorityFor } from './data/majority.js';

export {
  AgeCalculatorError,
  FutureDateError,
  InvalidDateError,
  InvalidTimeZoneError,
} from './errors.js';

export type {
  AgeBreakdown,
  AgeDetails,
  AgeOptions,
  AgeReckoning,
  AgeUnit,
  BirthDateRange,
  ChineseZodiac,
  CivilDate,
  DateInput,
  DateOrder,
  LeapDayRule,
  LegalStatus,
  NextBirthday,
  ZodiacSign,
} from './types.js';

import { calculateAge } from './core/age.js';

/**
 * Export por defecto, para `import calculateAge from 'age-calculation-library'`.
 * El export nombrado sigue siendo la forma recomendada.
 */
export default calculateAge;
