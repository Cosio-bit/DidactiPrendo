import { describe, expect, it } from 'vitest'
import { parseText } from '../../src/parser/parseText.ts'
import type { Adivinanza, Definicion, Frase, Lectura, Pareja } from '../../src/parser/tipos.ts'

/* Textos de ejemplo para Tarjetas, Completar la frase, Pasapalabra y ¿Quién soy? */

function codigos(lectura: Lectura) {
  return lectura.advertencias.map((a) => a.codigo)
}

function frases(lectura: Lectura): Frase[] {
  expect(lectura.tipo).toBe('completar')
  return lectura.elementos as Frase[]
}

function rosco(lectura: Lectura): Definicion[] {
  expect(lectura.tipo).toBe('pasapalabra')
  return lectura.elementos as Definicion[]
}

function adivinanzas(lectura: Lectura): Adivinanza[] {
  expect(lectura.tipo).toBe('quien-soy')
  return lectura.elementos as Adivinanza[]
}

const oculta = (texto: string) => ({ texto, oculta: true })
const vista = (texto: string) => ({ texto, oculta: false })

describe('lector: tarjetas', () => {
  it('se leen como las parejas, pero nunca se sugieren', () => {
    const texto = '¿Capital de Chile? = Santiago\nperro = dog'
    expect(parseText(texto).tipoSugerido).toBe('parejas')
    const l = parseText(texto, 'tarjetas')
    expect(l.elementos as Pareja[]).toEqual([
      { a: '¿Capital de Chile?', b: 'Santiago' },
      { a: 'perro', b: 'dog' },
    ])
    expect(l.advertencias).toEqual([])
  })

  it('avisa las líneas sin lo de atrás', () => {
    const l = parseText('perro = dog\ngato', 'tarjetas')
    expect(l.elementos).toHaveLength(1)
    expect(codigos(l)).toEqual(['lineas-ignoradas'])
    expect(l.advertencias[0].mensaje).toContain('«gato»')
  })

  it('una sola tarjeta también sirve (no es un memorice)', () => {
    const l = parseText('7 × 8 = 56', 'tarjetas')
    expect(l.elementos).toHaveLength(1)
    expect(l.advertencias).toEqual([])
  })
})

describe('lector: completar la frase', () => {
  it('las palabras entre corchetes quedan ocultas', () => {
    const l = parseText('La [fotosíntesis] ocurre en las [hojas].\nEl agua hierve a los [100] grados.')
    expect(l.tipoSugerido).toBe('completar')
    expect(frases(l)).toEqual([
      { partes: [vista('La '), oculta('fotosíntesis'), vista(' ocurre en las '), oculta('hojas'), vista('.')] },
      { partes: [vista('El agua hierve a los '), oculta('100'), vista(' grados.')] },
    ])
    expect(l.advertencias).toEqual([])
  })

  it('una palabra al comienzo o al final de la línea', () => {
    const l = parseText('[Santiago] es la capital de [Chile]')
    expect(frases(l)[0].partes).toEqual([oculta('Santiago'), vista(' es la capital de '), oculta('Chile')])
  })

  it('un título y una línea sin corchetes no se usan, y se avisa', () => {
    const l = parseText('Completa las frases:\nLa [Tierra] gira.\nEsta línea no tiene nada.')
    expect(frases(l)).toHaveLength(1)
    expect(codigos(l)).toEqual(['lineas-ignoradas'])
    expect(l.advertencias[0].mensaje).toContain('«Esta línea no tiene nada.»')
  })

  it('corchetes vacíos no son una palabra', () => {
    const l = parseText('Marca [ ] la correcta', 'completar')
    expect(l.elementos).toEqual([])
    expect(codigos(l)).toContain('sin-frases')
  })

  it('el texto de ChatGPT con negritas y numeración', () => {
    const l = parseText('1. **La [célula]** es la unidad de la vida.\n2. Los [mamíferos] tienen pelo.')
    expect(frases(l).map((f) => f.partes.find((p) => p.oculta)?.texto)).toEqual(['célula', 'mamíferos'])
  })
})

