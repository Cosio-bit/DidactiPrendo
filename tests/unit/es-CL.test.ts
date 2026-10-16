import { describe, expect, it } from 'vitest'
import { textos } from '../../src/i18n/es-CL.ts'

describe('textos en español', () => {
  it('saluda al profe en la pantalla de inicio', () => {
    expect(textos.inicio.saludo).toBe('Hola, profe')
  })
})
