import { memo } from 'react'

// Colores distinguibles por personas con daltonismo (paleta Okabe-Ito), con texto legible encima.
const COLORES = [
  { fondo: '#E69F00', texto: '#000000' },
  { fondo: '#56B4E9', texto: '#000000' },
  { fondo: '#009E73', texto: '#000000' },
  { fondo: '#F0E442', texto: '#000000' },
  { fondo: '#0072B2', texto: '#FFFFFF' },
  { fondo: '#D55E00', texto: '#000000' },
  { fondo: '#CC79A7', texto: '#000000' },
]

/** Con más segmentos que esto, los nombres no caben en la rueda: se leen en el resultado. */
const MAXIMO_CON_NOMBRES = 16
const LARGO_NOMBRE = 14

function color(i: number, n: number) {
  // El último no puede repetir el color del primero, porque quedan juntos.
  if (n > 1 && i === n - 1 && i % COLORES.length === 0) return COLORES[2]
  return COLORES[i % COLORES.length]
}

function punto(angulo: number, radio: number) {
  const rad = ((angulo - 90) * Math.PI) / 180
  return `${(radio * Math.cos(rad)).toFixed(3)} ${(radio * Math.sin(rad)).toFixed(3)}`
}

function recortar(texto: string) {
  return texto.length > LARGO_NOMBRE ? `${texto.slice(0, LARGO_NOMBRE - 1)}…` : texto
}

const R = 100

/** La rueda sin girar: segmentos, nombres (si caben) y borde. Se dibuja una sola vez por lista. */
const Segmentos = memo(function Segmentos({ elementos }: { elementos: string[] }) {
  const n = elementos.length
  const paso = 360 / n
  const conNombres = n <= MAXIMO_CON_NOMBRES
  const tamanoLetra = Math.min(14, (2 * Math.PI * R * 0.6) / n / 1.4)

  return (
    <>
      {elementos.map((elemento, i) => {
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
                transform={`rotate(${medio - 90}) translate(${R * 0.58} 0)${medio > 180 ? ' rotate(180)' : ''}`}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={tamanoLetra}
                fontWeight={700}
                fill={texto}
              >
                {recortar(elemento)}
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
  return (
    <svg
      className="rueda"
      viewBox="-110 -118 220 228"
      role="img"
      aria-label={descripcion}
      onClick={onToque}
    >
      <g transform={`rotate(${rotacion})`}>
        <Segmentos elementos={elementos} />
      </g>
      <circle r={8} fill="var(--texto-color)" />
      {/* Puntero arriba, apuntando hacia la rueda. */}
      <path d="M-9 -116 L9 -116 L0 -96 Z" fill="var(--texto-color)" stroke="var(--fondo)" strokeWidth={2} />
    </svg>
  )
}