describe('lector: pasapalabra', () => {
  it('con la letra y dos puntos se sugiere, y queda en orden alfabético', () => {
    const l = parseText('C: Ave nacional de Chile = cóndor\nA: Insecto que hace miel = abeja\nÑ: Ave corredora = ñandú')
    expect(l.tipoSugerido).toBe('pasapalabra')
    expect(rosco(l)).toEqual([
      { letra: 'A', contiene: false, definicion: 'Insecto que hace miel', respuesta: 'abeja' },
      { letra: 'C', contiene: false, definicion: 'Ave nacional de Chile', respuesta: 'cóndor' },
      { letra: 'Ñ', contiene: false, definicion: 'Ave corredora', respuesta: 'ñandú' },
    ])
    expect(l.advertencias).toEqual([])
  })

  it('sin letra: la saca de la palabra, que es el lado más corto', () => {
    const l = parseText('Insecto que hace miel = abeja\nballena = Mamífero marino más grande', 'pasapalabra')
    expect(rosco(l).map((d) => [d.letra, d.respuesta])).toEqual([
      ['A', 'abeja'],
      ['B', 'ballena'],
    ])
  })

  it('"Contiene la X" y una palabra que no empieza con su letra', () => {
    const l = parseText('Contiene la X: Instrumento musical de teclas = xilófono\nZ: Fruta amarilla = plátano', 'pasapalabra')
    expect(rosco(l).map((d) => [d.letra, d.contiene])).toEqual([
      ['X', true],
      ['Z', true],
    ])
    expect(codigos(l)).toEqual(['letra-no-calza'])
    expect(l.advertencias[0].mensaje).toContain('«Z: plátano»')
  })

  it('"Con la A:" y la respuesta escrita como "Respuesta:"', () => {
    const l = parseText('Con la A: Insecto que hace miel. Respuesta: abeja', 'pasapalabra')
    expect(rosco(l)).toEqual([{ letra: 'A', contiene: false, definicion: 'Insecto que hace miel', respuesta: 'abeja' }])
  })

  it('una tabla de Excel con letra, definición y palabra', () => {
    const l = parseText('A\tInsecto que hace miel\tabeja\nB\tMamífero marino\tballena', 'pasapalabra')
    expect(rosco(l).map((d) => d.respuesta)).toEqual(['abeja', 'ballena'])
  })

  it('avisa las letras repetidas', () => {
    const l = parseText('A: Insecto que hace miel = abeja\nA: Árbol chileno = araucaria')
    expect(rosco(l)).toHaveLength(2)
    expect(codigos(l)).toEqual(['letra-repetida'])
  })

  it('"a) …" sigue siendo una alternativa de selección múltiple', () => {
    const l = parseText('¿Cuál es la solución?\na) x = 3\n*b) x = 4\nc) x = 5')
    expect(l.tipoSugerido).toBe('preguntas')
  })
})

describe('lector: ¿quién soy?', () => {
  it('la respuesta arriba y las pistas debajo, separadas por una línea vacía', () => {
    const texto = "Bernardo O'Higgins\nNací en Chillán.\nFui Director Supremo.\n\nGabriela Mistral\nFui profesora.\nGané el Nobel."
    const l = parseText(texto, 'quien-soy')
    expect(adivinanzas(l)).toEqual([
      { respuesta: "Bernardo O'Higgins", pistas: ['Nací en Chillán.', 'Fui Director Supremo.'] },
      { respuesta: 'Gabriela Mistral', pistas: ['Fui profesora.', 'Gané el Nobel.'] },
    ])
    expect(l.advertencias).toEqual([])
  })

  it('con "Respuesta:" (como lo escribe ChatGPT) se sugiere solo', () => {
    const texto = [
      '¡Claro! Aquí tienes dos adivinanzas:',
      '**Adivinanza 1**',
      '1. Vivo en el mar.',
      '2. Soy el animal más grande.',
      'Respuesta: la ballena azul',
      '**Adivinanza 2**',
      '- Pista 1: Tengo plumas.',
      '- Pista 2: Soy el ave nacional.',
      'Respuesta: el cóndor',
    ].join('\n')
    const l = parseText(texto)
    expect(l.tipoSugerido).toBe('quien-soy')
    expect(adivinanzas(l)).toEqual([
      { respuesta: 'la ballena azul', pistas: ['Vivo en el mar.', 'Soy el animal más grande.'] },
      { respuesta: 'el cóndor', pistas: ['Tengo plumas.', 'Soy el ave nacional.'] },
    ])
    expect(codigos(l)).toEqual(['lineas-ignoradas'])
  })

  it('"Respuesta: F" es de verdadero o falso', () => {
    const l = parseText('La ballena es un pez\nRespuesta: F\nEl cóndor es un ave\nRespuesta: V')
    expect(l.tipoSugerido).toBe('verdadero-falso')
  })

  it('una línea sola, sin pistas, se avisa', () => {
    const l = parseText('Gabriela Mistral', 'quien-soy')
    expect(l.elementos).toEqual([])
    expect(codigos(l)).toEqual(['lineas-ignoradas', 'sin-adivinanzas'])
  })
})

describe('lector: los tipos nuevos explican lo que no entendieron', () => {
  const tipos = ['tarjetas', 'completar', 'pasapalabra', 'quien-soy'] as const
  const muestras = ['', '***', 'hola', '=', 'a = ', ': x', '(V)', '| |', 'Mamíferos:', '[ ]', 'A:']

  it.each(muestras)('con %j, en todos los tipos', (texto) => {
    for (const tipo of tipos) {
      const l = parseText(texto, tipo)
      expect(l.tipo).toBe(tipo)
      if (texto.trim() && l.elementos.length === 0) expect(l.advertencias.length).toBeGreaterThan(0)
    }
  })
})
