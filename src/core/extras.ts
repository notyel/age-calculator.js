// src/core/extras.ts
//
// Complementos culturales que suelen acompañar a una fecha de nacimiento.
// Todos son convenciones, no hechos: las fechas del zodiaco varían según la
// tradición y los cortes generacionales son una etiqueta periodística de
// origen estadounidense. Se documenta cuál se usa para que nadie tenga que
// deducirlo del código.

import type { AgeOptions, ChineseZodiac, DateInput, ZodiacSign } from '../types.js';
import { instantFromZoned } from './calendar.js';
import { resolveOptions } from './options.js';
import { parseCivilDate } from './parse.js';
import { calculateAge } from './age.js';

// --- Zodiaco occidental -------------------------------------------------------

interface SignSpec {
  id: string;
  /** Primer mes y día del signo (zodiaco tropical, fechas de uso corriente). */
  from: [month: number, day: number];
  symbol: string;
  element: ZodiacSign['element'];
}

const SIGNS: readonly SignSpec[] = [
  { id: 'capricorn', from: [1, 1], symbol: '♑', element: 'earth' },
  { id: 'aquarius', from: [1, 20], symbol: '♒', element: 'air' },
  { id: 'pisces', from: [2, 19], symbol: '♓', element: 'water' },
  { id: 'aries', from: [3, 21], symbol: '♈', element: 'fire' },
  { id: 'taurus', from: [4, 20], symbol: '♉', element: 'earth' },
  { id: 'gemini', from: [5, 21], symbol: '♊', element: 'air' },
  { id: 'cancer', from: [6, 21], symbol: '♋', element: 'water' },
  { id: 'leo', from: [7, 23], symbol: '♌', element: 'fire' },
  { id: 'virgo', from: [8, 23], symbol: '♍', element: 'earth' },
  { id: 'libra', from: [9, 23], symbol: '♎', element: 'air' },
  { id: 'scorpio', from: [10, 23], symbol: '♏', element: 'water' },
  { id: 'sagittarius', from: [11, 22], symbol: '♐', element: 'fire' },
  { id: 'capricorn', from: [12, 22], symbol: '♑', element: 'earth' },
];

const SIGN_NAMES: Record<string, Record<string, string>> = {
  en: {
    aries: 'Aries', taurus: 'Taurus', gemini: 'Gemini', cancer: 'Cancer',
    leo: 'Leo', virgo: 'Virgo', libra: 'Libra', scorpio: 'Scorpio',
    sagittarius: 'Sagittarius', capricorn: 'Capricorn', aquarius: 'Aquarius', pisces: 'Pisces',
  },
  es: {
    aries: 'Aries', taurus: 'Tauro', gemini: 'Géminis', cancer: 'Cáncer',
    leo: 'Leo', virgo: 'Virgo', libra: 'Libra', scorpio: 'Escorpio',
    sagittarius: 'Sagitario', capricorn: 'Capricornio', aquarius: 'Acuario', pisces: 'Piscis',
  },
  pt: {
    aries: 'Áries', taurus: 'Touro', gemini: 'Gêmeos', cancer: 'Câncer',
    leo: 'Leão', virgo: 'Virgem', libra: 'Libra', scorpio: 'Escorpião',
    sagittarius: 'Sagitário', capricorn: 'Capricórnio', aquarius: 'Aquário', pisces: 'Peixes',
  },
  fr: {
    aries: 'Bélier', taurus: 'Taureau', gemini: 'Gémeaux', cancer: 'Cancer',
    leo: 'Lion', virgo: 'Vierge', libra: 'Balance', scorpio: 'Scorpion',
    sagittarius: 'Sagittaire', capricorn: 'Capricorne', aquarius: 'Verseau', pisces: 'Poissons',
  },
};

/** Idioma base de un locale, con `'en'` como respaldo. */
function languageOf(locale: string | undefined): string {
  if (!locale) {
    try {
      return new Intl.Locale(Intl.DateTimeFormat().resolvedOptions().locale).language;
    } catch {
      return 'en';
    }
  }
  try {
    return new Intl.Locale(locale).language;
  } catch {
    return locale.split(/[-_]/)[0]!.toLowerCase();
  }
}

