import { describe, expect, it } from 'vitest'
import { parseText } from '../../src/parser/parseText.ts'
import type { Lectura, Pregunta } from '../../src/parser/tipos.ts'

/*
 * Textos de ejemplo escritos imitando cómo llegan desde Word, Excel, Google Docs y ChatGPT.
 * Los textos reales que manden profesores van en tests/unit/lector-reales.test.ts.
 */

function lista(lectura: Lectura): string[] {
  expect(lectura.tipo).toBe('ruleta')
  return lectura.elementos as string[]
}

function preguntas(lectura: Lectura): Pregunta[] {
  expect(lectura.tipo).toBe('preguntas')
  return lectura.elementos as Pregunta[]
}

function codigos(lectura: Lectura) {
  return lectura.advertencias.map((a) => a.codigo)
}

/** Pregunta compacta: la correcta va con * al inicio, como la escribe el profe. */
function p(enunciado: string, ...alternativas: string[]): Pregunta {
  return {
    enunciado,
    alternativas: alternativas.map((a) =>
      a.startsWith('*') ? { texto: a.slice(1), correcta: true } : { texto: a, correcta: false },
    ),
  }
}

describe('lector: listas', () => {
  it('1. nombres, uno por línea, con saltos de Windows, espacios y líneas vacías', () => {
    const l = parseText('Ana Pérez  \r\n\r\n  Benjamín   Soto\r\nCatalina\r\n\r\n\r\n')
    expect(l.tipoSugerido).toBe('ruleta')
    expect(lista(l)).toEqual(['Ana Pérez', 'Benjamín Soto', 'Catalina'])
    expect(l.advertencias).toEqual([])
  })

  it('2. viñetas de Word con tabulación', () => {
    const l = parseText('•\tRojo\r\n•\tAzul\r\n•\tVerde\r\n')
    expect(lista(l)).toEqual(['Rojo', 'Azul', 'Verde'])
  })

  it('3. viñetas de Word con fuente Symbol y segundo nivel', () => {
    const texto = '·\tMamíferos\no\tPerro\no\tGato\n§\tAves\n\uF0B7\tReptiles'
    expect(lista(parseText(texto))).toEqual(['Mamíferos', 'Perro', 'Gato', 'Aves', 'Reptiles'])
  })

  it('4. numeración de Word y a la chilena ("1.-")', () => {
    const texto = '1.\tSustantivo\n2.\tAdjetivo\n3.- Verbo\n4) Adverbio\n5- Pronombre\n(6) Artículo'
    expect(lista(parseText(texto))).toEqual(['Sustantivo', 'Adjetivo', 'Verbo', 'Adverbio', 'Pronombre', 'Artículo'])
  })

  it('5. columnas de Excel con encabezado y número de lista', () => {
    const texto = 'N°\tNombre\tApellido\n1\tAna\tPérez\n2\tBenjamín\tSoto\t\n3\tCatalina\t\t\n'
    const l = parseText(texto)
    expect(lista(l)).toEqual(['Ana Pérez', 'Benjamín Soto', 'Catalina'])
    expect(codigos(l)).toEqual(['lineas-ignoradas'])
    expect(l.advertencias[0].lineas).toEqual([1])
  })

  it('5b. Excel con títulos de columna "Nombre" y "Apellido"', () => {
    const l = parseText('Nombre\tApellido\nAna\tPérez\nBenjamín\tSoto')
    expect(lista(l)).toEqual(['Ana Pérez', 'Benjamín Soto'])
    expect(l.advertencias[0].mensaje).toContain('«Nombre Apellido»')
  })

  it('6. una sola columna de Excel con celdas vacías al final', () => {
    expect(lista(parseText('Pedro\t\nJuan\t\nDiego\t'))).toEqual(['Pedro', 'Juan', 'Diego'])
  })

  it('7. lista de ChatGPT con saludo, negritas, numeración y pregunta final', () => {
    const texto = [
      '¡Claro! Aquí tienes una lista de 5 animales del bosque chileno:',
      '',
      '1. **Pudú**',
      '2. **Huemul**',
      '3. **Monito del monte**',
      '4. **Zorro chilote**',
      '5. **Carpintero negro**',
      '',
      '¿Quieres que agregue una descripción de cada uno?',
    ].join('\n')
    const l = parseText(texto)
    expect(lista(l)).toEqual(['Pudú', 'Huemul', 'Monito del monte', 'Zorro chilote', 'Carpintero negro'])
    expect(codigos(l)).toEqual(['lineas-ignoradas'])
    expect(l.advertencias[0].lineas).toEqual([1, 9])
  })

  it('8. ChatGPT con títulos markdown y separadores', () => {
    const texto = '### Mamíferos\n- Perro\n- Gato\n\n---\n\n### Aves\n- Cóndor\n* Loica'
    const l = parseText(texto)
    expect(lista(l)).toEqual(['Perro', 'Gato', 'Cóndor', 'Loica'])
    expect(codigos(l)).toEqual(['lineas-ignoradas'])
  })

  it('9. Google Docs con espacios duros y doble salto entre líneas', () => {
    const texto = 'Arica\u00A0y Parinacota\n\n\nTarapacá\n\n\nAntofagasta\u200B\n\n'
    expect(lista(parseText(texto))).toEqual(['Arica y Parinacota', 'Tarapacá', 'Antofagasta'])
  })

  it('10. todo en una línea separado por comas', () => {
    const l = parseText('rojo, azul, verde, amarillo')
    expect(lista(l)).toEqual(['rojo', 'azul', 'verde', 'amarillo'])
    expect(codigos(l)).toEqual(['separado-por-comas'])
  })

  it('11. una frase con comas no se separa', () => {
    const l = parseText('Hoy, en la clase de ciencias, vimos el ciclo del agua y la lluvia en el sur de Chile')
    expect(lista(l)).toHaveLength(1)
    expect(codigos(l)).toEqual(['pocos-elementos'])
  })

  it('12. preguntas abiertas para la ruleta (sin alternativas)', () => {
    const texto = '¿Qué fue lo que más te gustó?\n¿Qué te costó?\n¿Qué le dirías a un compañero?'
    const l = parseText(texto)
    expect(l.tipoSugerido).toBe('ruleta')
    expect(lista(l)).toHaveLength(3)
  })

  it('13. avisa repetidos sin borrarlos', () => {
    const l = parseText('Ana\nBenjamín\nana \nÁna\nBenjamin\nCarla')
    expect(lista(l)).toEqual(['Ana', 'Benjamín', 'ana', 'Ána', 'Benjamin', 'Carla'])
    expect(codigos(l)).toEqual(['repetidos'])
    expect(l.advertencias[0].mensaje).toContain('«Ana»')
    expect(l.advertencias[0].mensaje).toContain('«Benjamín»')
  })

  it('14. respeta números negativos, decimales, cursos y restas', () => {
    const texto = '-5\n1.5\n1° básico\n10 - 5 = ?\n3/4'
    expect(lista(parseText(texto))).toEqual(['-5', '1.5', '1° básico', '10 - 5 = ?', '3/4'])
  })

  it('15. nombres que empiezan con una inicial no se confunden con alternativas', () => {
    const l = parseText('A. Prat\nB. O’Higgins\nJ. M. Carrera')
    expect(l.tipoSugerido).toBe('ruleta')
    expect(lista(l)).toEqual(['A. Prat', 'B. O’Higgins', 'J. M. Carrera'])
  })

  it('16. "Excelente" o "Listo" como elementos no se toman como comentario', () => {
    expect(lista(parseText('Excelente\nBueno\nRegular\nListo'))).toEqual(['Excelente', 'Bueno', 'Regular', 'Listo'])
  })

  it('17. título con dos puntos al inicio', () => {
    const l = parseText('Lista 6°B:\nAna\nBenjamín')
    expect(lista(l)).toEqual(['Ana', 'Benjamín'])
    expect(l.advertencias[0].mensaje).toContain('«Lista 6°B:»')
  })

  it('18. texto vacío: sin elementos ni advertencias', () => {
    const l = parseText('  \n \r\n')
    expect(lista(l)).toEqual([])
    expect(l.advertencias).toEqual([])
  })

  it('19. solo separadores: avisa que no encontró nada', () => {
    const l = parseText('---\n***\n\n')
    expect(lista(l)).toEqual([])
    expect(codigos(l)).toEqual(['sin-elementos'])
  })

  it('20. más de 60 elementos: avisa', () => {
    const texto = Array.from({ length: 61 }, (_, i) => `Estudiante ${i + 1}`).join('\n')
    expect(codigos(parseText(texto))).toEqual(['demasiados-elementos'])
  })

  it('21. tabla markdown de ChatGPT', () => {
    const texto = '| N° | Animal |\n|---|---|\n| 1 | Pudú |\n| 2 | Huemul |'
    const l = parseText(texto)
    expect(lista(l)).toEqual(['Pudú', 'Huemul'])
    expect(codigos(l)).toEqual(['lineas-ignoradas'])
  })
})

