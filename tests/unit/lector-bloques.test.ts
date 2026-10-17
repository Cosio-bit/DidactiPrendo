import { describe, expect, it } from 'vitest'
import { parseText } from '../../src/parser/parseText.ts'
import type { Afirmacion, Categoria, Lectura, Pareja } from '../../src/parser/tipos.ts'

/* Textos de ejemplo para Parejas, Verdadero o falso, Ordenar y Clasificar. */

function codigos(lectura: Lectura) {
  return lectura.advertencias.map((a) => a.codigo)
}

function parejas(lectura: Lectura): Pareja[] {
  expect(lectura.tipo).toBe('parejas')
  return lectura.elementos as Pareja[]
}

function afirmaciones(lectura: Lectura): Afirmacion[] {
  expect(lectura.tipo).toBe('verdadero-falso')
  return lectura.elementos as Afirmacion[]
}

function orden(lectura: Lectura): string[] {
  expect(lectura.tipo).toBe('ordenar')
  return lectura.elementos as string[]
}

function categorias(lectura: Lectura): Categoria[] {
  expect(lectura.tipo).toBe('clasificar')
  return lectura.elementos as Categoria[]
}

const par = (a: string, b: string): Pareja => ({ a, b })

describe('lector: parejas', () => {
  it('con signo igual', () => {
    const l = parseText('perro = dog\ngato = cat\ncasa = house')
    expect(l.tipoSugerido).toBe('parejas')
    expect(parejas(l)).toEqual([par('perro', 'dog'), par('gato', 'cat'), par('casa', 'house')])
    expect(l.advertencias).toEqual([])
  })

  it('dos columnas copiadas de Excel o de una tabla de Word', () => {
    const l = parseText('dog\tperro\r\ncat\tgato\r\nhouse\tcasa\r\n')
    expect(l.tipoSugerido).toBe('parejas')
    expect(parejas(l)).toEqual([par('dog', 'perro'), par('cat', 'gato'), par('house', 'casa')])
  })

  it('definiciones con dos puntos, aunque la definición tenga comas', () => {
    const texto = [
      'Sustantivo: palabra que nombra personas, animales o cosas',
      'Verbo: palabra que indica una acción',
      'Adjetivo: palabra que describe al sustantivo',
    ].join('\n')
    const l = parseText(texto)
    expect(l.tipoSugerido).toBe('parejas')
    expect(parejas(l)[0]).toEqual(par('Sustantivo', 'palabra que nombra personas, animales o cosas'))
  })

  it('ChatGPT con numeración, negritas y flechas', () => {
    const texto = [
      'Aquí tienes 2 conceptos con su definición:',
      '1. **Fotosíntesis** → proceso con que las plantas producen su alimento',
      '2. **Célula** → unidad básica de los seres vivos',
    ].join('\n')
    const l = parseText(texto)
    expect(parejas(l)).toEqual([
      par('Fotosíntesis', 'proceso con que las plantas producen su alimento'),
      par('Célula', 'unidad básica de los seres vivos'),
    ])
    expect(codigos(l)).toEqual(['lineas-ignoradas'])
  })

  it('con guion entre espacios', () => {
    expect(parejas(parseText('dog - perro\ncat – gato'))).toEqual([par('dog', 'perro'), par('cat', 'gato')])
  })

  it('una lista de nombres y apellidos de Excel sigue siendo para la ruleta', () => {
    const l = parseText('Ana\tPérez\nBenjamín\tSoto\nCatalina\tMuñoz')
    expect(l.tipoSugerido).toBe('ruleta')
    expect(parejas(parseText('Ana\tPérez\nBenjamín\tSoto', 'parejas'))).toEqual([
      par('Ana', 'Pérez'),
      par('Benjamín', 'Soto'),
    ])
  })

  it('avisa las líneas sin pareja, las repetidas y cuando son demasiadas', () => {
    const l = parseText('perro = dog\ngato\ncasa = house\nperro = puppy')
    expect(parejas(l)).toHaveLength(3)
    expect(codigos(l)).toEqual(['lineas-ignoradas', 'repetidos'])
    expect(l.advertencias[0].mensaje).toContain('«gato»')

    const muchas = Array.from({ length: 13 }, (_, i) => `palabra ${i} = word ${i}`).join('\n')
    expect(codigos(parseText(muchas))).toEqual(['demasiadas-parejas'])
  })

  it('una operación con "= ?" no es una pareja', () => {
    expect(parseText('10 - 5 = ?\n3 + 3 = ?\n2 × 4 = ?').tipoSugerido).toBe('ruleta')
  })
})

