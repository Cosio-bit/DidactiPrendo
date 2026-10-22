import type { ReactNode } from 'react'
import type { TipoLectura } from '../parser/tipos.ts'

/**
 * Dibujos de 24×24 de cada tipo de actividad, en dos tonos: un relleno suave que da el color
 * y una línea que conserva la forma (la línea es lo que resiste en un proyector de poca luz).
 */
const DIBUJOS: Record<TipoLectura, { relleno: ReactNode; trazo: ReactNode }> = {
  ruleta: {
    relleno: <circle cx="12" cy="13" r="9" />,
    trazo: (
      <>
        <circle cx="12" cy="13" r="9" />
        <path d="M12 4v18M4.2 8.5l15.6 9M4.2 17.5l15.6-9" />
        <path d="M10 1.5h4L12 4.5z" fill="currentColor" />
      </>
    ),
  },
  preguntas: {
    relleno: <rect x="1.5" y="9" width="21" height="6" rx="3" />,
    trazo: (
      <>
        <circle cx="5" cy="6" r="2" />
        <circle cx="5" cy="12" r="2" fill="currentColor" />
        <circle cx="5" cy="18" r="2" />
        <path d="M10 6h11M10 12h11M10 18h11" />
      </>
    ),
  },
  parejas: {
    relleno: (
      <>
        <rect x="2.5" y="5" width="10" height="14" rx="2" transform="rotate(-8 7.5 12)" />
        <rect x="11.5" y="5" width="10" height="14" rx="2" transform="rotate(8 16.5 12)" />
      </>
    ),
    trazo: (
      <>
        <rect x="2.5" y="5" width="10" height="14" rx="2" transform="rotate(-8 7.5 12)" />
        <rect x="11.5" y="5" width="10" height="14" rx="2" transform="rotate(8 16.5 12)" />
      </>
    ),
  },
  // Dos columnas de casillas unidas por líneas que se cruzan.
  'terminos-pareados': {
    relleno: (
      <>
        <rect x="1.5" y="3" width="6.5" height="5" rx="1.2" />
        <rect x="16" y="16" width="6.5" height="5" rx="1.2" />
      </>
    ),
    trazo: (
      <>
        <rect x="1.5" y="3" width="6.5" height="5" rx="1.2" />
        <rect x="16" y="3" width="6.5" height="5" rx="1.2" />
        <rect x="1.5" y="16" width="6.5" height="5" rx="1.2" />
        <rect x="16" y="16" width="6.5" height="5" rx="1.2" />
        <path d="M8 5.5l8 13M8 18.5l8-13" />
      </>
    ),
  },
  'verdadero-falso': {
    relleno: (
      <>
        <circle cx="6.5" cy="12.5" r="5.5" />
        <circle cx="18" cy="12" r="5" />
      </>
    ),
    trazo: <path d="M2 12.5l3.5 3.5L11 9M14.5 8.5l7 7M21.5 8.5l-7 7" />,
  },
  ordenar: {
    relleno: <path d="M3 21h4v-5H3zM10 21h4V11h-4zM17 21h4V4h-4z" />,
    trazo: <path d="M3 21h4v-5H3zM10 21h4V11h-4zM17 21h4V4h-4z" />,
  },
  clasificar: {
    relleno: <path d="M2 13h9v7H2zM13 13h9v7h-9z" />,
    trazo: (
      <>
        <path d="M2 13h9v7H2zM13 13h9v7h-9z" />
        <circle cx="6.5" cy="7" r="2.5" />
        <path d="M15 4.5h5v5h-5z" />
      </>
    ),
  },
}

/** El dibujo del tipo de actividad, en su color; decorativo, porque el nombre del tipo ya está escrito al lado. */
export function IconoTipo({ tipo, className }: { tipo: TipoLectura; className?: string }) {
  const { relleno, trazo } = DIBUJOS[tipo]
  return (
    <svg
      className={className ? `icono-tipo ${className}` : 'icono-tipo'}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      style={{ color: `var(--tipo-${tipo})` }}
    >
      <g fill="currentColor" fillOpacity="0.22">
        {relleno}
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {trazo}
      </g>
    </svg>
  )
}

/**
 * El dibujo como marca de agua: tenue y cortado por el borde derecho de la caja que lo lleva.
 * La caja necesita la clase `con-marca-tipo` (o posición relativa y `isolation: isolate`).
 */
export function MarcaTipo({ tipo }: { tipo: TipoLectura }) {
  return (
    <span className="marca-tipo">
      <IconoTipo tipo={tipo} className="marca-tipo__icono" />
    </span>
  )
}
