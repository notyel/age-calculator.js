# age-calculation-library

Cálculo de edad en TypeScript que acierta donde casi todos fallan: cerca de la
medianoche, en el hemisferio equivocado, el 29 de febrero y cuando la fecha
viene escrita como se escribe en cada país.

Sin dependencias. Funciona en Node ≥ 18 y en cualquier navegador moderno, con
`require` y con `import`, y trae sus propias declaraciones de tipos.

**[Ver el demo →](https://notyel.github.io/age-calculator.js/)**

---

## El problema

La versión 1 hacía esto, y es lo que hace casi todo el mundo:

```javascript
const hoy = new Date();                    // instante local
const nacimiento = new Date("1990-05-25"); // ¡medianoche UTC!
let edad = hoy.getFullYear() - nacimiento.getFullYear();
```

Las dos fechas no viven en el mismo sistema. `new Date("1990-05-25")` es
medianoche **UTC**; `new Date()` es el instante local. Al comparar sus
componentes, en Bogotá (UTC−5) el cumpleaños se adelanta un día y en Tokio
(UTC+9) se atrasa. Un usuario que cumple años hoy ve su edad de ayer.

La versión 2 trata las fechas de nacimiento como lo que son: **fechas de
calendario**, sin hora ni zona horaria. Y resuelve qué día es «hoy» en la zona
que le digas.

```javascript
import { calculateAge } from "age-calculation-library";

calculateAge("1990-05-25");                                  // la zona del sistema
calculateAge("1990-05-25", { timeZone: "America/Bogota" });  // explícita
```

---

## Instalación

```bash
npm install age-calculation-library
```

## Uso

### ESM

```javascript
import { calculateAge, getAgeDetails } from "age-calculation-library";

calculateAge("1990-05-25"); // 36
```

### CommonJS

```javascript
const { calculateAge } = require("age-calculation-library");

calculateAge("1990-05-25"); // 36
```

### Navegador, sin empaquetador

```html
<script type="module">
  import { calculateAge } from "https://esm.sh/age-calculation-library";
  console.log(calculateAge("1990-05-25"));
</script>
```

---

## Actualizar desde la versión 1

**No hay que cambiar nada.** `calculateAge(cadena)` sigue recibiendo una fecha y
devolviendo un número, y la ruta profunda `dist/node/ageCalculator.js` sigue
existiendo. Lo único que cambia es que ahora el resultado es correcto.

| | v1 | v2 |
| --- | --- | --- |
| `calculateAge("1990-05-25")` | número | número, igual |
| Fecha de nacimiento futura | número negativo, en silencio | lanza `FutureDateError` |
| Fecha inválida (`"2026-02-30"`) | `NaN` | lanza `InvalidDateError` |
| Cerca de la medianoche | se desvía un año | correcto |

Los dos cambios de comportamiento son deliberados: `NaN` y las edades negativas
silenciosas se propagan por la aplicación y aparecen tres pantallas más allá.
Si prefieres el comportamiento antiguo para fechas futuras, usa
`{ allowFuture: true }`.

---

## La configuración regional

Es donde la librería se separa de las demás. Todo se apoya en `Intl`, que ya
viene con los datos de CLDR en Node y en el navegador: no hay ni un diccionario
escrito a mano que se quede desactualizado.

### Qué día es «hoy» depende del huso

```javascript
const instante = Date.UTC(2026, 4, 25, 1, 30); // 24-05 20:30 en Bogotá

calculateAge("1990-05-25", { referenceDate: instante, timeZone: "America/Bogota" });
// 35 — en Bogotá todavía es 24 de mayo

calculateAge("1990-05-25", { referenceDate: instante, timeZone: "UTC" });
// 36 — en UTC ya es 25 de mayo
```

### `03/04/2020` no significa lo mismo en todas partes

```javascript
import { toISO } from "age-calculation-library";

toISO("03/04/2020", { locale: "es-ES" }); // "2020-04-03" — 3 de abril
toISO("03/04/2020", { locale: "en-US" }); // "2020-03-04" — 4 de marzo
```

El orden se deduce del locale. Se puede forzar con `dateOrder: 'DMY' | 'MDY' | 'YMD'`.
También se entiende el mes escrito con letras, en el idioma del locale:

```javascript
toISO("25 de mayo de 1990", { locale: "es" }); // "1990-05-25"
toISO("25 mai 1990", { locale: "fr" });        // "1990-05-25"
toISO("May 25, 1990", { locale: "en" });       // "1990-05-25"
```

### Escribir la edad en cualquier idioma

```javascript
import { formatAge } from "age-calculation-library";

formatAge("1990-05-25", { locale: "es-CO" });                    // "36 años"
formatAge("1990-05-25", { locale: "en-US", precision: "full" }); // "36 years, 3 months, and 10 days"
formatAge("1990-05-25", { locale: "ja-JP" });                    // "36 年"
```

### Mayoría de edad por jurisdicción

```javascript
import { isAdult, getLegalStatus } from "age-calculation-library";

isAdult("2008-01-15", { country: "CO" });     // true  — 18 años
isAdult("2008-01-15", { country: "US-AL" });  // false — Alabama la fija en 19
isAdult("2008-01-15", { country: "SG" });     // false — Singapur, en 21

getLegalStatus("2010-03-15", { country: "ES" });
// { ageOfMajority: 18, age: 16, isAdult: false, majorityDate: "2028-03-15", daysUntilMajority: 558, … }
```

La tabla es informativa, no asesoría legal; se puede sustituir por completo con
`ageOfMajority`. Está en [`src/data/majority.ts`](src/data/majority.ts).

### Sistemas de cómputo que no son el occidental

En Asia Oriental la edad no se cuenta por aniversarios. Quien nace un 31 de
diciembre tiene dos años dos días después:

```javascript
calculateAge("2025-12-31", { referenceDate: "2026-01-01" });                          // 0
calculateAge("2025-12-31", { referenceDate: "2026-01-01", reckoning: "east-asian" }); // 2
calculateAge("2025-12-31", { referenceDate: "2026-01-01", reckoning: "korean-year" });// 1
```

### El 29 de febrero

Quien nace un 29 de febrero cumple el 28 en los países de tradición civil
(España, Colombia, México, Chile) y el 1 de marzo en buena parte del mundo
anglosajón. Se elige con `leapDayRule`:

```javascript
calculateAge("2004-02-29", { referenceDate: "2026-02-28" });                        // 22
calculateAge("2004-02-29", { referenceDate: "2026-02-28", leapDayRule: "mar1" });   // 21
```

### Escribir la fecha en otro calendario

El cálculo siempre es gregoriano; esto sólo cambia cómo se escribe:

```javascript
import { formatBirthDate } from "age-calculation-library";

formatBirthDate("1990-05-25", { locale: "es-ES" });
// "25 de mayo de 1990"
formatBirthDate("1990-05-25", { locale: "es", calendar: "islamic-umalqura" });
// "30 de shawwal de 1410 AH"
formatBirthDate("1990-05-25", { locale: "ja", calendar: "japanese" });
// "平成2年5月25日"
```

---

## API

Todas las funciones aceptan el mismo objeto de opciones como último argumento.

### Opciones

| Opción | Tipo | Por defecto | Qué hace |
| --- | --- | --- | --- |
| `referenceDate` | `DateInput` | ahora | Contra qué día se calcula |
| `timeZone` | `string` | la del sistema | Zona IANA que decide qué día es «hoy» |
| `locale` | `string` | el del sistema | Idioma para formatear y desambiguar al parsear |
| `dateOrder` | `'DMY' \| 'MDY' \| 'YMD'` | según `locale` | Fuerza el orden al parsear |
| `leapDayRule` | `'feb28' \| 'mar1'` | `'feb28'` | Cumpleaños del 29 de febrero |
| `reckoning` | `'western' \| 'east-asian' \| 'korean-year'` | `'western'` | Sistema de cómputo |
| `allowFuture` | `boolean` | `false` | Edad negativa en vez de error |

`DateInput` acepta `string` (ISO, regional o con el mes en letras), `number`
(timestamp), `Date` y `{ year, month, day }`.

### Edad

| Función | Devuelve |
| --- | --- |
| `calculateAge(fecha, opts?)` | Años cumplidos |
| `getAgeAt(fecha, aFecha, opts?)` | Años cumplidos en una fecha concreta |
| `getAgeBreakdown(fecha, opts?)` | `{ years, months, days }` |
| `getAgeIn(fecha, unidad, opts?)` | La edad en una sola unidad, de `'years'` a `'seconds'` |
| `getAgeDetails(fecha, opts?)` | Informe completo en una pasada |

### Cumpleaños

| Función | Devuelve |
| --- | --- |
| `getNextBirthday(fecha, opts?)` | `{ date, daysUntil, turningAge, weekday, isToday }` |
| `daysUntilNextBirthday(fecha, opts?)` | Días que faltan |
| `isBirthdayToday(fecha, opts?)` | `boolean` |
| `birthdayInYear(fecha, año, regla?)` | Cuándo se celebra en un año dado |

### Formato

| Función | Devuelve |
| --- | --- |
| `formatAge(fecha, opts?)` | `"36 años"`, `"36 años, 3 meses y 10 días"` |
| `formatBreakdown(desglose, opts?)` | Formatea un desglose ya calculado |
| `formatBirthDate(fecha, opts?)` | La fecha en el idioma y el calendario pedidos |
| `formatTimeToNextBirthday(fecha, opts?)` | `"dentro de 3 meses"` |
| `formatWeekday(día, opts?)` | `"viernes"` |

### Jurisdicción

| Función | Devuelve |
| --- | --- |
| `isAdult(fecha, opts?)` | `boolean` |
| `isAtLeast(fecha, edad, opts?)` | `boolean`, para vallas de edad |
| `getLegalStatus(fecha, opts?)` | Informe con la fecha de mayoría y los días que faltan |
| `getDateAtAge(fecha, edad, opts?)` | Cuándo cumple esa edad |
| `ageOfMajorityFor(jurisdicción)` | La edad de mayoría de un código ISO |

### Complementos

| Función | Devuelve |
| --- | --- |
| `getZodiacSign(fecha, opts?)` | Signo con nombre localizado, símbolo y elemento |
| `getChineseZodiac(fecha, opts?)` | Animal y elemento, **respetando el año nuevo lunar** |
| `getGeneration(fecha, opts?)` | Generación según los cortes del Pew Research Center |
| `getLifeStage(fecha, opts?)` | Etapa vital aproximada |

### Utilidades

| Función | Devuelve |
| --- | --- |
| `toISO(fecha, opts?)` | Normaliza cualquier entrada a `YYYY-MM-DD` |
| `toDate(fecha, opts?)` | `Date` en la medianoche de la zona indicada |
| `compareByAge(a, b, opts?)` | Comparador para `Array#sort` |
| `getBirthDateRange(edad, opts?)` | El rango de fechas de quien tiene esa edad |
| `detectDateOrder(locale)` | El orden de componentes de un locale |

`getBirthDateRange` está pensado para consultas indexables:

```javascript
const { from, to } = getBirthDateRange(18);
// SELECT … WHERE birth_date BETWEEN :from AND :to
```

### La clase `AgeCalculator`

Cuando toda la aplicación usa la misma zona horaria y el mismo idioma, repetir
las opciones en cada llamada cansa:

```javascript
import { AgeCalculator } from "age-calculation-library";

const co = new AgeCalculator({ timeZone: "America/Bogota", locale: "es-CO", country: "CO" });

co.age("25/05/1990");      // 36 — parseado en formato colombiano
co.format("25/05/1990");   // "36 años"
co.isAdult("2010-01-01");  // false
co.nextBirthday("25/05/1990");

const us = co.with({ locale: "en-US", country: "US-AL" }); // deriva sin mutar
```

### Errores

Todos heredan de `AgeCalculatorError` y traen un mensaje ya redactado para una
persona.

| Error | Cuándo |
| --- | --- |
| `InvalidDateError` | La entrada no es una fecha válida; conserva el valor en `.input` |
| `FutureDateError` | La fecha de nacimiento es futura y no se pasó `allowFuture` |
| `InvalidTimeZoneError` | La zona IANA no la reconoce el entorno |

---

## El demo

Una aplicación en Angular 22 que expone todo el API: cambias el idioma, el huso
o el país y ves cómo se mueve el resultado. Consume la librería directamente
desde `src/`, así que siempre refleja el estado del repositorio.

```bash
npm --prefix demo install
npm --prefix demo start        # http://localhost:4200
```

Se publica solo en GitHub Pages con cada push a `master`
([`.github/workflows/pages.yml`](.github/workflows/pages.yml)). Para activarlo la
primera vez hay que poner **Settings → Pages → Source** en *GitHub Actions*.

El demo necesita **Node ≥ 24.15**, que es lo que exige el CLI de Angular 22. La
librería en sí sigue compilando y pasando pruebas desde Node 18.

---

## Desarrollo

```bash
npm install
npm run typecheck   # comprobación de tipos
npm test            # 111 pruebas con el runner nativo de Node
npm run build       # dist/node (CJS) + dist/browser (ESM) + dist/types
npm run verify      # todo lo anterior, más una verificación del paquete construido
```

### Estructura

```
age-calculator.js/
├── src/
│   ├── index.ts            # API pública
│   ├── ageCalculator.ts    # ruta heredada de la v1, reexporta index
│   ├── types.ts
│   ├── errors.ts
│   ├── core/
│   │   ├── calendar.ts     # aritmética civil y puente con zonas horarias
│   │   ├── parse.ts        # parseo, con desambiguación regional
│   │   ├── options.ts      # valores por defecto
│   │   ├── age.ts          # el cálculo
│   │   ├── format.ts       # todo lo que pasa por Intl
│   │   ├── legal.ts        # mayoría de edad
│   │   ├── extras.ts       # zodiaco, generaciones, etapas
│   │   └── calculator.ts   # la clase con opciones fijas
│   └── data/majority.ts    # tabla por jurisdicción
├── test/                   # node:test
├── demo/                   # aplicación Angular 22
└── scripts/                # build, verificación del paquete, runner de pruebas
```

### Por qué el cálculo es como es

La edad se cuenta comparando con el aniversario del año en curso, no dividiendo
milisegundos entre 365,25. Es como la definen las legislaciones y es lo único
que sobrevive a los años bisiestos, a los cambios de horario de verano y a los
husos con desfase de media hora como Katmandú (UTC+5:45).

Las unidades menores que el día (`'hours'`, `'minutes'`, `'seconds'`) sí bajan a
instantes reales, así que un día con cambio de horario cuenta 23 o 25 horas,
pero sigue siendo un día de calendario.

---

## Licencia

MIT — ver [LICENSE](LICENSE).
