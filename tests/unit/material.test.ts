import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { esMaterial, leerMaterial, MAXIMO_BYTES_ARCHIVO, textoDeWord } from '../../src/ai-bridge/material.ts'
import { cuerpoDelPedido, leerRespuesta } from '../../src/ai-bridge/crearConIA.ts'
import { armarContenido, armarPedido, leerPedido } from '../../api/crear-con-ia.ts'

const archivo = (nombre: string, tipo = '') => new File([readFileSync(`tests/fixtures/${nombre}`)], nombre, { type: tipo })

describe('guía o material: leer el archivo que sube el profe', () => {
  it('un Word: un párrafo por línea, con las celdas de las tablas y sin el formato', async () => {
    const lectura = await leerMaterial(archivo('guia-noticia.docx'))
    expect(lectura).toEqual({
      ok: true,
      material: {
        tipo: 'texto',
        nombre: 'guia-noticia.docx',
        texto: 'Guía: las partes de la noticia\nEl titular resume lo más importante & atrae al lector.\nBajada\nAmplía el titular\t(opcional)',
      },
    })
  })

  it('un PowerPoint: diapositiva por diapositiva, en su orden (la 2 antes que la 10)', async () => {
    const lectura = await leerMaterial(archivo('ciclo-agua.pptx'))
    expect(lectura.ok && lectura.material.tipo === 'texto' && lectura.material.texto).toBe(
      'Diapositiva 1\nEl ciclo del agua\n\nDiapositiva 2\nEvaporación\n\nDiapositiva 3\nPrecipitación\nEl agua cae',
    )
  })

  it('un PDF se envía tal cual, en base64', async () => {
    const lectura = await leerMaterial(archivo('guia.pdf', 'application/pdf'))
    expect(lectura.ok && lectura.material.tipo).toBe('pdf')
    if (lectura.ok && lectura.material.tipo === 'pdf') {
      expect(atob(lectura.material.datos)).toContain('%PDF-1.4')
    }
  })

  it('un PDF muy pesado no se envía', async () => {
    const grande = new File([new Uint8Array(MAXIMO_BYTES_ARCHIVO + 1)], 'grande.pdf', { type: 'application/pdf' })
    expect(await leerMaterial(grande)).toEqual({ ok: false, error: 'pesado' })
  })

  it('un texto plano y uno vacío', async () => {
    expect(await leerMaterial(new File(['  Fracciones\r\n1/2 + 1/4  '], 'apuntes.txt'))).toEqual({
      ok: true,
      material: { tipo: 'texto', nombre: 'apuntes.txt', texto: 'Fracciones\n1/2 + 1/4' },
    })
    expect(await leerMaterial(new File(['   '], 'vacio.txt'))).toEqual({ ok: false, error: 'vacio' })
  })

  it('un Word antiguo, un archivo cualquiera y uno dañado explican qué pasó', async () => {
    expect(await leerMaterial(new File(['x'], 'guia.doc'))).toEqual({ ok: false, error: 'antiguo' })
    expect(await leerMaterial(new File(['x'], 'musica.mp3'))).toEqual({ ok: false, error: 'formato' })
    expect(await leerMaterial(new File(['no es un zip'], 'roto.docx'))).toEqual({ ok: false, error: 'danado' })
  })

  it('distingue una guía de un archivo de actividades', () => {
    expect(esMaterial({ name: 'Guía 6°B.PDF', type: '' })).toBe(true)
    expect(esMaterial({ name: 'foto.jpg', type: 'image/jpeg' })).toBe(true)
    expect(esMaterial({ name: 'actividades-didactiprendo.json', type: 'application/json' })).toBe(false)
  })

  it('las entidades del XML se convierten en letras', () => {
    expect(textoDeWord('<w:p><w:r><w:t>1 &lt; 2 &#x00F1; &#241;</w:t></w:r></w:p>')).toBe('1 < 2 ñ ñ')
  })
})

