// src/app/app.ts

import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import {
  AgeCalculator,
  AgeCalculatorError,
  calculateAge,
  formatBirthDate,
  formatWeekday,
  type AgeDetails,
  type AgeOptions,
  type AgeReckoning,
  type ChineseZodiac,
  type LeapDayRule,
  type LegalStatus,
  type NextBirthday,
  type ZodiacSign,
} from 'age-calculation-library';

import {
  CALENDARS,
  COMPARISON_ZONES,
  COUNTRIES,
  ELEMENT_LABELS,
  LEAP_RULES,
  LIFE_STAGE_LABELS,
  LOCALES,
  PRESETS,
  RECKONINGS,
  TIME_ZONES,
  type Preset,
} from './catalog';

interface Entry {
  label: string;
  value: string;
  note?: string;
}

interface Report {
  details: AgeDetails;
  headline: string;
  full: string;
  birthPretty: string;
  weekdayBorn: string;
  next: NextBirthday;
  nextWeekday: string;
  timeToNext: string;
  legal: LegalStatus;
  zodiac: ZodiacSign;
  chinese: ChineseZodiac;
  generation: string;
  lifeStage: string;
  reckoningLabel: string;
  units: readonly Entry[];
  calendars: readonly Entry[];
}

interface ZoneRow {
  zone: string;
  localDate: string;
  age: number;
  isBirthday: boolean;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly locales = LOCALES;
  protected readonly timeZones = TIME_ZONES;
  protected readonly countries = COUNTRIES;
  protected readonly reckonings = RECKONINGS;
  protected readonly leapRules = LEAP_RULES;
  protected readonly presets = PRESETS;

  protected readonly birthDate = signal('1990-05-25');
  protected readonly locale = signal('es-CO');
  protected readonly timeZone = signal('America/Bogota');
  protected readonly country = signal('CO');
  protected readonly reckoning = signal<AgeReckoning>('western');
  protected readonly leapDayRule = signal<LeapDayRule>('feb28');
  /** Vacío = "ahora"; con valor = se congela el "hoy" contra el que se calcula. */
  protected readonly referenceDate = signal('');

  /** Opciones que se pasan a la librería en cada llamada. */
  private readonly options = computed<AgeOptions>(() => {
    const reference = this.referenceDate().trim();
    return {
      locale: this.locale(),
      timeZone: this.timeZone(),
      reckoning: this.reckoning(),
      leapDayRule: this.leapDayRule(),
      ...(reference ? { referenceDate: reference } : {}),
    };
  });

