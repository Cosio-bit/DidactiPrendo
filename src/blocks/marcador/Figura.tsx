import { COLORES_EQUIPO } from './logica.ts'

/** Dibujos de 24×24; cada equipo tiene uno distinto, para no depender solo del color. */
const FIGURAS: Record<(typeof COLORES_EQUIPO)[number]['figura'], string> = {
  circulo: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z',
  triangulo: 'M12 3L22 20H2z',
  cuadrado: 'M4 4h16v16H4z',
  rombo: 'M12 2L22 12L12 22L2 12z',
  estrella: 'M12 2l2.9 6.6l7.1.6l-5.4 4.7l1.6 7l-6.2-3.7l-6.2 3.7l1.6-7L2 9.2l7.1-.6z',
  cruz: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',
  hexagono: 'M7 3h10l5 9l-5 9H7l-5-9z',
  'triangulo-abajo': 'M2 4h20L12 21z',
}

/** La figura del equipo, rellena con su color y con borde oscuro (así el amarillo se ve sobre el papel). */
export function Figura({ color }: { color: number }) {
  const { valor, figura } = COLORES_EQUIPO[color] ?? COLORES_EQUIPO[0]
  return (
    <svg className="figura" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={FIGURAS[figura]} fill={valor} stroke="var(--figura-borde)" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}