describe('crear con IA: lo que se envía', () => {
  it('el texto de un Word se suma a la guía pegada; un PDF va aparte', () => {
    const conWord = cuerpoDelPedido({
      pedido: '',
      guia: 'Notas mías',
      codigo: '',
      material: { tipo: 'texto', nombre: 'guia.docx', texto: 'Titular y bajada' },
    })
    expect(conWord.guia).toBe('Notas mías\n\n(Archivo «guia.docx»)\nTitular y bajada')
    expect(conWord.archivo).toBeNull()

    const conPdf = cuerpoDelPedido({
      pedido: 'partes de la noticia',
      guia: '',
      codigo: '',
      material: { tipo: 'pdf', nombre: 'guia.pdf', datos: 'JVBERi0=', mediaType: 'application/pdf' },
    })
    expect(conPdf.archivo).toEqual({ tipo: 'pdf', mediaType: 'application/pdf', datos: 'JVBERi0=', nombre: 'guia.pdf' })
  })

  it('el servidor acepta solo la guía, sin pedido', () => {
    expect(leerPedido({ guia: 'La noticia tiene titular, bajada y cuerpo.' })).toMatchObject({ pedido: '' })
    expect(
      leerPedido({ archivo: { tipo: 'pdf', mediaType: 'application/pdf', datos: 'JVBERi0=', nombre: 'g.pdf' } }),
    ).not.toBeNull()
    expect(leerPedido({})).toBeNull()
  })

  it('el servidor rechaza archivos que no son PDF ni foto, o que no vienen en base64', () => {
    const conArchivo = (archivo: unknown) => leerPedido({ pedido: 'x', archivo })
    expect(conArchivo({ tipo: 'pdf', mediaType: 'text/html', datos: 'JVBERi0=' })).toBeNull()
    expect(conArchivo({ tipo: 'imagen', mediaType: 'image/jpeg', datos: 'no es <base64>' })).toBeNull()
    expect(conArchivo({ tipo: 'imagen', mediaType: 'image/jpeg', datos: '/9j/4AAQ' })).not.toBeNull()
  })

  it('al pedir otras: van las anteriores, el comentario y los tipos (solo los que existen)', () => {
    const pedido = leerPedido({
      guia: 'Guía',
      comentario: 'que identifiquen cada parte en una noticia real',
      anteriores: [{ tipo: 'ordenar', nombre: 'Orden de la noticia' }, { tipo: 'inventado', nombre: 'x' }],
      tipos: ['preguntas', 'preguntas', 'otro'],
    })!
    expect(pedido.anteriores).toEqual([{ tipo: 'ordenar', nombre: 'Orden de la noticia' }])
    expect(pedido.tipos).toEqual(['preguntas'])
    const texto = armarPedido(pedido)
    expect(texto).toContain('El profe no escribió un pedido')
    expect(texto).toContain('<propuestas_anteriores>\n- ordenar: Orden de la noticia\n</propuestas_anteriores>')
    expect(texto).toContain('que identifiquen cada parte en una noticia real')
    expect(texto).toContain('<tipos_que_quiere>\npreguntas\n</tipos_que_quiere>')
  })

  it('la guía va primero y queda en caché; el pedido va al final', () => {
    const pedido = leerPedido({
      pedido: 'para 6° básico',
      guia: 'Texto de la guía',
      archivo: { tipo: 'pdf', mediaType: 'application/pdf', datos: 'JVBERi0=', nombre: 'guia.pdf' },
    })!
    const contenido = armarContenido(pedido)
    expect(contenido.map((b) => b.type)).toEqual(['document', 'text', 'text'])
    expect(contenido[0]).not.toHaveProperty('cache_control')
    expect(contenido[1]).toMatchObject({ cache_control: { type: 'ephemeral' } })
    expect(contenido[2]).toMatchObject({ text: expect.stringContaining('para 6° básico') })
  })

  it('la respuesta trae lo que la IA entendió de la guía', () => {
    const resultado = leerRespuesta({
      entendido: '  La guía enseña las partes de la noticia.  ',
      mensaje: '',
      actividades: [{ tipo: 'ordenar', nombre: 'Estructura', motivo: 'Para ordenar', texto: 'Titular\nBajada\nCuerpo' }],
    })
    expect(resultado).toMatchObject({ ok: true, entendido: 'La guía enseña las partes de la noticia.' })
  })
})
