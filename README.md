# age-calculation-library

`age-calculation-library` es una librería sencilla en JavaScript (TypeScript) para calcular la edad a partir de una fecha de nacimiento.

## Instalación

Instala la librería utilizando npm:

```bash
npm install age-calculation-library
```

## Uso

### Uso con CommonJS (Node.js)

```javascript
// Importar la función calculateAge desde la biblioteca
const { calculateAge } = require("age-calculation-library");

// Fecha de nacimiento para calcular la edad
const fechaNacimiento = "1990-05-25";

// Calcular la edad basada en la fecha actual
const edad = calculateAge(fechaNacimiento);
console.log(edad); // Debería imprimir la edad basada en la fecha actual
```

### Uso con ES6 Module Syntax

```javascript
// Importar la función calculateAge desde la biblioteca
import { calculateAge } from "age-calculation-library";

// Fecha de nacimiento para calcular la edad
const fechaNacimiento = "1990-05-25";

// Calcular la edad basada en la fecha actual
const edad = calculateAge(fechaNacimiento);
console.log(edad); // Debería imprimir la edad basada en la fecha actual
```

## Desarrollo

### Estructura del Proyecto

El proyecto está organizado de la siguiente manera:

```
age-calculator.js/
├── dist/               # Archivos compilados
│   ├── ageCalculator.js
│   └── test/
│       └── test.js
├── src/                # Código fuente en TypeScript
│   └── ageCalculator.ts
├── test/               # Archivos de prueba en TypeScript
│   └── test.ts
├── package.json        # Configuración del proyecto y dependencias
└── tsconfig.json       # Configuración de TypeScript
```

### Compilación

Para compilar esta librería, primero descarga el repositorio desde GitHub y luego instala las dependencias usando npm:

```bash
git clone https://github.com/notyel/age-calculator.js.git
cd age-calculator.js
npm install
```

Para compilar el código TypeScript en JavaScript, ejecuta el siguiente comando:

```bash
npm run build
```

El código compilado se guardará en la carpeta `dist`.

### Pruebas

Para ejecutar las pruebas, asegúrate de haber compilado el código y luego ejecuta el archivo de prueba generado en la carpeta `dist/test`.

```bash
npm run test
```

### Scripts de npm

- `build`: Compila el código TypeScript a JavaScript.
- `test`: Ejecuta el archivo de pruebas compilado.

### Contribuciones

Las contribuciones son bienvenidas. Por favor, sigue estos pasos:

1. Haz un fork del repositorio.
2. Crea una nueva rama para tu feature (`git checkout -b feature/nueva-feature`).
3. Realiza los cambios necesarios y realiza commit (`git commit -am 'Añade nueva feature'`).
4. Empuja los cambios a la rama (`git push origin feature/nueva-feature`).
5. Crea un Pull Request.

### Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

### Creador

- Autor - [Leyton Manuel Espitia Diaz](https://github.com/notyel)
- Twitter - [@leyton_network](https://twitter.com/Leyton_Network)
- LinkedIn - [Curriculum vitae](https://www.linkedin.com/in/leyton-manuel-espitia-diaz-5497a33b/)
