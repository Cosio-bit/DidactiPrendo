# Bloques didácticos — contexto del proyecto

Este archivo lo lee Claude Code al comenzar cada sesión. Resume qué se construye, para quién y con qué reglas.

## Qué es

Aplicación web para que profesores chilenos creen **bloques didácticos vacíos** (ruleta, selección múltiple, parejas, términos pareados, verdadero o falso, ordenar, clasificar) y los **proyecten en la sala** con un data o una pizarra interactiva. El marcador por equipos y el temporizador acompañan a cualquier bloque.

- La aplicación **no entrega contenido**: el profesor pone el suyo.
- La forma principal de crear un bloque es **pegar texto plano** (una lista, preguntas copiadas de Word o de ChatGPT) y que el bloque se arme solo.

## Para quién

- Docentes de 5° a 8° básico en Chile (unos 86 mil), con foco en quienes **no se llevan bien con la tecnología**.
- Edad promedio de 43 años. Solo 6,5% tiene formación en inglés.
- Muchos usan notebooks antiguos, proyectores de baja resolución y salas sin buen wifi.
- El profesor paga de su bolsillo. Si una pantalla necesita explicación, está mal diseñada.

## Reglas no negociables

1. **Todo en español de Chile.** Nada de inglés ni "spanglish" en la interfaz, mensajes de error, nombres de botones o archivos que vea el usuario.
   - Usar vocabulario escolar chileno: "curso", "asignatura", "OA" (Objetivo de Aprendizaje), "profe".
   - Todos los textos visibles viven en `src/i18n/es-CL.ts`; nunca escribirlos directo en los componentes.
2. **Funciona sin internet.** La aplicación es una PWA (Progressive Web App, aplicación web progresiva): después de abrirse una vez queda guardada en el navegador y sigue funcionando sin conexión.
3. **Los datos viven en el computador del profesor.**
   - Se guardan en IndexedDB, la base de datos interna del navegador.
   - No hay servidor propio en el piloto.
   - **Nunca** enviar a ningún servidor nombres de estudiantes ni el contenido de los bloques.
   - **Única excepción: "Crear con IA"** (decidido en octubre de 2026 para el piloto). Solo cuando el profe lo usa, su pedido y el texto de su guía van a Claude (Anthropic) a través de la función `api/crear-con-ia.ts`. La pantalla lo avisa y pide no escribir nombres de estudiantes. La función no guarda nada, y lo demás sigue funcionando sin internet.
4. **Pensada para proyectar.**
   - Letra grande y alto contraste; debe leerse desde el fondo de una sala con un proyector de baja luz.
   - Debe verse bien en 1024×768 píxeles y en formato 4:3 y 16:9.
   - Botones de al menos 48×48 píxeles, para pizarra táctil.
   - No depender de pasar el mouse por encima (hover) ni del clic derecho.
   - En el celular (hasta 600 px de ancho o 500 px de alto) nada se desplaza hacia el lado y el editor se divide en pasos (texto, actividad, proyectar).
   - Ningún cuadro tiene su propia barra de desplazamiento: todo se lee de una vez (a lo más se desplaza la página).
5. **Control con teclado.** En modo proyección:
   - Flechas y barra espaciadora para avanzar, compatibles con controles de presentación inalámbricos.
   - Esc para salir.
   - F o el botón de pantalla completa.
6. **A prueba de errores.**
   - Guardado automático.
   - Deshacer siempre visible.
   - Confirmar antes de borrar.
   - Nunca perder el trabajo del profesor.
7. **Sin cuenta para empezar.** Abrir, crear y proyectar sin registrarse.
8. **Sin animaciones decorativas.** La evidencia muestra que distraen y reducen el aprendizaje. Solo animaciones funcionales, como el giro de la ruleta o voltear una tarjeta.
9. **Liviana.** Debe abrir rápido en un notebook viejo con Chrome desactualizado. Evitar dependencias pesadas.

## Tecnología

| Pieza | Elección | Para qué |
| --- | --- | --- |
| Lenguaje | TypeScript | JavaScript con tipos; detecta errores antes de ejecutar |
| Interfaz | React | Biblioteca para construir la interfaz por componentes |
| Empaquetador | Vite | Prepara el código para el navegador; genera un sitio estático |
| Modo sin internet | `vite-plugin-pwa` | Genera el *service worker*, el programa que guarda la app en el navegador |
| Almacenamiento | Dexie (sobre IndexedDB) | Guardar bloques en el computador del profesor |
| Estilos | CSS con variables (sin framework pesado) | Control total de tamaños y contraste para proyectar |
| Pruebas unitarias | Vitest | Probar funciones aisladas, sobre todo el lector de texto |
| Pruebas de punta a punta | Playwright | Simular a un profesor usando la app con clics reales |
| Publicación | Vercel | Publica el sitio desde GitHub; cada cambio genera un enlace de prueba |
| IA ("Crear con IA") | Claude Sonnet 5.5, vía una función de Vercel | Elige la actividad y la llena a partir del pedido del profe. La clave está en la variable de entorno `key` (y `WORKSPACE_ID` si la clave no tiene espacio de trabajo); `CODIGO_PILOTO` limita el uso a quien conoce el código |

