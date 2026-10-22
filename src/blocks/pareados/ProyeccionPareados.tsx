import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { textos } from '../../i18n/es-CL.ts'
import type { Pareja } from '../../parser/tipos.ts'
import { AyudaTeclas } from '../../projection/AyudaTeclas.tsx'
import { useArrastrar } from '../../projection/useArrastrar.ts'
import { useAtajos } from '../../projection/useAtajos.ts'
import { usePantallaCompleta } from '../../projection/usePantallaCompleta.ts'
import { useTextoAjustado } from '../../projection/useTextoAjustado.ts'
import { Boton } from '../../ui/Boton.tsx'
import {
  agarrar,
  deshacer,
  estaUnida,
  nuevoPareados,
  revelarSiguiente,
  soltarElegido,
  soltarSobre,
  terminado,
  tocar,
  type Lado,
  type Pareados,
} from './logica.ts'

const t = textos.proyeccion

/** Un color por pareja unida, para seguir cada línea aunque se crucen con otras. */
const COLORES_UNION = [
  'var(--tipo-preguntas)',
  'var(--tipo-parejas)',
  'var(--tipo-verdadero-falso)',
  'var(--tipo-ordenar)',
  'var(--tipo-clasificar)',
  'var(--tipo-terminos-pareados)',
]
const colorDe = (pareja: number) => COLORES_UNION[pareja % COLORES_UNION.length]

/** Cada mitad se nombra "concepto-3" o "definicion-3": sirve de destino al soltar y de clave al arrastrar. */
const clave = ({ lado, pareja }: Lado) => `${lado}-${pareja}`
function leerClave(texto: string): Lado {
  const [lado, pareja] = texto.split('-')
  return { lado: lado === 'concepto' ? 'concepto' : 'definicion', pareja: Number(pareja) }
}

interface Linea {
  pareja: number
  x1: number
  y1: number
  x2: number
  y2: number
}

interface Props {
  titulo: string
  parejas: Pareja[]
  onSalir: () => void
  /** "Volver a Mis actividades" o "Volver a editar", según de dónde se llegó. */
  textoVolver: string
}