function localizedName(id: string, table: Record<string, Record<string, string>>, locale?: string): string {
  const language = languageOf(locale);
  return table[language]?.[id] ?? table['en']![id] ?? id;
}

/**
 * Signo del zodiaco occidental (tropical).
 *
 * Se usan las fechas de corte de uso corriente en prensa y almanaques. La
 * posición real del Sol se desplaza algunas horas de un año a otro, así que en
 * los días de cambio de signo esto es una aproximación, no una efeméride.
 *
 * @example
 * getZodiacSign('1990-05-25', { locale: 'es' }); // { id: 'gemini', name: 'Géminis', … }
 */
export function getZodiacSign(birthDate: DateInput, options: AgeOptions = {}): ZodiacSign {
  const resolved = resolveOptions({ ...options, allowFuture: true });
  const { month, day } = parseCivilDate(birthDate, resolved);

  let spec = SIGNS[0]!;
  for (const candidate of SIGNS) {
    const [m, d] = candidate.from;
    if (month > m || (month === m && day >= d)) spec = candidate;
  }

  return {
    id: spec.id,
    name: localizedName(spec.id, SIGN_NAMES, options.locale),
    symbol: spec.symbol,
    element: spec.element,
  };
}

// --- Zodiaco chino ------------------------------------------------------------

const ANIMALS = [
  'rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake',
  'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig',
] as const;

const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

const ELEMENTS: ChineseZodiac['element'][] = ['wood', 'fire', 'earth', 'metal', 'water'];

const ANIMAL_NAMES: Record<string, Record<string, string>> = {
  en: {
    rat: 'Rat', ox: 'Ox', tiger: 'Tiger', rabbit: 'Rabbit', dragon: 'Dragon', snake: 'Snake',
    horse: 'Horse', goat: 'Goat', monkey: 'Monkey', rooster: 'Rooster', dog: 'Dog', pig: 'Pig',
  },
  es: {
    rat: 'Rata', ox: 'Buey', tiger: 'Tigre', rabbit: 'Conejo', dragon: 'Dragón', snake: 'Serpiente',
    horse: 'Caballo', goat: 'Cabra', monkey: 'Mono', rooster: 'Gallo', dog: 'Perro', pig: 'Cerdo',
  },
  pt: {
    rat: 'Rato', ox: 'Boi', tiger: 'Tigre', rabbit: 'Coelho', dragon: 'Dragão', snake: 'Serpente',
    horse: 'Cavalo', goat: 'Cabra', monkey: 'Macaco', rooster: 'Galo', dog: 'Cão', pig: 'Porco',
  },
  fr: {
    rat: 'Rat', ox: 'Bœuf', tiger: 'Tigre', rabbit: 'Lapin', dragon: 'Dragon', snake: 'Serpent',
    horse: 'Cheval', goat: 'Chèvre', monkey: 'Singe', rooster: 'Coq', dog: 'Chien', pig: 'Cochon',
  },
};

/**
 * Año del calendario chino al que pertenece una fecha gregoriana.
 *
 * El año chino no empieza el 1 de enero sino entre el 21 de enero y el 20 de
 * febrero, así que quien nació en enero pertenece casi siempre al animal del
 * año anterior. En vez de embarcar una tabla de años nuevos lunares se le
 * pregunta a `Intl`, que lleva los datos del calendario chino en ICU: la parte
 * `relatedYear` da justo el año gregoriano con el que empieza el año chino.
 */
function chineseRelatedYear(instant: Date, fallbackYear: number): number {
  try {
    // `relatedYear` es una parte que produce ICU para los calendarios lunares,
    // pero que las definiciones de tipos de TypeScript todavía no listan.
    const parts = new Intl.DateTimeFormat('en-u-ca-chinese', {
      year: 'numeric',
      timeZone: 'UTC',
    }).formatToParts(instant) as ReadonlyArray<{ type: string; value: string }>;
    const related = parts.find((part) => part.type === 'relatedYear');
    if (related) return Number(related.value);
  } catch {
    // Entorno sin datos del calendario chino.
  }
  return fallbackYear;
}

