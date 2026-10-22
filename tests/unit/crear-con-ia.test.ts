import { afterEach, describe, expect, it, vi } from 'vitest'
import { leerRespuesta, pedirActividades } from '../../src/ai-bridge/crearConIA.ts'
import { armarMensaje, leerPedido, LARGO_MAXIMO_PEDIDO, POST } from '../../api/crear-con-ia.ts'

const solicitud = (cuerpo: unknown) =>
  new Request('http://localhost/api/crear-con-ia', { method: 'POST', body: JSON.stringify(cuerpo) })

describe('función crear con IA: lo que recibe', () => {
  it('acepta un pedido con guía y código, sin espacios de más', () => {
    expect(leerPedido({ pedido: '  partes de la noticia ', guia: ' texto ', codigo: ' profe ' })).toEqual({
      pedido: 'partes de la noticia',
      guia: 'texto',
      codigo: 'profe',
    })
  })

  it('rechaza un pedido vacío, demasiado largo o que no es texto', () => {
    expect(leerPedido({ pedido: '   ' })).toBeNull()
    expect(leerPedido({ pedido: 'a'.repeat(LARGO_MAXIMO_PEDIDO + 1) })).toBeNull()
    expect(leerPedido({ pedido: 42 })).toBeNull()
    expect(leerPedido(null)).toBeNull()
  })

  it('pone la guía antes del pedido, cada uno en su etiqueta', () => {
    const mensaje = armarMensaje({ pedido: 'términos pareados', guia: 'El cuento es un texto narrativo.' })
    expect(mensaje.indexOf('<guia_del_profe>')).toBeLessThan(mensaje.indexOf('<pedido_del_profe>'))
    expect(armarMensaje({ pedido: 'ruleta de temas', guia: '' })).not.toContain('guia')
  })
})

describe('función crear con IA: antes de llamar a Claude', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('sin clave configurada, avisa que falta configurar', async () => {
    vi.stubEnv('key', '')
    const respuesta = await POST(solicitud({ pedido: 'partes de la noticia' }))
    expect(respuesta.status).toBe(503)
    expect(await respuesta.json()).toEqual({ error: 'sin-configurar' })
  })

  it('con código del piloto, pide el código correcto (sin importar mayúsculas)', async () => {
    vi.stubEnv('key', 'clave-de-prueba')
    vi.stubEnv('CODIGO_PILOTO', 'Profes2026')
    const sinCodigo = await POST(solicitud({ pedido: 'partes de la noticia' }))
    expect(sinCodigo.status).toBe(401)
    expect(await sinCodigo.json()).toEqual({ error: 'codigo' })
  })

  it('un pedido inválido no llega a Claude', async () => {
    vi.stubEnv('key', 'clave-de-prueba')
    const respuesta = await POST(solicitud({ pedido: '' }))
    expect(await respuesta.json()).toEqual({ error: 'pedido' })
  })
})

describe('lo que vuelve de la IA', () => {
  it('lee cada actividad con el lector de siempre y marca si se puede proyectar', () => {
    const resultado = leerRespuesta({
      mensaje: '',
      actividades: [
        {
          tipo: 'terminos-pareados',
          nombre: 'Género narrativo',
          motivo: 'Une cada concepto con su definición.',
          texto: 'Narrador | Voz que cuenta la historia\nPersonaje | Quien participa en los hechos',
        },
        { tipo: 'ruleta', nombre: 'Una sola', motivo: '', texto: 'Cuento' },
      ],
    })
    expect(resultado.ok).toBe(true)
    if (!resultado.ok) return
    const [pareados, ruleta] = resultado.actividades
    expect(pareados.lectura.tipo).toBe('terminos-pareados')
    expect(pareados.lectura.elementos).toHaveLength(2)
    expect(pareados.usable).toBe(true)
    // Una ruleta de un solo elemento no se puede proyectar.
    expect(ruleta.usable).toBe(false)
  })

  it('descarta actividades de un tipo que no existe', () => {
    const resultado = leerRespuesta({ mensaje: '', actividades: [{ tipo: 'sopa-de-letras', nombre: 'x', motivo: '', texto: 'a' }] })
    expect(resultado).toEqual({ ok: true, actividades: [], mensaje: '' })
  })

  it('traduce los errores conocidos y deja los desconocidos como falla', () => {
    expect(leerRespuesta({ error: 'sin-creditos' })).toEqual({ ok: false, error: 'sin-creditos' })
    expect(leerRespuesta({ error: 'otra-cosa' })).toEqual({ ok: false, error: 'falla' })
    expect(leerRespuesta('no es un objeto')).toEqual({ ok: false, error: 'falla' })
  })

  it('si la ruta no existe (por ejemplo, en el servidor de desarrollo), dice que no está disponible', async () => {
    const sinFuncion = (async () => new Response('', { status: 404 })) as typeof fetch
    expect(await pedirActividades({ pedido: 'x', guia: '', codigo: '' }, sinFuncion)).toEqual({
      ok: false,
      error: 'no-disponible',
    })
  })
})