export function ProyeccionPareados({ titulo, parejas, onSalir, textoVolver }: Props) {
  const [juego, setJuego] = useState<Pareados>(() => nuevoPareados(parejas))
  const pantallaCompleta = usePantallaCompleta()
  const listo = terminado(juego)
  const total = parejas.length

  // Números 1 a 9: elegir ese concepto.
  const numeros = Object.fromEntries(
    parejas.slice(0, 9).map((_, i) => [String(i + 1), () => setJuego((j) => tocar(j, { lado: 'concepto', pareja: i }))]),
  )
  useAtajos({
    avanzar: () => setJuego(revelarSiguiente),
    retroceder: () => setJuego(deshacer),
    // Con algo elegido, Esc solo lo suelta; si no, sale de la proyección.
    salir: () => (juego.elegido !== null ? setJuego(soltarElegido) : onSalir()),
    pantallaCompleta: pantallaCompleta.alternar,
    otras: numeros,
  })

  // Arrastrar un concepto hasta su definición (o al revés), con mouse, dedo o lápiz.
  const { fantasma, arrastrable, fueArrastre } = useArrastrar<string>({
    agarrado: juego.elegido && clave(juego.elegido),
    alSoltar: (arrastrado, destino) => setJuego((j) => soltarSobre(j, leerClave(arrastrado), leerClave(destino))),
    alSoltarFuera: (arrastrado) => setJuego((j) => agarrar(j, leerClave(arrastrado))),
  })

  // La letra se calcula una vez, con todas las tarjetas a la vista: no cambia en cada jugada.
  const contenido = useTextoAjustado<HTMLDivElement>('pareados', 44)
  const columnas = useRef<HTMLDivElement>(null)

  // Las líneas que unen cada pareja: de borde a borde de sus tarjetas. Se vuelven a medir si cambia
  // el tamaño de la pantalla o de la letra.
  const [lineas, setLineas] = useState<Linea[]>([])
  useLayoutEffect(() => {
    const caja = contenido.current
    if (!caja) return
    function medir() {
      const base = caja!.getBoundingClientRect()
      const borde = (selector: string) => caja!.querySelector(selector)?.getBoundingClientRect()
      setLineas(
        juego.unidas.flatMap((pareja) => {
          const a = borde(`[data-destino="concepto-${pareja}"]`)
          const b = borde(`[data-destino="definicion-${pareja}"]`)
          if (!a || !b) return []
          return [
            {
              pareja,
              x1: a.right - base.left,
              y1: a.top + a.height / 2 - base.top,
              x2: b.left - base.left,
              y2: b.top + b.height / 2 - base.top,
            },
          ]
        }),
      )
    }
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(caja)
    if (columnas.current) observador.observe(columnas.current)
    return () => observador.disconnect()
  }, [juego.unidas, contenido])

  function tarjeta(mitad: Lado, fila: number) {
    const { lado, pareja } = mitad
    const unida = estaUnida(juego, pareja)
    const elegida = juego.elegido?.lado === lado && juego.elegido.pareja === pareja
    const errada = juego.errado?.[lado] === pareja
    const k = clave(mitad)
    const clases = ['ficha', 'pareado', `pareado--${lado}`]
    if (unida) clases.push('pareado--unido')
    if (elegida) clases.push('ficha--elegida')
    if (errada) clases.push('ficha--errada')
    if (fantasma?.destino === k && !unida) clases.push('pareado--destino')
    if (fantasma?.ancho !== undefined && fantasma.item === k) clases.push('ficha--arrastrada')
    const estilo = { gridRow: fila + 2, '--union': colorDe(pareja) } as CSSProperties
    return (
      <button
        key={k}
        type="button"
        className={clases.join(' ')}
        style={estilo}
        aria-pressed={elegida}
        aria-disabled={unida}
        data-destino={k}
        {...(unida ? {} : arrastrable(k))}
        onClick={() => !fueArrastre(k) && setJuego((j) => tocar(j, mitad))}
      >
        {lado === 'concepto' ? (
          <>
            <span className="ficha__letra">{pareja + 1}</span>{' '}
            <span>{parejas[pareja].a}</span>
          </>
        ) : (
          <>
            {/* Como en la prueba en papel: al unirla, la definición muestra el número de su concepto. */}
            <span className="pareado__casilla">{unida ? pareja + 1 : ''}</span>{' '}
            <span>{parejas[pareja].b}</span>
          </>
        )}
        {errada && lado === 'definicion' && <strong className="ficha__marca">✗ {t.noEsSuDefinicion}</strong>}
      </button>
    )
  }

  const aviso = listo
    ? t.pareadosTerminado
    : juego.errado
      ? t.noEsSuDefinicion
      : t.unidos(juego.unidas.length, total)

  return (
    <div className="proyeccion proyeccion-ordenar proyeccion-pareados">
      <div className="proyeccion-preguntas__barra">
        <p className="proyeccion-preguntas__numero proyeccion__titulo" title={titulo}>
          {titulo}
        </p>
        <p
          className={juego.errado && !listo ? 'proyeccion-parejas__aviso proyeccion-parejas__aviso--no-pareja' : 'proyeccion-parejas__aviso'}
          aria-live="polite"
        >
          {aviso}
        </p>
        <div className="proyeccion__secundarios">
          <Boton variante="navegacion" onClick={onSalir}>{textoVolver}</Boton>
          <Boton variante="herramienta" onClick={() => setJuego(nuevoPareados(parejas))}>{t.volverAEmpezar}</Boton>
          {pantallaCompleta.disponible && (
            <Boton variante="herramienta" onClick={pantallaCompleta.alternar}>
              {pantallaCompleta.activa ? t.salirPantallaCompleta : t.pantallaCompleta}
            </Boton>
          )}
        </div>
      </div>

      <div ref={contenido} className="proyeccion-pareados__contenido">
        <svg className="proyeccion-pareados__lineas" aria-hidden="true">
          {lineas.map((l) => (
            <line key={l.pareja} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={colorDe(l.pareja)} />
          ))}
        </svg>
        <div ref={columnas} className="proyeccion-pareados__columnas">
          <p className="proyeccion-pareados__encabezado">{t.columnaConceptos}</p>
          <p className="proyeccion-pareados__encabezado proyeccion-pareados__encabezado--definiciones">
            {t.columnaDefiniciones}
          </p>
          {parejas.map((_, i) => tarjeta({ lado: 'concepto', pareja: i }, i))}
          {juego.orden.map((pareja, fila) => tarjeta({ lado: 'definicion', pareja }, fila))}
        </div>

        {/* La copia que sigue al puntero (dentro del contenido, para tener su mismo tamaño de letra). */}
        {fantasma && (
          <div
            className="ficha ficha--fantasma"
            aria-hidden="true"
            style={{ left: fantasma.x, top: fantasma.y, width: fantasma.ancho }}
          >
            {(() => {
              const { lado, pareja } = leerClave(fantasma.item)
              return lado === 'concepto' ? parejas[pareja].a : parejas[pareja].b
            })()}
          </div>
        )}
      </div>

      <div className="proyeccion-preguntas__controles">
        <Boton variante="herramienta" onClick={() => setJuego(deshacer)} disabled={juego.unidas.length === 0}>
          {t.deshacerPaso}
        </Boton>
        <Boton
          variante="principal"
          className="proyeccion-preguntas__avanzar"
          onClick={() => setJuego(revelarSiguiente)}
          disabled={listo}
        >
          {t.revelarSiguiente}
        </Boton>
      </div>
      <AyudaTeclas indicacion={juego.elegido !== null}>
        {juego.elegido === null
          ? t.teclasPareados
          : juego.elegido.lado === 'concepto'
            ? t.elegirDefinicion
            : t.elegirConcepto}
      </AyudaTeclas>
    </div>
  )
}
