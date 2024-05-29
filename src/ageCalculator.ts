// src/ageCalculator.ts

/**
 * Calcula la edad de una persona basada en su fecha de nacimiento.
 * @param {string} birthDateString - La fecha de nacimiento en formato 'YYYY-MM-DD'.
 * @returns {number} - La edad de la persona.
 */
export function calculateAge(birthDateString: string): number {
  const today = new Date();
  const birthDate = new Date(birthDateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  // Si el mes actual es menor que el mes de nacimiento, resta un año.
  // O si es el mismo mes, pero el día actual es menor que el día de nacimiento, resta un año.
  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}
