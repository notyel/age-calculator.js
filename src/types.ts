// src/types.ts

/**
 * Valores aceptados como fecha de entrada.
 *
 * - `string`: ISO `YYYY-MM-DD`, ISO completo, o un formato regional (`25/05/1990`)
 *   siempre que se indique `locale` o `dateOrder`.
 * - `number`: timestamp en milisegundos (epoch).
 * - `Date`: instancia nativa.
 * - `CivilDate`: fecha civil sin hora ni zona horaria.
 */
export type DateInput = string | number | Date | CivilDate;

/**
 * Una fecha de calendario "civil": año, mes y día sin hora ni zona horaria
 * asociada. Es la unidad con la que trabaja internamente la librería, porque
 * la edad es una cuenta de calendario, no una diferencia de milisegundos.
 */
export interface CivilDate {
  /** Año astronómico (1990). Puede ser negativo para fechas a.C. */
  year: number;
  /** Mes 1-12 (no 0-11 como `Date#getMonth`). */
  month: number;
  /** Día del mes, 1-31. */
  day: number;
}

/** Orden de los componentes en un formato de fecha corto regional. */
export type DateOrder = 'DMY' | 'MDY' | 'YMD';

/**
 * Cómo cumple años quien nació un 29 de febrero en un año que no es bisiesto.
 *
 * - `'feb28'`: cumple el 28 de febrero (criterio de la mayoría de las
 *   legislaciones de tradición civil: España, Colombia, México, Chile...).
 * - `'mar1'`: cumple el 1 de marzo (criterio habitual en el derecho anglosajón
 *   y en varios estados de EE. UU.).
 */
export type LeapDayRule = 'feb28' | 'mar1';

/**
 * Sistema de cómputo de la edad.
 *
 * - `'western'`: la edad occidental estándar; se cumple un año en cada aniversario.
 * - `'east-asian'`: edad tradicional de Asia Oriental (세는나이 / 虚岁); se nace
 *   con 1 año y se suma otro cada 1 de enero.
 * - `'korean-year'`: edad "por año" coreana (연 나이), la usada por la ley de
 *   servicio militar y de menores: año actual − año de nacimiento.
 */
export type AgeReckoning = 'western' | 'east-asian' | 'korean-year';

/** Unidades soportadas por {@link getAgeIn}. */
export type AgeUnit =
  | 'years'
  | 'months'
  | 'weeks'
  | 'days'
  | 'hours'
  | 'minutes'
  | 'seconds';

/**
 * Opciones comunes a todo el API. Todas son opcionales: sin ninguna, la
 * librería se comporta como el entorno del usuario (zona horaria y locale del
 * sistema) y calcula la edad occidental respecto a "hoy".
 */
export interface AgeOptions {
  /**
   * Fecha "de hoy" contra la que se calcula. Por defecto, el instante actual.
   * Útil para pruebas deterministas y para calcular edades a una fecha pasada
   * o futura (edad al momento de un contrato, por ejemplo).
   */
  referenceDate?: DateInput;

  /**
   * Zona horaria IANA (`'America/Bogota'`, `'Europe/Madrid'`, `'Asia/Tokyo'`).
   * Determina qué día es "hoy". Por defecto, la del sistema.
   */
  timeZone?: string;

  /**
   * Locale BCP 47 (`'es-CO'`, `'en-US'`, `'ja-JP'`). Se usa para formatear y
   * para desambiguar fechas cortas al parsear. Por defecto, la del sistema.
   */
  locale?: string;

  /**
   * Orden explícito de los componentes al parsear cadenas ambiguas como
   * `03/04/2020`. Tiene prioridad sobre el que se deduce de `locale`.
   */
  dateOrder?: DateOrder;

  /** Criterio para los cumpleaños del 29 de febrero. Por defecto `'feb28'`. */
  leapDayRule?: LeapDayRule;

  /** Sistema de cómputo de edad. Por defecto `'western'`. */
  reckoning?: AgeReckoning;

