// src/data/majority.ts
//
// Tabla informativa de mayoría de edad. NO es asesoría legal: las
// legislaciones cambian y muchas jurisdicciones fijan edades distintas según
// la materia (civil, penal, electoral, laboral). Se ofrece como valor por
// defecto razonable y se puede sustituir entera con la opción `ageOfMajority`.
//
// Claves: código ISO 3166-1 alfa-2, o ISO 3166-2 (`US-AL`) cuando la
// subdivisión difiere del país. La búsqueda prueba primero la subdivisión.

/** Edad de mayoría cuando no hay una entrada más específica. */
export const DEFAULT_AGE_OF_MAJORITY = 18;

/** Mayoría de edad civil por jurisdicción. */
export const AGE_OF_MAJORITY: Readonly<Record<string, number>> = Object.freeze({
  // --- 21 años ---
  AE: 21, // Emiratos Árabes Unidos
  BH: 21, // Baréin
  CM: 21, // Camerún
  EG: 21, // Egipto
  GA: 21, // Gabón
  HN: 21, // Honduras
  KW: 21, // Kuwait
  LS: 21, // Lesoto
  MG: 21, // Madagascar
  SG: 21, // Singapur
  SZ: 21, // Esuatini

  // --- 20 años ---
  NZ: 20, // Nueva Zelanda
  TH: 20, // Tailandia

  // --- 19 años ---
  DZ: 19, // Argelia
  KR: 19, // Corea del Sur (만 19세)

  // --- Subdivisiones que se apartan del país ---
  'US-AL': 19,
  'US-NE': 19,
  'US-MS': 21,
  'CA-BC': 19,
  'CA-NB': 19,
  'CA-NL': 19,
  'CA-NS': 19,
  'CA-NT': 19,
  'CA-NU': 19,
  'CA-YT': 19,
  'GB-SCT': 16, // Escocia
});

/**
 * Mayoría de edad de una jurisdicción.
 *
 * Acepta `'CO'`, `'us-al'` o `'GB-SCT'`; si la subdivisión no está en la tabla
 * recae en el país, y si el país tampoco, en {@link DEFAULT_AGE_OF_MAJORITY}.
 */
export function ageOfMajorityFor(jurisdiction: string): number {
  const code = jurisdiction.trim().toUpperCase().replace('_', '-');
  const exact = AGE_OF_MAJORITY[code];
  if (exact !== undefined) return exact;

  const country = code.split('-')[0]!;
  return AGE_OF_MAJORITY[country] ?? DEFAULT_AGE_OF_MAJORITY;
}
