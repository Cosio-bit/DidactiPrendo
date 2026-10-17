import { textos } from '../../i18n/es-CL.ts'

/** "Azul", "Naranjo"…: el nombre del color, que es también el nombre inicial del equipo. */
export const nombreDeColor = (color: number): string => textos.herramientas.colores[color] ?? textos.herramientas.colores[0]
