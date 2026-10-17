# Plan de trabajo — piloto de bloques didácticos

**Objetivo del piloto:** que 10 a 15 profesores de segundo ciclo, incluidos los que menos se manejan con tecnología, creen y proyecten actividades **solos**, en menos de 3 minutos, durante 4 semanas.

Además, medir si pagarían.

**Fuera del alcance del piloto:**
- Cuentas de usuario.
- Pagos.
- Inteligencia artificial integrada.
- Servidor propio.
- ~~Más de 4 bloques.~~ Cambio de alcance (octubre 2026): se suman Parejas, Verdadero o falso, Ordenar y Clasificar para tener repertorio desde el piloto (ver Fase 4b). El marcador y el temporizador pasan a ser herramientas que acompañan a cualquier bloque.

Cada fase tiene un objetivo, sus tareas, un criterio de "terminado" y una instrucción sugerida para pegarle a Claude Code. Las fases están pensadas para avanzar en sesiones cortas, en paralelo con el semestre.

---

## Fase 0 — Preparación (1 sesión)

**Objetivo:** repositorio creado, publicado en Vercel y con el contexto listo para Claude Code.

- [x] Crear el repositorio en GitHub (`DidactiPrendo`) y copiar `CLAUDE.md` y este `PLAN.md` en la raíz.
- [x] Crear el proyecto base con Vite + React + TypeScript.
- [x] Conectar el repositorio a Vercel (plan Hobby, gratuito, mientras el piloto no cobre).
- [x] Configurar Vitest y Playwright con una prueba de ejemplo cada uno.

**Terminado cuando:** existe un enlace de Vercel que muestra "Hola, profe" y `npm run test` pasa.

> **Instrucción para Claude Code:** "Lee CLAUDE.md. Crea el proyecto base con Vite, React y TypeScript siguiendo la estructura de carpetas indicada. Configura Vitest y Playwright con una prueba mínima cada uno. Crea `src/i18n/es-CL.ts` con el texto 'Hola, profe' y muéstralo en la página. No agregues dependencias fuera de las listadas."

---

## Fase 1 — Base de la aplicación (2 a 3 sesiones)

**Objetivo:** la aplicación funciona sin internet, guarda en el navegador y tiene un diseño legible al proyectar.

- [x] Modo sin internet con `vite-plugin-pwa`: la app abre aunque se corte el wifi.
- [x] Capa de almacenamiento con Dexie: guardar, listar, actualizar y borrar bloques. Usar `schemaVersion` para migraciones futuras.
- [x] Sistema de diseño base:
  - Variables CSS para tamaños y colores.
  - Tema de alto contraste.
  - Letra mínima de 24 px en modo proyección.
  - Botones de 48 px o más.
- [x] Pantalla de inicio con solo dos acciones grandes: **"Crear actividad"** y **"Mis actividades"**.
- [x] Componentes comunes:
  - Botón.
  - Diálogo de confirmación.
  - Aviso de "Guardado" y botón "Deshacer".

**Terminado cuando:**
- Con la red desconectada en las herramientas del navegador, la app abre y muestra las actividades guardadas.
- Todo se lee bien en 1024×768.

> **Instrucción para Claude Code:** "Implementa la Fase 1 del PLAN.md. Prioriza que funcione sin internet y que nada se pierda: guardado automático y deshacer. Escribe pruebas unitarias para la capa de almacenamiento. Muéstrame cómo probar el modo sin conexión."

---

## Fase 2 — Lector de texto pegado (2 sesiones) ⭐ núcleo del producto

**Objetivo:** pegar cualquier texto razonable y obtener los elementos limpios, junto con el tipo de bloque sugerido.

- [x] Función `parseText(texto) → { tipoSugerido, elementos, advertencias }`.
- [x] Limpiar:
  - Viñetas y numeración.
  - Negritas de ChatGPT (`**`).
  - Tabulaciones de Excel.
  - Líneas vacías y espacios dobles.
