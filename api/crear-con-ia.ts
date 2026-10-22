// Función de Vercel: arma actividades con Claude a partir del pedido del profe (y su guía, si la pega).
// Es lo único de la app que pasa por un servidor, y solo cuando el profe usa "Crear con IA".
// La clave de la API vive en la variable de entorno `key` de Vercel: nunca llega al navegador.
// Si la clave no pertenece a un espacio de trabajo (workspace), se indica cuál en WORKSPACE_ID.
// No se guarda nada: el pedido va a Claude, la respuesta vuelve al profe y se olvida.
import Anthropic from '@anthropic-ai/sdk'

const MODELO = 'claude-sonnet-5-5'
/** Topes por pedido, para que ninguno cueste de más. */
export const LARGO_MAXIMO_PEDIDO = 1500
export const LARGO_MAXIMO_GUIA = 40_000

export const TIPOS = [
  'ruleta',
  'preguntas',
  'parejas',
  'terminos-pareados',
  'verdadero-falso',
  'ordenar',
  'clasificar',
] as const

/** Lo que la app le pide a Claude que devuelva, siempre con esta forma. */
export const ESQUEMA_RESPUESTA = {
  type: 'object',
  properties: {
    actividades: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          tipo: { type: 'string', enum: [...TIPOS] },
          nombre: { type: 'string' },
          motivo: { type: 'string' },
          texto: { type: 'string' },
        },
        required: ['tipo', 'nombre', 'motivo', 'texto'],
        additionalProperties: false,
      },
    },
    mensaje: { type: 'string' },
  },
  required: ['actividades', 'mensaje'],
  additionalProperties: false,
}

export const INSTRUCCIONES = `Eres el asistente de DidactiPrendo, una aplicación con la que profesores chilenos de 5° a 8° básico arman actividades para proyectar en la sala con un data o una pizarra interactiva. El profe te cuenta qué quiere repasar o preparar, a veces con el texto de su guía o material, y tú eliges la actividad que mejor sirve y escribes su contenido.

## Las actividades
- ruleta: sortear al azar. Sirve para temas, preguntas para conversar o turnos. Nunca inventes nombres de estudiantes: si el profe quiere sortear a su curso, no armes la actividad y explícale en "mensaje" que pegue su lista en "Crear actividad".
- preguntas: selección múltiple, para comprobar comprensión o repasar contenidos con una respuesta correcta.
- parejas: memorice; el curso da vuelta cartas hasta encontrar cada pareja. Solo con textos muy cortos (palabra con palabra, término con ejemplo breve, traducción).
- terminos-pareados: unir cada concepto con su definición. Para vocabulario y conceptos con definiciones de una frase.
- verdadero-falso: afirmaciones para decidir si son verdaderas o falsas. Para detectar ideas erróneas.
- ordenar: poner en orden pasos, etapas, hechos o partes de una secuencia (por ejemplo, las partes de una noticia o las etapas de un proceso).
- clasificar: separar elementos en 2 a 4 grupos (por ejemplo, tipos de textos o seres vivos por clase).

Elige la actividad que mejor sirve al objetivo del profe. Si el profe nombra una actividad, usa esa. Por defecto arma una sola actividad; si pide varias, o pide preparar una clase, una prueba o el trabajo con una guía, arma de 2 a 3 actividades distintas que se complementen, de la más simple a la más exigente.

## El campo "texto": formato exacto que lee la aplicación
Escribe solo el contenido, sin títulos, sin explicaciones, sin markdown (nada de **, # ni tablas).
- ruleta: un elemento por línea, entre 6 y 16 elementos, de pocas palabras.
- preguntas: entre 5 y 10 preguntas. Cada una: la pregunta en una línea terminada en "?" y debajo 3 o 4 alternativas "a) ...", "b) ...", "c) ...", "d) ...". Pon un * al inicio de la única alternativa correcta, por ejemplo "*b) 3/4". Deja una línea vacía entre preguntas. Varía la letra de la correcta.
- parejas: entre 6 y 10 líneas "palabra = pareja", cada lado de 1 a 4 palabras.
- terminos-pareados: entre 5 y 8 líneas "concepto | definición". Concepto de hasta 4 palabras; definición de una frase de hasta 20 palabras que no repita el concepto.
- verdadero-falso: entre 6 y 10 afirmaciones, una por línea, terminadas en " (V)" o " (F)". Mezcla verdaderas y falsas; las falsas deben ser errores típicos de estudiantes, nunca trampas de redacción.
- ordenar: entre 4 y 8 elementos, uno por línea, en el orden correcto y sin numerar. La aplicación los desordena al proyectar.
- clasificar: de 2 a 4 líneas "Categoría: elemento, elemento, elemento", con 3 a 6 elementos cortos por categoría. Cada elemento pertenece a una sola categoría.

## Cómo escribir
- Español de Chile, con vocabulario escolar chileno y al nivel del curso que indique el profe (si no lo indica, piensa en 6° básico). Letra que se lee de lejos: frases cortas y claras.
- El contenido debe ser correcto. Si el profe adjunta su guía, básate solo en ella y no agregues datos que no estén ahí. Si no estás seguro de un dato, no lo uses.
- Nunca escribas nombres de estudiantes ni datos personales.
- "nombre": cómo se llamará la actividad, de hasta 40 letras (por ejemplo "Partes de la noticia").
- "motivo": una frase simple para el profe que diga por qué conviene esta actividad para lo que pidió.
- "mensaje": déjalo vacío si armaste las actividades. Si el pedido no se puede convertir en una actividad escolar, deja "actividades" vacío y explica en "mensaje", en una o dos frases amables, qué puede pedir.`

