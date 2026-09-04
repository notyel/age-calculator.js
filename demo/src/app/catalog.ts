// src/app/catalog.ts
//
// Listas fijas del formulario. Se dejan aquí y no en la plantilla para que el
// componente quede legible y para poder añadir un caso nuevo sin tocar el HTML.

import type { AgeReckoning, LeapDayRule, LifeStage } from 'age-calculation-library';

export interface Option<T extends string> {
  value: T;
  label: string;
}

/** Idiomas con los que se ve el efecto de `locale` de un vistazo. */
export const LOCALES: ReadonlyArray<Option<string>> = [
  { value: 'es-CO', label: 'Español (Colombia) — DD/MM/AAAA' },
  { value: 'es-ES', label: 'Español (España) — DD/MM/AAAA' },
  { value: 'en-US', label: 'English (US) — MM/DD/YYYY' },
  { value: 'en-GB', label: 'English (UK) — DD/MM/YYYY' },
  { value: 'pt-BR', label: 'Português (Brasil) — DD/MM/AAAA' },
  { value: 'fr-FR', label: 'Français — JJ/MM/AAAA' },
  { value: 'de-DE', label: 'Deutsch — TT.MM.JJJJ' },
  { value: 'ja-JP', label: '日本語 — YYYY/MM/DD' },
  { value: 'ar-EG', label: 'العربية (مصر)' },
  { value: 'ko-KR', label: '한국어' },
];

/** Husos elegidos para cubrir los extremos: UTC−11 a UTC+14 y medias horas. */
export const TIME_ZONES: ReadonlyArray<Option<string>> = [
  { value: 'America/Bogota', label: 'Bogotá (UTC−5)' },
  { value: 'America/Mexico_City', label: 'Ciudad de México (UTC−6)' },
  { value: 'America/New_York', label: 'Nueva York (UTC−5/−4)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (UTC−3)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/Madrid', label: 'Madrid (UTC+1/+2)' },
  { value: 'Africa/Lagos', label: 'Lagos (UTC+1)' },
  { value: 'Asia/Kathmandu', label: 'Katmandú (UTC+5:45)' },
  { value: 'Asia/Tokyo', label: 'Tokio (UTC+9)' },
  { value: 'Australia/Sydney', label: 'Sídney (UTC+10/+11)' },
  { value: 'Pacific/Kiritimati', label: 'Kiritimati (UTC+14)' },
];

/** Husos del panel comparativo: el mismo instante visto desde cada uno. */
export const COMPARISON_ZONES: readonly string[] = [
  'Pacific/Midway',
  'America/Bogota',
  'UTC',
  'Europe/Madrid',
  'Asia/Tokyo',
  'Pacific/Kiritimati',
];

/** Jurisdicciones que muestran los tres umbrales de mayoría de edad. */
export const COUNTRIES: ReadonlyArray<Option<string>> = [
  { value: 'CO', label: 'Colombia — 18' },
  { value: 'ES', label: 'España — 18' },
  { value: 'MX', label: 'México — 18' },
  { value: 'US', label: 'Estados Unidos — 18' },
  { value: 'US-AL', label: 'Estados Unidos · Alabama — 19' },
  { value: 'US-MS', label: 'Estados Unidos · Misisipi — 21' },
  { value: 'GB-SCT', label: 'Reino Unido · Escocia — 16' },
  { value: 'KR', label: 'Corea del Sur — 19' },
  { value: 'NZ', label: 'Nueva Zelanda — 20' },
  { value: 'SG', label: 'Singapur — 21' },
];

export const RECKONINGS: ReadonlyArray<Option<AgeReckoning>> = [
  { value: 'western', label: 'Occidental — se cumple en el aniversario' },
  { value: 'east-asian', label: 'Asia Oriental — se nace con 1 y se suma cada 1 de enero' },
  { value: 'korean-year', label: 'Coreana por año (연 나이) — año actual − año de nacimiento' },
];

export const LEAP_RULES: ReadonlyArray<Option<LeapDayRule>> = [
  { value: 'feb28', label: '28 de febrero — tradición civil' },
  { value: 'mar1', label: '1 de marzo — tradición anglosajona' },
];

/** Calendarios con los que se reescribe la misma fecha de nacimiento. */
export const CALENDARS: ReadonlyArray<Option<string>> = [
  { value: 'gregory', label: 'Gregoriano' },
  { value: 'islamic-umalqura', label: 'Islámico (Umm al-Qura)' },
  { value: 'hebrew', label: 'Hebreo' },
  { value: 'japanese', label: 'Japonés (eras)' },
  { value: 'buddhist', label: 'Budista' },
  { value: 'persian', label: 'Persa' },
  { value: 'indian', label: 'Indio nacional' },
  { value: 'chinese', label: 'Chino' },
];

/** Nombres en español de las etapas vitales que devuelve la librería. */
export const LIFE_STAGE_LABELS: Readonly<Record<LifeStage, string>> = {
  infant: 'Bebé',
  toddler: 'Primera infancia',
  child: 'Infancia',
  teenager: 'Adolescencia',
  'young-adult': 'Adulto joven',
  adult: 'Adulto',
  senior: 'Adulto mayor',
};

/** Nombres en español de los elementos del zodiaco. */
export const ELEMENT_LABELS: Readonly<Record<string, string>> = {
  fire: 'Fuego',
  earth: 'Tierra',
  air: 'Aire',
  water: 'Agua',
  wood: 'Madera',
  metal: 'Metal',
};

/** Ejemplos de un clic que enseñan los casos difíciles. */
export interface Preset {
  label: string;
  hint: string;
  birthDate: string;
  locale?: string;
  timeZone?: string;
  reckoning?: AgeReckoning;
  country?: string;
}

export const PRESETS: readonly Preset[] = [
  {
    label: 'Nacido un 29 de febrero',
    hint: 'Cambia la regla del año bisiesto y mira cómo se mueve el cumpleaños.',
    birthDate: '2004-02-29',
    locale: 'es-CO',
  },
  {
    label: 'Fecha en formato de EE. UU.',
    hint: '03/04/2020 es el 4 de marzo aquí y el 3 de abril en España.',
    birthDate: '03/04/2020',
    locale: 'en-US',
  },
  {
    label: 'Escrita con letras',
    hint: 'El mes en palabras se reconoce en el idioma del locale.',
    birthDate: '25 de mayo de 1990',
    locale: 'es-ES',
  },
  {
    label: 'Edad coreana',
    hint: 'Nacido el 31 de diciembre: dos días de vida, dos años en 세는나이.',
    birthDate: '2025-12-31',
    locale: 'ko-KR',
    timeZone: 'Asia/Tokyo',
    reckoning: 'east-asian',
    country: 'KR',
  },
  {
    label: 'Casi mayor de edad',
    hint: 'La misma fecha es mayoría en Escocia y minoría en Singapur.',
    birthDate: '2008-01-15',
    locale: 'en-GB',
    country: 'SG',
  },
];