describe('lector: preguntas con alternativas', () => {
  it('22. formato de CLAUDE.md', () => {
    const texto = [
      '¿Cuánto es 1/2 + 1/4?',
      'a) 2/6',
      '*b) 3/4',
      'c) 1/8',
      '',
      '¿Cuál es la capital de Chile?',
      'a) Valparaíso',
      '*b) Santiago',
      'c) Concepción',
    ].join('\n')
    const l = parseText(texto)
    expect(l.tipoSugerido).toBe('preguntas')
    expect(preguntas(l)).toEqual([
      p('¿Cuánto es 1/2 + 1/4?', '2/6', '*3/4', '1/8'),
      p('¿Cuál es la capital de Chile?', 'Valparaíso', '*Santiago', 'Concepción'),
    ])
    expect(l.advertencias).toEqual([])
  })

  it('23. guía en Word con numeración, tabulaciones y saltos de Windows', () => {
    const texto =
      '1.\t¿Qué tipo de palabra es "rápido"?\r\na)\tSustantivo\r\n*b)\tAdjetivo\r\nc)\tVerbo\r\nd)\tAdverbio\r\n\r\n' +
      '2.\t¿Cuál es el plural de "lápiz"?\r\na)\tLápizs\r\n*b)\tLápices\r\nc)\tLápiz\r\n'
    expect(preguntas(parseText(texto))).toEqual([
      p('¿Qué tipo de palabra es "rápido"?', 'Sustantivo', '*Adjetivo', 'Verbo', 'Adverbio'),
      p('¿Cuál es el plural de "lápiz"?', 'Lápizs', '*Lápices', 'Lápiz'),
    ])
  })

  it('24. ChatGPT con negritas, saludo y línea "Respuesta correcta"', () => {
    const texto = [
      '¡Claro! Aquí tienes 2 preguntas sobre fracciones para 6° básico:',
      '',
      '**1. ¿Cuál fracción es mayor?**',
      'a) 1/3',
      'b) 1/4',
      'c) 1/5',
      '**Respuesta correcta: a)**',
      '',
      '**2. ¿Cuánto es 3/4 de 8?**',
      'a) 4',
      'b) 6',
      'c) 2',
      'Respuesta: b',
      '',
      '¿Quieres que prepare más preguntas?',
    ].join('\n')
    const l = parseText(texto)
    expect(preguntas(l)).toEqual([
      p('¿Cuál fracción es mayor?', '*1/3', '1/4', '1/5'),
      p('¿Cuánto es 3/4 de 8?', '4', '*6', '2'),
    ])
    expect(codigos(l)).toEqual(['lineas-ignoradas'])
    expect(l.advertencias[0].lineas).toEqual([1, 15])
  })

  it('25. ChatGPT con título "Pregunta 1" y marca ✅', () => {
    const texto = [
      '### Pregunta 1',
      '¿Qué planeta es el más cercano al Sol?',
      '',
      'A) Venus',
      'B) Mercurio ✅',
      'C) Marte',
      '',
      '### Pregunta 2',
      '¿Cuántos planetas tiene el sistema solar?',
      '',
      'A) 7',
      'B) 9',
      'C) 8 ✅',
    ].join('\n')
    const l = parseText(texto)
    expect(preguntas(l)).toEqual([
      p('¿Qué planeta es el más cercano al Sol?', 'Venus', '*Mercurio', 'Marte'),
      p('¿Cuántos planetas tiene el sistema solar?', '7', '9', '*8'),
    ])
    expect(l.advertencias).toEqual([])
  })

  it('26. Google Docs con una línea vacía entre cada línea', () => {
    const texto = '¿Cuál es el océano más grande?\n\na) Atlántico\n\n*b) Pacífico\n\nc) Índico\n\n\n¿Qué es un volcán?\n\n*a) Una montaña que expulsa lava\n\nb) Un río\n'
    expect(preguntas(parseText(texto))).toEqual([
      p('¿Cuál es el océano más grande?', 'Atlántico', '*Pacífico', 'Índico'),
      p('¿Qué es un volcán?', '*Una montaña que expulsa lava', 'Un río'),
    ])
  })

  it('27. letras mayúsculas con punto y "(correcta)"', () => {
    const texto = '¿Quién escribió "Desolación"?\nA. Pablo Neruda\nB. Gabriela Mistral (correcta)\nC. Vicente Huidobro'
    expect(preguntas(parseText(texto))).toEqual([
      p('¿Quién escribió "Desolación"?', 'Pablo Neruda', '*Gabriela Mistral', 'Vicente Huidobro'),
    ])
  })

  it('28. alternativas en la misma línea', () => {
    const texto = '¿Cuánto es 7 × 8?\na) 54   *b) 56   c) 58   d) 64\n\n¿Cuánto es 9 × 6? a) 54 b) 56 c) 45'
    const l = parseText(texto)
    expect(preguntas(l)).toEqual([
      p('¿Cuánto es 7 × 8?', '54', '*56', '58', '64'),
      p('¿Cuánto es 9 × 6?', '54', '56', '45'),
    ])
    expect(codigos(l)).toEqual(['sin-correcta'])
    expect(l.advertencias[0].mensaje).toContain('pregunta 2')
  })

  it('29. avisa preguntas sin correcta, con varias correctas o con una sola alternativa', () => {
    const texto = [
      '¿Pregunta uno?',
      'a) x',
      'b) y',
      '',
      '¿Pregunta dos?',
      '*a) x',
      '*b) y',
      '',
      '¿Pregunta tres?',
      '*a) x',
      '',
      '¿Pregunta cuatro?',
      'a) x',
      'b) y',
    ].join('\n')
    const l = parseText(texto)
    expect(preguntas(l)).toHaveLength(4)
    expect(codigos(l)).toEqual(['sin-correcta', 'varias-correctas', 'pocas-alternativas'])
    expect(l.advertencias[0].mensaje).toContain('preguntas 1 y 4')
    expect(l.advertencias[1].mensaje).toContain('pregunta 2')
    expect(l.advertencias[2].mensaje).toContain('pregunta 3')
  })

  it('30. instrucción sin signo de pregunta y enunciado en varias líneas', () => {
    const texto = [
      'Instrucciones: marca la alternativa correcta.',
      '',
      '1. Lee el texto: "Juan tiene 3 manzanas y regala 1."',
      '¿Cuántas manzanas le quedan?',
      'a) 1',
      '*b) 2',
      'c) 3',
      '',
      '2. Selecciona el sustantivo',
      'a) correr',
      '*b) mesa',
      'c) azul',
    ].join('\n')
    const l = parseText(texto)
    expect(preguntas(l)).toEqual([
      p('Lee el texto: "Juan tiene 3 manzanas y regala 1." ¿Cuántas manzanas le quedan?', '1', '*2', '3'),
      p('Selecciona el sustantivo', 'correr', '*mesa', 'azul'),
    ])
    expect(codigos(l)).toEqual(['lineas-ignoradas'])
    expect(l.advertencias[0].lineas).toEqual([1])
  })

  it('31. alternativa correcta en negrita y "Pregunta 1:" como prefijo', () => {
    const texto = 'Pregunta 1: ¿Cuál es el río más largo de Chile?\na) Biobío\n**b) Loa**\nc) Maipo'
    expect(preguntas(parseText(texto))).toEqual([p('¿Cuál es el río más largo de Chile?', 'Biobío', '*Loa', 'Maipo')])
  })

  it('32. pregunta suelta sin alternativas entre otras: avisa y no la mezcla', () => {
    const texto = '¿Qué es un sustantivo?\n¿Cuál es un verbo?\na) casa\n*b) saltar'
    const l = parseText(texto)
    expect(preguntas(l)).toEqual([p('¿Cuál es un verbo?', 'casa', '*saltar')])
    expect(codigos(l)).toEqual(['lineas-ignoradas'])
    expect(l.advertencias[0].mensaje).toContain('«¿Qué es un sustantivo?»')
  })

  it('33. "* b)" con espacio también marca la correcta', () => {
    const texto = '¿2 + 2?\na) 3\n* b) 4\nc) 5'
    expect(preguntas(parseText(texto))).toEqual([p('¿2 + 2?', '3', '*4', '5')])
  })
})