  /**
   * El informe completo, o el motivo por el que no se pudo calcular.
   *
   * Es un único `computed` con un resultado etiquetado en vez de dos señales
   * separadas: escribir en una señal desde dentro de un `computed` no está
   * permitido, y así el estado de error nunca puede quedar desincronizado del
   * resultado.
   *
   * La librería redacta sus errores para una persona, así que el demo los
   * muestra tal cual en lugar de traducir códigos.
   */
  private readonly outcome = computed<
    { ok: true; report: Report } | { ok: false; message: string }
  >(() => {
    if (!this.birthDate().trim()) {
      return { ok: false, message: 'Escribe una fecha de nacimiento para empezar.' };
    }
    try {
      return { ok: true, report: this.buildReport() };
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof AgeCalculatorError
            ? error.message
            : 'No se pudo calcular la edad con estos datos.',
      };
    }
  });

  protected readonly report = computed<Report | null>(() => {
    const outcome = this.outcome();
    return outcome.ok ? outcome.report : null;
  });

  protected readonly error = computed<string | null>(() => {
    const outcome = this.outcome();
    return outcome.ok ? null : outcome.message;
  });

  /**
   * El mismo instante, seis husos: la demostración de por qué la edad no se
   * puede calcular restando milisegundos.
   */
  protected readonly zoneRows = computed<readonly ZoneRow[]>(() => {
    const birth = this.birthDate().trim();
    const options = this.options();

    return COMPARISON_ZONES.map((zone) => {
      const scoped = { ...options, timeZone: zone };
      try {
        const calculator = new AgeCalculator(scoped);
        return {
          zone,
          localDate: calculator.toISO(options.referenceDate ?? Date.now()),
          age: calculator.age(birth),
          isBirthday: calculator.isBirthdayToday(birth),
        };
      } catch {
        return { zone, localDate: '—', age: Number.NaN, isBirthday: false };
      }
    });
  });

  protected onInput(event: Event, target: { set(value: string): void }): void {
    target.set((event.target as HTMLInputElement | HTMLSelectElement).value);
  }

  protected applyPreset(preset: Preset): void {
    this.birthDate.set(preset.birthDate);
    if (preset.locale) this.locale.set(preset.locale);
    if (preset.timeZone) this.timeZone.set(preset.timeZone);
    if (preset.country) this.country.set(preset.country);
    this.reckoning.set(preset.reckoning ?? 'western');
  }

  protected reset(): void {
    this.birthDate.set('1990-05-25');
    this.locale.set('es-CO');
    this.timeZone.set('America/Bogota');
    this.country.set('CO');
    this.reckoning.set('western');
    this.leapDayRule.set('feb28');
    this.referenceDate.set('');
  }

  private buildReport(): Report {
    const birth = this.birthDate().trim();
    const options = this.options();
    const locale = this.locale();
    const calculator = new AgeCalculator({ ...options, country: this.country() });

    const details = calculator.details(birth);
    const next = calculator.nextBirthday(birth);
    const zodiac = calculator.zodiac(birth);
    const chinese = calculator.chineseZodiac(birth);
    const generation = calculator.generation(birth);
    const stage = calculator.lifeStage(birth);

    const units: Entry[] = [
      { label: 'Meses', value: this.number(details.totalMonths) },
      { label: 'Semanas', value: this.number(details.totalWeeks) },
      { label: 'Días', value: this.number(details.totalDays) },
      { label: 'Horas', value: this.number(calculator.in(birth, 'hours')) },
      { label: 'Minutos', value: this.number(calculator.in(birth, 'minutes')) },
      { label: 'Segundos', value: this.number(calculator.in(birth, 'seconds')) },
    ];

    const calendars: Entry[] = CALENDARS.map((calendar) => ({
      label: calendar.label,
      value: formatBirthDate(birth, { ...options, calendar: calendar.value }),
    }));

    return {
      details,
      headline: calculator.format(birth),
      full: calculator.format(birth, { precision: 'full' }),
      birthPretty: calculator.formatDate(birth, { dateStyle: 'full' }),
      weekdayBorn: formatWeekday(details.weekdayBorn, { locale }),
      next,
      nextWeekday: formatWeekday(next.weekday, { locale }),
      timeToNext: calculator.formatTimeToBirthday(birth),
      legal: calculator.legalStatus(birth),
      zodiac,
      chinese,
      generation: generation.label,
      lifeStage: LIFE_STAGE_LABELS[stage],
      reckoningLabel:
        this.reckonings.find((r) => r.value === this.reckoning())?.label ?? '',
      units,
      calendars,
    };
  }

  protected elementLabel(element: string): string {
    return ELEMENT_LABELS[element] ?? element;
  }

  protected zoneLabel(zone: string): string {
    return zone.split('/').pop()?.replace(/_/g, ' ') ?? zone;
  }

  /** Edad occidental aparte, para poder contrastarla con la del sistema elegido. */
  protected readonly westernAge = computed<number | null>(() => {
    try {
      return calculateAge(this.birthDate().trim(), {
        ...this.options(),
        reckoning: 'western',
      });
    } catch {
      return null;
    }
  });

  private number(value: number): string {
    return new Intl.NumberFormat(this.locale()).format(value);
  }
}
