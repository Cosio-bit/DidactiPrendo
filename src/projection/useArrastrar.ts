import { useCallback, useEffect, useRef, useState, type PointerEvent as EventoPuntero } from 'react'

/** Distancia (en píxeles) que hay que mover el puntero para que cuente como arrastrar y no como toque. */
const UMBRAL_PX = 8
/** Con el mouse, la ficha agarrada se dibuja un poco abajo y a la derecha del cursor, sin taparlo. */
const DESPLAZAMIENTO_CURSOR = 14

export interface Fantasma<T> {
  item: T
  /** Esquina superior izquierda de la copia que sigue al puntero. */
  x: number
  y: number
  /** Ancho de la ficha original, si se está arrastrando; al seguir al mouse, el ancho es el natural. */
  ancho?: number
  /** Destino bajo el puntero (atributo data-destino), o null. */
  destino: string | null
}

interface Opciones<T> {
  /** La ficha agarrada (elegida) en este momento, o null. */
  agarrado: T | null
  /** Se soltó sobre un destino. */
  alSoltar: (item: T, destino: string) => void
  /** Se soltó fuera de todo destino: la ficha no se pierde, queda agarrada. */
  alSoltarFuera: (item: T) => void
}

const destinoEn = (x: number, y: number) =>
  document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-destino]')?.dataset.destino ?? null

/**
 * Tomar y arrastrar con mouse, dedo o lápiz (eventos de puntero, sirven en pizarras táctiles).
 * - Los destinos se marcan con el atributo data-destino.
 * - Soltar fuera de un destino no cancela: la ficha queda agarrada y, con mouse, la copia sigue
 *   al cursor hasta que se hace clic en un destino.
 * - Un toque sin mover sigue siendo un clic normal, así que el teclado y los toques funcionan como siempre.
 */
export function useArrastrar<T>({ agarrado, alSoltar, alSoltarFuera }: Opciones<T>) {
  const [fantasma, setFantasma] = useState<Fantasma<T> | null>(null)
  const inicio = useRef<{ item: T; x: number; y: number; dx: number; dy: number; ancho: number } | null>(null)
  const arrastrando = useRef(false)
  /** Cuándo terminó el último arrastre: el clic que el navegador envía al soltar no debe contar como toque. */
  const finDelUltimo = useRef<{ item: T; hora: number } | null>(null)

  const alPresionar = useCallback((item: T, evento: EventoPuntero<HTMLElement>) => {
    if (evento.button !== 0) return
    const caja = evento.currentTarget.getBoundingClientRect()
    inicio.current = {
      item,
      x: evento.clientX,
      y: evento.clientY,
      dx: evento.clientX - caja.left,
      dy: evento.clientY - caja.top,
      ancho: caja.width,
    }
    arrastrando.current = false
    evento.currentTarget.setPointerCapture(evento.pointerId)
  }, [])

  const alMover = useCallback((evento: EventoPuntero<HTMLElement>) => {
    const i = inicio.current
    if (!i) return
    if (!arrastrando.current && Math.hypot(evento.clientX - i.x, evento.clientY - i.y) <= UMBRAL_PX) return
    arrastrando.current = true
    setFantasma({
      item: i.item,
      x: evento.clientX - i.dx,
      y: evento.clientY - i.dy,
      ancho: i.ancho,
      destino: destinoEn(evento.clientX, evento.clientY),
    })
  }, [])

  const alSoltarPuntero = useCallback(
    (evento: EventoPuntero<HTMLElement>) => {
      const i = inicio.current
      inicio.current = null
      if (!i || !arrastrando.current) return
      arrastrando.current = false
      finDelUltimo.current = { item: i.item, hora: performance.now() }
      setFantasma(null)
      const destino = destinoEn(evento.clientX, evento.clientY)
      if (destino) alSoltar(i.item, destino)
      else alSoltarFuera(i.item)
    },
    [alSoltar, alSoltarFuera],
  )

  const cancelar = useCallback(() => {
    inicio.current = null
    arrastrando.current = false
    setFantasma(null)
  }, [])

  // Ficha agarrada y mouse: la copia sigue al cursor, sin tener que mantener el botón apretado.
  useEffect(() => {
    if (agarrado === null) {
      if (!arrastrando.current) setFantasma(null)
      return
    }
    function seguir(evento: PointerEvent) {
      if (evento.pointerType !== 'mouse' || arrastrando.current || agarrado === null) return
      setFantasma({
        item: agarrado,
        x: evento.clientX + DESPLAZAMIENTO_CURSOR,
        y: evento.clientY + DESPLAZAMIENTO_CURSOR,
        destino: destinoEn(evento.clientX, evento.clientY),
      })
    }
    window.addEventListener('pointermove', seguir)
    return () => window.removeEventListener('pointermove', seguir)
  }, [agarrado])

  /** Para el clic de una ficha: si esa misma ficha recién se arrastró, el clic que llega al soltar no cuenta como toque. */
  const fueArrastre = useCallback((item: T) => {
    const ultimo = finDelUltimo.current
    return ultimo !== null && ultimo.item === item && performance.now() - ultimo.hora < 400
  }, [])

  /** Props para la ficha que se puede arrastrar. */
  const arrastrable = (item: T) => ({
    onPointerDown: (e: EventoPuntero<HTMLElement>) => alPresionar(item, e),
    onPointerMove: alMover,
    onPointerUp: alSoltarPuntero,
    onPointerCancel: cancelar,
  })

  return { fantasma, arrastrable, fueArrastre }
}