  /**
   * Si es `true`, una fecha de nacimiento futura devuelve una edad negativa en
   * lugar de lanzar {@link FutureDateError}. Por defecto `false`.
   */
  allowFuture?: boolean;
}

/** Desglose de la edad en años, meses y días de calendario. */
export interface AgeBreakdown {
  years: number;
  months: number;
  days: number;
}

/** Resultado completo de {@link getAgeDetails}. */
export interface AgeDetails extends AgeBreakdown {
  /** Fecha de nacimiento normalizada a ISO `YYYY-MM-DD`. */
  birthDate: string;
  /** Fecha de referencia usada, en ISO `YYYY-MM-DD`. */
  referenceDate: string;
  /** Zona horaria efectiva con la que se resolvió "hoy". */
  timeZone: string;
  /** Meses completos transcurridos desde el nacimiento. */
  totalMonths: number;
  /** Semanas completas transcurridas. */
  totalWeeks: number;
  /** Días completos transcurridos. */
  totalDays: number;
  /** Próximo cumpleaños en ISO `YYYY-MM-DD`. */
  nextBirthday: string;
  /** Días que faltan para el próximo cumpleaños (`0` si es hoy). */
  daysUntilNextBirthday: number;
  /** `true` si hoy es el cumpleaños según `leapDayRule`. */
  isBirthdayToday: boolean;
  /** Día de la semana en que nació (0 = domingo … 6 = sábado). */
  weekdayBorn: number;
  /** `true` si nació un 29 de febrero. */
  bornOnLeapDay: boolean;
  /** Edad según el sistema de cómputo pedido, si difiere del occidental. */
  reckonedAge: number;
}

/** Resultado de {@link getNextBirthday}. */
export interface NextBirthday {
  /** Fecha del próximo cumpleaños en ISO `YYYY-MM-DD`. */
  date: string;
  /** Días que faltan; `0` cuando es hoy. */
  daysUntil: number;
  /** Edad que cumplirá ese día. */
  turningAge: number;
  /** Día de la semana (0 = domingo … 6 = sábado). */
  weekday: number;
  /** `true` si el cumpleaños es hoy. */
  isToday: boolean;
}

/** Rango de fechas de nacimiento que corresponde a una edad dada. */
export interface BirthDateRange {
  /** Fecha de nacimiento más antigua posible (inclusive), ISO. */
  from: string;
  /** Fecha de nacimiento más reciente posible (inclusive), ISO. */
  to: string;
}

/** Resultado de {@link getLegalStatus}. */
export interface LegalStatus {
  /** Código ISO 3166-1 alfa-2 consultado. */
  country: string;
  /** Edad de mayoría aplicable en esa jurisdicción. */
  ageOfMajority: number;
  /** Edad occidental actual de la persona. */
  age: number;
  /** `true` si ya alcanzó la mayoría de edad. */
  isAdult: boolean;
  /** Fecha ISO en la que alcanza (o alcanzó) la mayoría de edad. */
  majorityDate: string;
  /** Días que faltan para la mayoría de edad; `0` si ya la alcanzó. */
  daysUntilMajority: number;
}

/** Signo del zodiaco occidental. */
export interface ZodiacSign {
  /** Identificador estable en inglés y minúsculas: `'gemini'`. */
  id: string;
  /** Nombre localizado según el `locale` pedido. */
  name: string;
  /** Símbolo Unicode del signo. */
  symbol: string;
  /** Elemento asociado. */
  element: 'fire' | 'earth' | 'air' | 'water';
}

/** Animal del zodiaco chino con su elemento del ciclo sexagenario. */
export interface ChineseZodiac {
  /** Identificador estable en inglés: `'horse'`. */
  id: string;
  /** Nombre localizado. */
  name: string;
  /** Elemento del ciclo de cinco. */
  element: 'wood' | 'fire' | 'earth' | 'metal' | 'water';
  /** Rama terrestre en caracteres chinos. */
  branch: string;
}
