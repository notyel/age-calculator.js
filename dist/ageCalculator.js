"use strict";
// src/ageCalculator.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateAge = void 0;
/**
 * Calcula la edad de una persona basada en su fecha de nacimiento.
 * @param {string} birthDateString - La fecha de nacimiento en formato 'YYYY-MM-DD'.
 * @returns {number} - La edad de la persona.
 */
function calculateAge(birthDateString) {
    var today = new Date();
    var birthDate = new Date(birthDateString);
    var age = today.getFullYear() - birthDate.getFullYear();
    var monthDifference = today.getMonth() - birthDate.getMonth();
    // Si el mes actual es menor que el mes de nacimiento, resta un año.
    // O si es el mismo mes, pero el día actual es menor que el día de nacimiento, resta un año.
    if (monthDifference < 0 ||
        (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}
exports.calculateAge = calculateAge;