describe('lector: verdadero o falso', () => {
  it('con (V) o (F) al final', () => {
    const l = parseText('La ballena es un mamífero (V)\nEl sol es un planeta (F)\nChile tiene 16 regiones (V)')
    expect(l.tipoSugerido).toBe('verdadero-falso')
    expect(afirmaciones(l)).toEqual([
      { texto: 'La ballena es un mamífero', verdadera: true },
      { texto: 'El sol es un planeta', verdadera: false },
      { texto: 'Chile tiene 16 regiones', verdadera: true },
    ])
    expect(l.advertencias).toEqual([])
  })

  it('con V) al inicio y una instrucción antes', () => {
    const texto = 'Escribe V si es verdadero o F si es falso.\nV) La Tierra gira alrededor del Sol\nF) Los peces respiran con pulmones'
    const l = parseText(texto)
    expect(afirmaciones(l)).toEqual([
      { texto: 'La Tierra gira alrededor del Sol', verdadera: true },
      { texto: 'Los peces respiran con pulmones', verdadera: false },
    ])
    expect(codigos(l)).toEqual(['lineas-ignoradas'])
  })

  it('ChatGPT con la respuesta en la línea de abajo', () => {
    const texto = '1. El agua hierve a 100 °C.\n   Respuesta: Verdadero\n\n2. Las arañas son insectos.\n   **Respuesta:** Falso'
    expect(afirmaciones(parseText(texto))).toEqual([
      { texto: 'El agua hierve a 100 °C.', verdadera: true },
      { texto: 'Las arañas son insectos.', verdadera: false },
    ])
  })

  it('otras formas de marcar: [V], - F y → Verdadero', () => {
    const texto = 'El cóndor es un ave [V]\nLa luna tiene luz propia - F\nEl agua es un líquido → Verdadero'
    expect(afirmaciones(parseText(texto)).map((a) => a.verdadera)).toEqual([true, false, true])
  })

  it('guía con líneas en blanco para responder: avisa que faltan las respuestas', () => {
    const l = parseText('____ La ballena es un pez\n____ El cóndor es un ave', 'verdadero-falso')
    expect(afirmaciones(l)).toEqual([
      { texto: 'La ballena es un pez', verdadera: null },
      { texto: 'El cóndor es un ave', verdadera: null },
    ])
    expect(codigos(l)).toEqual(['sin-respuesta'])
    expect(l.advertencias[0].mensaje).toContain('1 y 2')
  })
})

describe('lector: ordenar', () => {
  it('nunca se sugiere, pero el profe lo puede elegir', () => {
    const texto = 'Semilla\nGerminación\nPlanta\nFlor\nFruto'
    const l = parseText(texto, 'ordenar')
    expect(l.tipoSugerido).toBe('ruleta')
    expect(orden(l)).toEqual(['Semilla', 'Germinación', 'Planta', 'Flor', 'Fruto'])
    expect(l.advertencias).toEqual([])
  })

  it('si vienen numerados en desorden, respeta los números y lo avisa', () => {
    const l = parseText('3. Planta\n1. Semilla\n2. Germinación', 'ordenar')
    expect(orden(l)).toEqual(['Semilla', 'Germinación', 'Planta'])
    expect(codigos(l)).toEqual(['ordenado-por-numero'])
  })

  it('avisa si son muy pocos o demasiados', () => {
    expect(codigos(parseText('Uno\nDos', 'ordenar'))).toEqual(['pocos-para-ordenar'])
    const muchos = Array.from({ length: 13 }, (_, i) => `Paso ${i + 1}`).join('\n')
    expect(codigos(parseText(muchos, 'ordenar'))).toEqual(['demasiados-para-ordenar'])
  })
})

