import { memo, useEffect, useMemo, useState } from 'react'
import { acomodarEtiqueta, RADIO_RUEDA, type MedirTexto } from './logica.ts'

// Colores de la marca (Amarillo Idea, Celeste Calma, Rojo Libro y su celeste oscuro) más tres de la
// paleta Okabe-Ito, para que los segmentos vecinos se distingan también con daltonismo.
const COLORES = [
  { fondo: '#F2D94A', texto: '#17202B' },
  { fondo: '#58C4F2', texto: '#17202B' },
  { fondo: '#E53A22', texto: '#17202B' },
  { fondo: '#009E73', texto: '#17202B' },
  { fondo: '#0A6591', texto: '#FFFFFF' },
  { fondo: '#E69F00', texto: '#17202B' },
  { fondo: '#CC79A7', texto: '#17202B' },
]

/** Con más segmentos que esto, los nombres no caben en la rueda: se leen en el resultado. */
const MAXIMO_CON_NOMBRES = 16

function color(i: number, n: number) {
  // El último no puede repetir el color del primero, porque quedan juntos.
  if (n > 1 && i === n - 1 && i % COLORES.length === 0) return COLORES[2]
  return COLORES[i % COLORES.length]
}

function punto(angulo: number, radio: number) {
  const rad = ((angulo - 90) * Math.PI) / 180
  return `${(radio * Math.cos(rad)).toFixed(3)} ${(radio * Math.sin(rad)).toFixed(3)}`
}

const R = RADIO_RUEDA
const ALTO_LINEA = 1.15

let contexto: CanvasRenderingContext2D | null | undefined

/** Mide el texto con la letra de la app en negrita; sin dibujo disponible, lo estima. */
const medir: MedirTexto = (texto) => {
  if (contexto === undefined) {
    contexto = document.createElement('canvas').getContext?.('2d') ?? null
  }
  if (!contexto) return texto.length * 0.62
  const familia = getComputedStyle(document.documentElement).getPropertyValue('--f-texto').trim() || 'sans-serif'
  contexto.font = `700 100px ${familia}`
  return contexto.measureText(texto).width / 100
}

/** Cambia cuando terminan de cargar las letras de la app, para volver a medir con las verdaderas. */
function useLetrasCargadas() {
  const [cargadas, setCargadas] = useState(false)
  useEffect(() => {
    let vigente = true
    document.fonts?.ready.then(() => vigente && setCargadas(true))
    return () => {
      vigente = false
    }
  }, [])
  return cargadas
}

/** La rueda sin girar: segmentos, nombres (si caben) y borde. Se dibuja una sola vez por lista. */
const Segmentos = memo(function Segmentos({ elementos, letrasCargadas }: { elementos: string[]; letrasCargadas: boolean }) {
  const n = elementos.length
  const paso = 360 / n
  const conNombres = n <= MAXIMO_CON_NOMBRES
  // Cada nombre con la letra más grande que le cabe: uno largo no achica a los demás.
  const etiquetas = useMemo(
    () => (conNombres ? elementos.map((e) => acomodarEtiqueta(e, n, medir)) : []),
    // Al cargar las letras de la app se vuelve a medir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [elementos, n, conNombres, letrasCargadas],
  )

  return (
    <>
      {elementos.map((_, i) => {
        const { fondo, texto } = color(i, n)
        const inicio = i * paso
        const fin = (i + 1) * paso
        const medio = inicio + paso / 2
        return (
          <g key={i}>
            {n === 1 ? (
              <circle r={R} fill={fondo} />
            ) : (
              <path
                d={`M0 0 L${punto(inicio, R)} A${R} ${R} 0 ${paso > 180 ? 1 : 0} 1 ${punto(fin, R)} Z`}
                fill={fondo}
                stroke="#FFFFFF"
                strokeWidth={n > 40 ? 0.4 : 0.8}
              />
            )}
            {conNombres && (
              <text
                // En la mitad izquierda el texto se da vuelta para no quedar de cabeza.
                transform={
                  n === 1
                    ? undefined
                    : `rotate(${medio - 90}) translate(${etiquetas[i].distancia.toFixed(2)} 0)${medio > 180 ? ' rotate(180)' : ''}`
                }
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={etiquetas[i].tamano.toFixed(2)}
                fontWeight={700}
                fill={texto}
              >
                {etiquetas[i].lineas.map((linea, j, lineas) => (
                  <tspan key={j} x={0} y={((j - (lineas.length - 1) / 2) * ALTO_LINEA * etiquetas[i].tamano).toFixed(2)}>
                    {linea}
                  </tspan>
                ))}
              </text>
            )}
          </g>
        )
      })}
      <circle r={R} fill="none" stroke="var(--texto-color)" strokeWidth={2} />
    </>
  )
})

interface Props {
  elementos: string[]
  rotacion: number
  descripcion: string
  onToque: () => void
}

export function Rueda({ elementos, rotacion, descripcion, onToque }: Props) {
  const letrasCargadas = useLetrasCargadas()
  return (
    <svg
      className="rueda"
      viewBox="-110 -118 220 228"
      role="img"
      aria-label={descripcion}
      onClick={onToque}
    >
      <g transform={`rotate(${rotacion})`}>
        <Segmentos elementos={elementos} letrasCargadas={letrasCargadas} />
      </g>
      <circle r={8} fill="var(--texto-color)" />
      {/* Puntero arriba, apuntando hacia la rueda. */}
      <path d="M-9 -116 L9 -116 L0 -96 Z" fill="var(--texto-color)" stroke="var(--fondo)" strokeWidth={2} />
    </svg>
  )
}
