# age-calculation-library

`age-calculation-library` es una librería sencilla en JavaScript (TypeScript) para calcular la edad a partir de una fecha de nacimiento.

## Instalación

Para utilizar esta librería, primero clona el repositorio y luego instala las dependencias usando `npm`.

```bash
git clone https://github.com/notyel/age-calculator.js.git
cd age-calculator.js
npm install
```

## Uso

Para usar la librería en tu proyecto, puedes importar la función `calculateAge` y utilizarla para calcular la edad de una persona basada en su fecha de nacimiento.

### Ejemplo

```typescript
import { calculateAge } from "./dist/ageCalculator";

const age = calculateAge("1990-05-25");
console.log(age); // Debería imprimir la edad basada en la fecha actual
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