describe('lector: clasificar', () => {
  const animales = [
    { nombre: 'Mamíferos', elementos: ['perro', 'ballena', 'murciélago'] },
    { nombre: 'Aves', elementos: ['cóndor', 'pingüino', 'loica'] },
  ]

  it('categoría con dos puntos y sus elementos en la misma línea', () => {
    const l = parseText('Mamíferos: perro, ballena, murciélago\nAves: cóndor, pingüino, loica')
    expect(l.tipoSugerido).toBe('clasificar')
    expect(categorias(l)).toEqual(animales)
    expect(l.advertencias).toEqual([])
  })

  it('un elemento largo no hace que la categoría se pierda', () => {
    const texto = 'Mamíferos: puma, huemul, pudú\nAves: cóndor, loica\nReptiles: lagartija, culebra de cola larga\nPeces: congrio, jurel'
    const l = parseText(texto)
    expect(l.tipoSugerido).toBe('clasificar')
    expect(categorias(l).map((c) => c.nombre)).toEqual(['Mamíferos', 'Aves', 'Reptiles', 'Peces'])
    expect(categorias(l)[2].elementos).toEqual(['lagartija', 'culebra de cola larga'])
  })

  it('títulos de ChatGPT con viñetas debajo', () => {
    const l = parseText('### Mamíferos\n- perro\n- ballena\n- murciélago\n\n---\n\n### Aves\n- cóndor\n* pingüino\n* loica')
    expect(l.tipoSugerido).toBe('clasificar')
    expect(categorias(l)).toEqual(animales)
  })

  it('categorías en negrita y elementos debajo', () => {
    const l = parseText('**Sólidos:**\nhielo\npiedra\n\n**Líquidos:**\nagua\njugo')
    expect(categorias(l)).toEqual([
      { nombre: 'Sólidos', elementos: ['hielo', 'piedra'] },
      { nombre: 'Líquidos', elementos: ['agua', 'jugo'] },
    ])
  })

  it('tabla de Word o Excel con una columna por categoría', () => {
    const l = parseText('Sólido\tLíquido\tGaseoso\nhielo\tagua\tvapor\npiedra\tleche\taire\nmadera\t\toxígeno')
    expect(l.tipoSugerido).toBe('clasificar')
    expect(categorias(l)).toEqual([
      { nombre: 'Sólido', elementos: ['hielo', 'piedra', 'madera'] },
      { nombre: 'Líquido', elementos: ['agua', 'leche'] },
      { nombre: 'Gaseoso', elementos: ['vapor', 'aire', 'oxígeno'] },
    ])
  })

  it('una tabla de dos columnas se sugiere como parejas, pero se puede clasificar', () => {
    const texto = 'Seres vivos\tObjetos\nárbol\tsilla\nperro\tlápiz'
    expect(parseText(texto).tipoSugerido).toBe('parejas')
    expect(categorias(parseText(texto, 'clasificar'))).toEqual([
      { nombre: 'Seres vivos', elementos: ['árbol', 'perro'] },
      { nombre: 'Objetos', elementos: ['silla', 'lápiz'] },
    ])
  })

  it('avisa elementos sin categoría, categorías vacías y elementos en dos categorías', () => {
    const l = parseText('gato\nMamíferos:\n- perro\n- ballena\nAves:\nReptiles: lagarto, perro')
    expect(categorias(l).map((c) => c.nombre)).toEqual(['Mamíferos', 'Aves', 'Reptiles'])
    expect(codigos(l)).toEqual(['lineas-ignoradas', 'categoria-vacia', 'repetidos'])
    expect(l.advertencias[1].mensaje).toContain('«Aves»')
    expect(l.advertencias[2].mensaje).toContain('«perro»')
  })

  it('una sola categoría no alcanza para clasificar', () => {
    const l = parseText('Mamíferos: perro, gato', 'clasificar')
    expect(codigos(l)).toEqual(['pocas-categorias'])
  })
})

describe('lector: cada tipo explica lo que no entendió', () => {
  const tipos = ['ruleta', 'preguntas', 'parejas', 'verdadero-falso', 'ordenar', 'clasificar'] as const
  const muestras = ['', '***', 'hola', '=', 'a = ', ': x', '(V)', '| |', 'Mamíferos:']

  it.each(muestras)('con %j, en todos los tipos', (texto) => {
    for (const tipo of tipos) {
      const l = parseText(texto, tipo)
      expect(l.tipo).toBe(tipo)
      if (texto.trim() && l.elementos.length === 0) expect(l.advertencias.length).toBeGreaterThan(0)
    }
  })
})