- [x] Detectar preguntas con alternativas y la correcta marcada con `*`.
- [x] Detectar duplicados y avisar sin borrarlos.
- [x] Pantalla **"Pega tu texto aquí"**: un cuadro grande, vista previa inmediata a la derecha y el tipo sugerido con opción de cambiarlo.
- [ ] Batería de pruebas con **textos reales**: pedirle a 3 o 4 profesores que te manden listas tal como las tienen en Word o en sus guías.
  - Ya hay 34 textos de ejemplo en `tests/unit/lector.test.ts`. Los reales se agregan como `.txt` en `tests/unit/textos-reales/` (ver su `LEEME.md`).

**Terminado cuando:** las pruebas cubren al menos 20 textos reales distintos y el lector nunca falla sin explicar qué no entendió.

> **Instrucción para Claude Code:** "Implementa el lector de texto de la Fase 2 según el formato de CLAUDE.md. Empieza por las pruebas: crea casos con listas de Word, viñetas, numeración, texto de ChatGPT con negritas, columnas de Excel y preguntas con alternativas. Luego escribe `parseText` hasta que pasen. Los mensajes de advertencia deben estar en español simple."

---

## Fase 3 — Bloque Ruleta (2 sesiones)

**Objetivo:** el primer bloque completo, de la creación a la proyección.

- [x] Editor: título, lista de elementos (pegada o escrita) y opciones:
  - Eliminar el elemento que sale.
  - Sonido sí o no.
- [x] Vista de proyección a pantalla completa:
  - Girar con barra espaciadora o con un toque.
  - Resultado en letra muy grande.
  - Contador de elementos restantes.
- [x] Animación de giro de 2 a 4 segundos, sin adornos.
- [x] Funciona con 2 a 60 elementos; los textos largos se ajustan sin cortarse.

**Terminado cuando:** un profesor puede pegar los nombres de su curso y girar la ruleta proyectada en menos de 1 minuto.

> **Instrucción para Claude Code:** "Implementa el bloque Ruleta (Fase 3) usando `parseText`. La vista de proyección debe manejarse solo con teclado: espacio para girar, Esc para salir, F para pantalla completa. Agrega una prueba de punta a punta con Playwright que pegue 30 nombres, proyecte y gire."

---

## Fase 4 — Bloque Preguntas, sin celulares de estudiantes (2 a 3 sesiones)

**Objetivo:** preguntas con alternativas para que respondan todos a mano alzada, con tarjetas A, B, C, D en papel o por equipos.

- [x] Editor alimentado por el lector de la Fase 2.
- [x] Proyección de una pregunta por pantalla:
  - Mostrar alternativas.
  - Botón "Revelar respuesta".
  - Botón "Comentar el error", que deja la respuesta incorrecta en pantalla para discutirla.
- [x] Temporizador opcional por pregunta.
- [x] Botón para imprimir tarjetas A, B, C, D en papel, como respaldo cuando no hay proyector o para que los estudiantes respondan.

**Terminado cuando:** se puede hacer un repaso de 10 preguntas proyectado de principio a fin usando solo el teclado.

---

## Fase 4b — Más bloques: Parejas, Verdadero o falso, Ordenar y Clasificar

**Objetivo:** que el profe tenga repertorio desde el primer día, con el mismo flujo de pegar texto y proyectar.

- [ ] El lector reconoce los cuatro formatos y sugiere el tipo (ver CLAUDE.md).
- [ ] **Verdadero o falso:** una afirmación por pantalla, revelar, temporizador opcional e impresión de tarjetas V y F.
- [ ] **Parejas:** memorice proyectado; se voltean dos tarjetas por turno con un toque o el teclado.
- [ ] **Ordenar:** los elementos aparecen desordenados; el curso propone cuál va después y se comprueba, o se revela paso a paso.
- [ ] **Clasificar:** los elementos aparecen sueltos y se llevan a su categoría; se comprueba o se revela uno por uno.

**Terminado cuando:** cada bloque se crea pegando texto y se proyecta de principio a fin con teclado o toques, en 1024×768.

---

## Fase 5 — Marcador por equipos y temporizador (1 a 2 sesiones)

- [ ] Marcador para 2 a 8 equipos con nombre y color, y botones grandes de +1 y −1.
- [ ] Puede mostrarse junto a la ruleta o a las preguntas.
- [ ] Temporizador independiente:
  - Inicio, pausa y reinicio.
  - Aviso visual al terminar, además del sonoro.
