import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { textos } from '../../i18n/es-CL.ts'
import type { Pareja } from '../../parser/tipos.ts'
import { useAtajos } from '../../projection/useAtajos.ts'
import { usePantallaCompleta } from '../../projection/usePantallaCompleta.ts'
import { useTamano } from '../../projection/useTamano.ts'
import { useTextoAjustado } from '../../projection/useTextoAjustado.ts'
import { Boton } from '../../ui/Boton.tsx'
import {
  columnasParaGrilla,
  estaVisible,
  nuevoMemorice,
  tapar,
  terminado,
  voltear,
  type Carta,
  type Memorice,
} from './logica.ts'

const t = textos.proyeccion

interface PropsCarta {
  carta: Carta
  numero: number
  visible: boolean
  encontrada: boolean
  onVoltear: () => void
  onTecla: (evento: KeyboardEvent<HTMLButtonElement>) => void
  refBoton: (boton: HTMLButtonElement | null) => void
}

function CartaMemorice({ carta, numero, visible, encontrada, onVoltear, onTecla, refBoton }: PropsCarta) {
  const cara = useTextoAjustado<HTMLSpanElement>(carta.texto, 48)
  const clases = ['carta']
  if (visible) clases.push('carta--visible')
  if (encontrada) clases.push('carta--encontrada')
  return (
    <button
      ref={refBoton}
      type="button"
      className={clases.join(' ')}
      onClick={onVoltear}
      onKeyDown={onTecla}
      aria-label={visible ? `${numero}: ${carta.texto}` : t.cartaTapada(numero)}
    >
      <span className="carta__interior" aria-hidden="true">
        <span className="carta__dorso">{numero}</span>
        <span ref={cara} className="carta__cara">
          {carta.texto}
        </span>
      </span>
    </button>
  )
}

interface Props {
  parejas: Pareja[]
  onSalir: () => void
}

export function ProyeccionParejas({ parejas, onSalir }: Props) {
  const [memorice, setMemorice] = useState<Memorice>(() => nuevoMemorice(parejas))
  const [mostrarTodas, setMostrarTodas] = useState(false)
  const pantallaCompleta = usePantallaCompleta()
  const [zona, { ancho, alto }] = useTamano<HTMLDivElement>()
  const botones = useRef<(HTMLButtonElement | null)[]>([])

  const total = memorice.cartas.length
  const columnas = ancho > 0 ? columnasParaGrilla(total, ancho, alto) : Math.ceil(Math.sqrt(total))
  const listo = terminado(memorice)

  useAtajos({ salir: onSalir, pantallaCompleta: pantallaCompleta.alternar })

  // Para usar solo con teclado: el foco parte en la primera carta.
  useEffect(() => {
    botones.current[0]?.focus()
  }, [])

  function voltearCarta(indice: number) {
    setMostrarTodas(false)
    setMemorice((m) => voltear(m, indice))
  }

  function volverAEmpezar() {
    setMostrarTodas(false)
    setMemorice(nuevoMemorice(parejas))
    botones.current[0]?.focus()
  }

  /** Flechas para moverse por la grilla; Enter o espacio voltean la carta (botón normal). */
  function moverFoco(evento: KeyboardEvent<HTMLButtonElement>, indice: number) {
    const salto = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columnas, ArrowUp: -columnas }[evento.key]
    if (salto === undefined) return
    evento.preventDefault()
    const destino = indice + salto
    if (destino >= 0 && destino < total) botones.current[destino]?.focus()
  }

  const aviso = listo
    ? t.memoriceTerminado
    : memorice.ultimo === 'pareja'
      ? t.esPareja
      : memorice.ultimo === 'no-pareja'
        ? t.noEsPareja
        : t.memoriceInicio

  return (
    <div className="proyeccion proyeccion-parejas">
      <div className="proyeccion-preguntas__barra">
        <p className="proyeccion-preguntas__numero">
          {t.parejasEncontradas(memorice.encontradas.length, parejas.length)}
        </p>
        <p className={`proyeccion-parejas__aviso proyeccion-parejas__aviso--${memorice.ultimo ?? 'nada'}`} aria-live="polite">
          {aviso}
        </p>
        <div className="proyeccion__secundarios">
          {memorice.ultimo === 'no-pareja' && <Boton onClick={() => setMemorice(tapar)}>{t.tapar}</Boton>}
          <Boton onClick={() => setMostrarTodas((v) => !v)} aria-pressed={mostrarTodas}>
            {t.mostrarTodas}
          </Boton>
          <Boton onClick={volverAEmpezar}>{t.volverAEmpezar}</Boton>
          <Boton onClick={pantallaCompleta.alternar} aria-pressed={pantallaCompleta.activa}>
            {t.pantallaCompleta}
          </Boton>
          <Boton onClick={onSalir}>{t.salir}</Boton>
        </div>
      </div>

      <div ref={zona} className="proyeccion-parejas__zona">
        <div className="proyeccion-parejas__grilla" style={{ gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))` }}>
          {memorice.cartas.map((carta, i) => (
            <CartaMemorice
              key={i}
              carta={carta}
              numero={i + 1}
              visible={mostrarTodas || estaVisible(memorice, i)}
              encontrada={memorice.encontradas.includes(carta.pareja)}
              onVoltear={() => voltearCarta(i)}
              onTecla={(evento) => moverFoco(evento, i)}
              refBoton={(boton) => {
                botones.current[i] = boton
              }}
            />
          ))}
        </div>
      </div>

      <p className="proyeccion__teclas">{t.teclasParejas}</p>
    </div>
  )
}
