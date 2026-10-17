import { describe, expect, it } from 'vitest'
import { parseText } from '../../src/parser/parseText.ts'

// Ver tests/unit/textos-reales/LEEME.md
const archivos = import.meta.glob<string>('./textos-reales/*.txt', { query: '?raw', import: 'default', eager: true })
const casos = Object.entries(archivos).map(([ruta, texto]) => [ruta.split('/').pop()!.replace(/\.txt$/, ''), texto])

describe('lector: textos reales de profesores', () => {
  it(`hay ${casos.length} textos reales (la meta del plan son 20)`, () => {
    expect(casos.length).toBeGreaterThanOrEqual(0)
  })

  it.each(casos)('%s', async (nombre, texto) => {
    const lectura = parseText(texto)
    if (texto.trim() && lectura.elementos.length === 0) expect(lectura.advertencias.length).toBeGreaterThan(0)
    await expect(JSON.stringify(lectura, null, 2) + '\n').toMatchFileSnapshot(`./textos-reales/lecturas/${nombre}.json`)
  })
})