/**
 * Animal y elemento del zodiaco chino, respetando el año nuevo lunar.
 *
 * @example
 * getChineseZodiac('1990-05-25', { locale: 'es' });
 * // { id: 'horse', name: 'Caballo', element: 'metal', branch: '午' }
 * getChineseZodiac('1990-01-10');
 * // Caballo no: todavía es el año de la Serpiente hasta el 27-01-1990.
 */
export function getChineseZodiac(
  birthDate: DateInput,
  options: AgeOptions = {},
): ChineseZodiac {
  const resolved = resolveOptions({ ...options, allowFuture: true });
  const civil = parseCivilDate(birthDate, resolved);
  const instant = new Date(instantFromZoned(civil, 'UTC', 12));
  const year = chineseRelatedYear(instant, civil.year);

  // 1984 fue 甲子: rata de madera, comienzo del ciclo sexagenario.
  const animalIndex = (((year - 4) % 12) + 12) % 12;
  const stemIndex = (((year - 4) % 10) + 10) % 10;
  const id = ANIMALS[animalIndex]!;

  return {
    id,
    name: localizedName(id, ANIMAL_NAMES, options.locale),
    element: ELEMENTS[Math.floor(stemIndex / 2)]!,
    branch: BRANCHES[animalIndex]!,
  };
}

// --- Generaciones y etapas ----------------------------------------------------

/** Identificadores de generación que devuelve {@link getGeneration}. */
export type GenerationId =
  | 'greatest'
  | 'silent'
  | 'boomer'
  | 'gen-x'
  | 'millennial'
  | 'gen-z'
  | 'gen-alpha'
  | 'gen-beta';

const GENERATIONS: Array<{ id: GenerationId; label: string; until: number }> = [
  { id: 'greatest', label: 'Greatest Generation', until: 1927 },
  { id: 'silent', label: 'Silent Generation', until: 1945 },
  { id: 'boomer', label: 'Baby Boomer', until: 1964 },
  { id: 'gen-x', label: 'Generación X', until: 1980 },
  { id: 'millennial', label: 'Millennial', until: 1996 },
  { id: 'gen-z', label: 'Generación Z', until: 2012 },
  { id: 'gen-alpha', label: 'Generación Alfa', until: 2024 },
  { id: 'gen-beta', label: 'Generación Beta', until: Infinity },
];

/**
 * Generación a la que se suele adscribir un año de nacimiento.
 *
 * Se usan los cortes del Pew Research Center, que son los más citados. Son una
 * convención estadounidense sin valor estadístico ni legal.
 */
export function getGeneration(
  birthDate: DateInput,
  options: AgeOptions = {},
): { id: GenerationId; label: string; birthYear: number } {
  const resolved = resolveOptions({ ...options, allowFuture: true });
  const { year } = parseCivilDate(birthDate, resolved);
  const generation = GENERATIONS.find((g) => year <= g.until)!;
  return { id: generation.id, label: generation.label, birthYear: year };
}

/** Etapas devueltas por {@link getLifeStage}. */
export type LifeStage =
  | 'infant'
  | 'toddler'
  | 'child'
  | 'teenager'
  | 'young-adult'
  | 'adult'
  | 'senior';

/**
 * Etapa vital aproximada, con los tramos de uso corriente en salud y en
 * segmentación de producto. No sustituye ningún criterio clínico.
 */
export function getLifeStage(birthDate: DateInput, options: AgeOptions = {}): LifeStage {
  const age = calculateAge(birthDate, options);
  if (age < 1) return 'infant';
  if (age < 4) return 'toddler';
  if (age < 13) return 'child';
  if (age < 18) return 'teenager';
  if (age < 26) return 'young-adult';
  if (age < 65) return 'adult';
  return 'senior';
}
