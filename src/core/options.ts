// src/core/options.ts

import type { AgeOptions, AgeReckoning, CivilDate, DateOrder, LeapDayRule } from '../types.js';
import { civilDateInZone, isValidTimeZone, systemTimeZone } from './calendar.js';
import { InvalidTimeZoneError } from '../errors.js';
import { parseCivilDate } from './parse.js';

/** Opciones ya normalizadas: sin `undefined` en lo que tiene valor por defecto. */
export interface ResolvedOptions {
  timeZone: string;
  locale: string | undefined;
  dateOrder: DateOrder | undefined;
  leapDayRule: LeapDayRule;
  reckoning: AgeReckoning;
  allowFuture: boolean;
  /** Fecha civil de referencia ("hoy" en `timeZone`, salvo que se indique otra). */
  today: CivilDate;
  /** Instante de referencia en milisegundos epoch. */
  nowInstant: number;
}

/**
 * Aplica los valores por defecto y resuelve la fecha de referencia una sola vez
 * por llamada, para que todos los cálculos derivados sean coherentes entre sí
 * aunque el reloj cruce la medianoche a mitad de ejecución.
 */
export function resolveOptions(options: AgeOptions = {}): ResolvedOptions {
  const timeZone = options.timeZone ?? systemTimeZone();
  if (options.timeZone !== undefined && !isValidTimeZone(timeZone)) {
    throw new InvalidTimeZoneError(timeZone);
  }

  const nowInstant =
    options.referenceDate instanceof Date
      ? options.referenceDate.getTime()
      : typeof options.referenceDate === 'number'
        ? options.referenceDate
        : Date.now();

  const today =
    options.referenceDate === undefined
      ? civilDateInZone(nowInstant, timeZone)
      : parseCivilDate(options.referenceDate, {
          timeZone,
          locale: options.locale,
          dateOrder: options.dateOrder,
        });

  return {
    timeZone,
    locale: options.locale,
    dateOrder: options.dateOrder,
    leapDayRule: options.leapDayRule ?? 'feb28',
    reckoning: options.reckoning ?? 'western',
    allowFuture: options.allowFuture ?? false,
    today,
    nowInstant,
  };
}