- [ ] Colores distinguibles por personas con daltonismo.

---

## Fase 6 — "Mis actividades" y compartir (2 sesiones)

- [ ] Lista de actividades con búsqueda y filtros por curso, asignatura y OA.
- [ ] Duplicar una actividad ("Hacer otra versión").
- [ ] **Exportar e importar** como archivo, para respaldo o para cambiar de computador.
- [ ] **Compartir por enlace sin servidor:** el contenido del bloque va comprimido dentro del propio enlace, después del símbolo `#`. Así se puede mandar por WhatsApp a un colega y el contenido nunca pasa por un servidor.

**Terminado cuando:** un profesor le manda una actividad a otro por WhatsApp y este la abre y la proyecta sin crear cuenta.

---

## Fase 7 — Puente con ChatGPT u otra IA (1 a 2 sesiones)

**Objetivo:** aprovechar la IA que el profesor ya paga, sin costo para ti.

- [ ] Botón **"Pedirle a ChatGPT"**. Armar una instrucción lista para copiar, con:
  - Tema, curso y cantidad.
  - Y, lo más importante, **el formato exacto** que el lector entiende.
- [ ] Botón "Copiar" y enlace para abrir ChatGPT, Gemini o Copilot.
- [ ] Al pegar la respuesta, el lector la convierte en bloque.
- [ ] Sentido inverso: "Copiar esta actividad para pedir otra versión" (más fácil, más difícil, otro tema).

**Terminado cuando:** con ChatGPT gratuito se obtiene un quiz de 10 preguntas listo para proyectar en menos de 3 minutos.

---

## Fase 8 — Pruebas en condiciones reales (1 a 2 sesiones)

- [ ] Probar en un notebook Windows viejo con Chrome desactualizado, en un proyector real y, si se puede, en una pizarra interactiva.
- [ ] Recorrer toda la app solo con teclado y solo con toques.
- [ ] Revisar contraste con una herramienta de accesibilidad (por ejemplo, Lighthouse, incluida en Chrome).
- [ ] Pruebas de punta a punta con Playwright para los 4 bloques, simulando una pantalla de 1024×768.
- [ ] Revisión de textos: ninguna palabra en inglés visible para el usuario.

---

## Fase 9 — Piloto con profesores (4 semanas)

**Preparación:**
- [ ] Página de inicio simple que explique la app en una frase, con un video de 30 segundos.
- [ ] Medición de uso respetuosa de la privacidad, sin guardar contenido ni nombres. Por ejemplo, Vercel Web Analytics, que no usa cookies, más eventos propios como "bloque creado" o "proyección iniciada".
- [ ] Formulario corto de comentarios dentro de la app.
- [ ] Grupo de WhatsApp de soporte con los profesores del piloto.

**Durante:**
- [ ] Observar en persona a al menos 3 profesores la primera vez que la usan: dónde dudan y qué botón buscan.
- [ ] Ajustes semanales según lo observado.

**Qué medir:**

| Métrica | Meta |
| --- | --- |
| Minutos hasta proyectar la primera actividad | Menos de 3 |
| Profesores que la siguen usando en la semana 4 | 60% o más |
| Actividades creadas por profesor activo por semana | 2 o más |
| Profesores que aceptan la preventa o el plan fundador | 25% o más |

**Al cierre:** decidir qué bloques agregar (dado, sorteo de equipos, modo multigrado) y si se construyen cuentas, pagos con Webpay, Mercado Pago o Flow, y la IA integrada.

---

## Después del piloto (no construir todavía)

- Cuentas con inicio de sesión por enlace al correo, sin contraseñas, y sincronización entre computadores.
- Pagos locales: débito y transferencia vía Webpay, Mercado Pago o Flow.
- Requiere iniciar actividades en el SII (Servicio de Impuestos Internos) y emitir boletas.
- Pasar Vercel al plan Pro (uso comercial).
- IA integrada en la app, con un servidor propio que proteja la clave y límites de uso por persona.
- Más bloques:
  - Dado, sorteo de equipos.
  - Modo multigrado.
  - Lectura en voz alta y pictogramas para equipos PIE.
- Revisar cumplimiento de la Ley 21.719 de protección de datos personales.
