// Pide actividades a la IA (función /api/crear-con-ia de Vercel) y revisa lo que vuelve
// con el mismo lector del texto pegado: así, lo que propone la IA se ve y se edita igual que lo escrito a mano.
import { esTipoConTexto, sePuedeProyectar } from '../blocks/catalogo.ts'
import { parseText } from '../parser/parseText.ts'
import type { Lectura, TipoLectura } from '../parser/tipos.ts'

export const RUTA_API = '/api/crear-con-ia'

export interface ActividadIA {
  tipo: TipoLectura
  nombre: string
  /** Por qué la IA eligió esta actividad, en una frase para el profe. */
  motivo: string
  /** El texto en el formato del lector, tal como se verá en el editor. */
  texto: string
  lectura: Lectura
  /** Tiene lo mínimo para proyectarse. */
  usable: boolean
}

export type ErrorIA =
  | 'pedido'
  | 'codigo'
  | 'sin-configurar'
  | 'clave'
  | 'sin-creditos'
  | 'ocupado'
  | 'rechazo'
  | 'falla'
  | 'sin-internet'
  | 'no-disponible'

export type ResultadoIA =
  | { ok: true; actividades: ActividadIA[]; mensaje: string }
  | { ok: false; error: ErrorIA }

const ERRORES_DEL_SERVIDOR: ErrorIA[] = [
  'pedido',
  'codigo',
  'sin-configurar',
  'clave',
  'sin-creditos',
  'ocupado',
  'rechazo',
  'falla',
]

/** Convierte la respuesta de la función en actividades listas para mostrar. Nunca lanza errores. */
export function leerRespuesta(datos: unknown): ResultadoIA {
  if (typeof datos !== 'object' || datos === null) return { ok: false, error: 'falla' }
  const d = datos as Record<string, unknown>
  if (typeof d.error === 'string') {
    return { ok: false, error: ERRORES_DEL_SERVIDOR.includes(d.error as ErrorIA) ? (d.error as ErrorIA) : 'falla' }
  }
  if (!Array.isArray(d.actividades)) return { ok: false, error: 'falla' }
  const actividades = d.actividades.flatMap((a: unknown): ActividadIA[] => {
    if (typeof a !== 'object' || a === null) return []
    const { tipo, nombre, motivo, texto } = a as Record<string, unknown>
    if (typeof tipo !== 'string' || !esTipoConTexto(tipo as never) || typeof texto !== 'string') return []
    const lectura = parseText(texto, tipo as TipoLectura)
    return [
      {
        tipo: tipo as TipoLectura,
        nombre: typeof nombre === 'string' ? nombre.trim().slice(0, 60) : '',
        motivo: typeof motivo === 'string' ? motivo.trim() : '',
        texto,
        lectura,
        usable: sePuedeProyectar(lectura.tipo, lectura.elementos),
      },
    ]
  })
  return { ok: true, actividades, mensaje: typeof d.mensaje === 'string' ? d.mensaje.trim() : '' }
}

/** Solo si el navegador confirma que no hay conexión (si no lo sabe, se intenta igual). */
const sinConexion = () => navigator.onLine === false

export async function pedirActividades(
  pedido: { pedido: string; guia: string; codigo: string },
  enviar: typeof fetch = fetch,
): Promise<ResultadoIA> {
  if (sinConexion()) return { ok: false, error: 'sin-internet' }
  try {
    const respuesta = await enviar(RUTA_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedido),
    })
    // Sin la función (por ejemplo, en el servidor de desarrollo) la ruta no existe.
    if (respuesta.status === 404 || respuesta.status === 405) return { ok: false, error: 'no-disponible' }
    return leerRespuesta(await respuesta.json().catch(() => null))
  } catch {
    return { ok: false, error: sinConexion() ? 'sin-internet' : 'falla' }
  }
}