export interface Pedido {
  pedido: string
  guia: string
  codigo: string
}

/** Lee el cuerpo de la solicitud, o null si no trae un pedido válido. */
export function leerPedido(cuerpo: unknown): Pedido | null {
  if (typeof cuerpo !== 'object' || cuerpo === null) return null
  const c = cuerpo as Record<string, unknown>
  const texto = (valor: unknown) => (typeof valor === 'string' ? valor.trim() : '')
  const pedido = texto(c.pedido)
  const guia = texto(c.guia)
  if (!pedido || pedido.length > LARGO_MAXIMO_PEDIDO || guia.length > LARGO_MAXIMO_GUIA) return null
  return { pedido, guia, codigo: texto(c.codigo) }
}

/** El mensaje para Claude: primero la guía (si hay) y al final el pedido. */
export function armarMensaje({ pedido, guia }: Pick<Pedido, 'pedido' | 'guia'>): string {
  const partes = []
  if (guia) partes.push(`<guia_del_profe>\n${guia}\n</guia_del_profe>`)
  partes.push(`<pedido_del_profe>\n${pedido}\n</pedido_del_profe>`)
  return partes.join('\n\n')
}

/** Por qué no se pudo; la app lo traduce a un aviso para el profe. */
export type CodigoError =
  | 'pedido'
  | 'codigo'
  | 'sin-configurar'
  | 'clave'
  | 'sin-creditos'
  | 'ocupado'
  | 'rechazo'
  | 'falla'

function responder(datos: unknown, estado = 200) {
  return Response.json(datos, { status: estado, headers: { 'Cache-Control': 'no-store' } })
}
const error = (codigo: CodigoError, estado: number) => responder({ error: codigo }, estado)

export async function POST(solicitud: Request): Promise<Response> {
  const clave = process.env.key
  if (!clave) return error('sin-configurar', 503)

  const pedido = leerPedido(await solicitud.json().catch(() => null))
  if (!pedido) return error('pedido', 400)

  // Código del piloto: si está configurado en Vercel (CODIGO_PILOTO), solo lo usa quien lo conoce.
  const codigoPiloto = process.env.CODIGO_PILOTO?.trim()
  if (codigoPiloto && pedido.codigo.toLowerCase() !== codigoPiloto.toLowerCase()) return error('codigo', 401)

  const espacio = process.env.WORKSPACE_ID?.trim()
  const cliente = new Anthropic({
    apiKey: clave,
    maxRetries: 1,
    timeout: 55_000,
    defaultHeaders: espacio ? { 'anthropic-workspace-id': espacio } : undefined,
  })
  try {
    const respuesta = await cliente.beta.messages.create({
      model: MODELO,
      max_tokens: 8000,
      // Si el modelo rechazara el pedido por una categoría que tiene respaldo, otro modelo lo responde.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      // Esfuerzo bajo: armar una actividad no necesita pensar mucho, y así rinden más los créditos.
      output_config: { effort: 'low', format: { type: 'json_schema', schema: ESQUEMA_RESPUESTA } },
      system: INSTRUCCIONES,
      messages: [{ role: 'user', content: armarMensaje(pedido) }],
    })

    if (respuesta.stop_reason === 'refusal') return error('rechazo', 422)
    const texto = respuesta.content.find((bloque) => bloque.type === 'text')
    if (respuesta.stop_reason === 'max_tokens' || !texto || texto.type !== 'text') {
      console.error('Respuesta incompleta', respuesta.id, respuesta.stop_reason)
      return error('falla', 502)
    }
    return responder(JSON.parse(texto.text))
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) {
      // El tope de gasto del mes llega como 429 sin "retry-after"; lo demás es exceso de pedidos por minuto.
      return e.headers?.get('retry-after') ? error('ocupado', 429) : error('sin-creditos', 402)
    }
    if (e instanceof Anthropic.BadRequestError && /usage limits|credit balance/i.test(e.message)) {
      return error('sin-creditos', 402)
    }
    // Clave inválida, sin permiso o sin espacio de trabajo: lo tiene que arreglar quien administra la app.
    if (
      e instanceof Anthropic.AuthenticationError ||
      e instanceof Anthropic.PermissionDeniedError ||
      (e instanceof Anthropic.BadRequestError && /workspace/i.test(e.message))
    ) {
      console.error('Problema con la clave de la API', e.message)
      return error('clave', 500)
    }
    console.error('Error al llamar a Claude', e)
    return error('falla', 502)
  }
}