Se eligió Vite en vez de Next.js porque la app es un sitio estático que funciona sin servidor. Así el modo sin internet es más simple. La única función de servidor es `api/crear-con-ia.ts`; `npm run dev` no la ejecuta (la pantalla avisa que no está disponible), así que se prueba en el enlace de prueba de Vercel o simulando su respuesta en las pruebas.

## Estructura de carpetas

```
api/
  crear-con-ia.ts      función de Vercel: instrucciones para Claude y llamada a la API
src/
  i18n/es-CL.ts        textos visibles en español
  parser/              lector de texto pegado -> bloque
  blocks/
    ruleta/            editor + vista de proyección
    preguntas/         selección múltiple (y verdadero o falso, que reutiliza su proyección)
    parejas/           memorice
    pareados/          términos pareados: unir cada concepto con su definición
    ordenar/
    clasificar/
    marcador/
    temporizador/
  storage/             Dexie: guardar, listar, exportar, importar
  projection/          modo pantalla completa y atajos de teclado
  ai-bridge/           pide actividades a la IA y las revisa con el lector
  ui/                  componentes comunes (botones, diálogos, deshacer)
tests/
  unit/                Vitest
  e2e/                 Playwright
```

## Modelo de datos

```ts
type BlockType =
  | "ruleta" | "preguntas" | "parejas" | "terminos-pareados" | "verdadero-falso" | "ordenar" | "clasificar"
  | "marcador" | "temporizador";

interface Block {
  id: string;            // identificador único
  type: BlockType;
  title: string;         // ej. "Fracciones 6°B"
  items: unknown;        // contenido según el tipo (ver parser)
  config: unknown;       // opciones según el tipo (ej. eliminar al salir)
  texto?: string;        // texto tal como lo pegó el profe; de aquí salen los items
  course?: string;       // "6° básico"
  subject?: string;      // "Matemática"
  oa?: string;           // "OA 5"
  createdAt: number;
  updatedAt: number;
  schemaVersion: 1;      // para migrar datos si el formato cambia
}
```

El marcador y el temporizador no son bloques: acompañan a cualquier proyección. Sus equipos, puntos y la última duración del temporizador se guardan en la tabla `ajustes` de IndexedDB (clave → valor), no dentro de una actividad.

Para pasar actividades entre computadores (`src/storage/intercambio.ts`):
- **Archivo** `.json` con `{ aplicacion: "DidactiPrendo", formato: 1, actividades: Block[] }`. Importar nunca reemplaza: lo igual no se repite y lo distinto entra como copia.
- **Enlace** `#/recibir/<datos>`: tipo, nombre, texto y opciones, comprimidos y en base64url (los items se vuelven a leer del texto). Va después del `#`, así que nunca llega a un servidor.

## Formato de texto que entiende el lector

- **Lista simple** (ruleta, sorteo): una línea = un elemento. Se ignoran líneas vacías, viñetas (`-`, `•`, `1.`) y espacios sobrantes.
- **Preguntas**:
  ```
  ¿Cuánto es 1/2 + 1/4?
  a) 2/6
  *b) 3/4
  c) 1/8
  ```
  - La pregunta termina en `?` o es la línea que viene antes de las alternativas.
  - La alternativa correcta lleva `*` al inicio.
  - Las preguntas se separan con una línea vacía.
- **Parejas** (memorice): `palabra = definición`, una pareja por línea. También sirven `|`, `→`, `:` o dos columnas de Word o Excel.
- **Términos pareados**: el mismo formato que Parejas (`concepto | definición`, `=` o una tabla de dos columnas de Docs, Word, Excel o ChatGPT). Se proyecta distinto: conceptos numerados a la izquierda, definiciones desordenadas a la derecha, y se une cada concepto con la suya. La fila de títulos ("Concepto | Definición") se ignora. Si las definiciones son frases (5 palabras o más en promedio), el lector sugiere Términos pareados en vez de Parejas.
- **Verdadero o falso**: una afirmación por línea con `(V)` o `(F)` al final (también `V)` al inicio, o una línea `Respuesta: F` debajo).
- **Ordenar**: un elemento por línea, **en el orden correcto**; la app los desordena al proyectar. Si vienen numerados, se respeta el número.
- **Clasificar**: cada categoría termina en dos puntos y lleva sus elementos, en la misma línea separados por comas o debajo:
  ```
  Mamíferos: perro, ballena, murciélago
  Aves:
  - cóndor
  - pingüino
  ```
  También sirve una tabla con una columna por categoría.
- El lector **nunca sugiere Ordenar** (una lista ordenada se ve igual que una lista para la ruleta): el profe lo elige.
- Debe tolerar texto copiado de Word, Google Docs, Excel (tabulaciones) y ChatGPT (negritas `**`, numeración, títulos).
- Ante una duda, el lector **sugiere** un tipo de bloque y muestra una vista previa; nunca falla en silencio.

## Comandos

```
npm run dev        servidor local de desarrollo
npm run build      genera el sitio estático
npm run test       pruebas unitarias (Vitest)
npm run test:e2e   pruebas de punta a punta (Playwright)
```

## Cómo trabajar en este repo

- Cada fase del `PLAN.md` termina con pruebas que pasan y un despliegue de prueba en Vercel.
- Antes de dar algo por terminado, revisarlo con la ventana del navegador en 1024×768 y solo con teclado.
- Cambios pequeños, un commit por tarea.
- Si una decisión choca con las reglas no negociables, preguntar antes de seguir.