describe('lector: cambiar el tipo sugerido', () => {
  const texto = '¿Cuánto es 2 + 2?\na) 3\n*b) 4'

  it('se puede leer un texto de preguntas como lista', () => {
    const l = parseText(texto, 'ruleta')
    expect(l.tipoSugerido).toBe('preguntas')
    expect(lista(l)).toEqual(['¿Cuánto es 2 + 2?', 'a) 3', '*b) 4'])
  })

  it('leer una lista como preguntas explica por qué no hay preguntas', () => {
    const l = parseText('Ana\nBenjamín', 'preguntas')
    expect(l.tipoSugerido).toBe('ruleta')
    expect(preguntas(l)).toEqual([])
    expect(codigos(l)).toEqual(['sin-preguntas'])
  })
})

describe('lector: nunca falla en silencio', () => {
  const muestras = [
    '',
    '\t\t\t',
    '***',
    '**',
    'a)',
    '*',
    '1.',
    '¿?',
    'a) uno\nb) dos',
    'Respuesta: b',
    '| |',
    '\uFEFF\u200B',
    'x'.repeat(5000),
  ]

  it.each(muestras)('con %j entrega un resultado y explica lo que no usó', (texto) => {
    for (const tipo of [undefined, 'ruleta', 'preguntas'] as const) {
      const l = parseText(texto, tipo)
      const hayContenido = texto.replace(/[\s\uFEFF\u200B]/g, '') !== ''
      if (hayContenido && l.elementos.length === 0) expect(l.advertencias.length).toBeGreaterThan(0)
      for (const a of l.advertencias) expect(a.mensaje).not.toBe('')
    }
  })
})
