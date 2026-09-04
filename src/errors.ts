// src/errors.ts

/** Clase base de todos los errores que lanza la librería. */
export class AgeCalculatorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AgeCalculatorError';
    // Necesario para que `instanceof` funcione al compilar a ES5/ES2015.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** La entrada no se pudo interpretar como una fecha válida. */
export class InvalidDateError extends AgeCalculatorError {
  /** El valor que se intentó parsear. */
  readonly input: unknown;

  constructor(input: unknown, hint?: string) {
    const shown = typeof input === 'string' ? `"${input}"` : String(input);
    super(
      `Fecha inválida: ${shown}.` +
        (hint ? ` ${hint}` : ' Usa el formato ISO "YYYY-MM-DD".'),
    );
    this.name = 'InvalidDateError';
    this.input = input;
  }
}

/** La fecha de nacimiento es posterior a la fecha de referencia. */
export class FutureDateError extends AgeCalculatorError {
  /** Fecha de nacimiento recibida, en ISO. */
  readonly birthDate: string;
  /** Fecha de referencia usada, en ISO. */
  readonly referenceDate: string;

  constructor(birthDate: string, referenceDate: string) {
    super(
      `La fecha de nacimiento (${birthDate}) es posterior a la fecha de ` +
        `referencia (${referenceDate}). Usa { allowFuture: true } para ` +
        'obtener una edad negativa en lugar de este error.',
    );
    this.name = 'FutureDateError';
    this.birthDate = birthDate;
    this.referenceDate = referenceDate;
  }
}

/** La zona horaria IANA indicada no la reconoce el entorno. */
export class InvalidTimeZoneError extends AgeCalculatorError {
  /** Zona horaria recibida. */
  readonly timeZone: string;

  constructor(timeZone: string) {
    super(
      `Zona horaria desconocida: "${timeZone}". Se espera un identificador ` +
        'IANA como "America/Bogota" o "Europe/Madrid".',
    );
    this.name = 'InvalidTimeZoneError';
    this.timeZone = timeZone;
  }
}
