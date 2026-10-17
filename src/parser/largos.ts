// Textos tan largos que en la sala se verán con letra chica.
import type { Lectura } from './tipos.ts'

/** Largos (en letras) desde los que un texto ya no se lee cómodo proyectado. */
const LARGO_MAXIMO = {
  elemento: 60,
  enunciado: 220,
  alternativa: 90,
  afirmacion: 160,
  carta: 60,
  clasificar: 30,
}

/** Los textos de la lectura que son demasiado largos para leerse bien desde el fondo de la sala. */
export function textosLargos(lectura: Lectura): string[] {
  const largo = (texto: string, maximo: number) => (texto.length > maximo ? [texto] : [])
  switch (lectura.tipo) {
    case 'ruleta':
    case 'ordenar':
      return lectura.elementos.flatMap((e) => largo(e, LARGO_MAXIMO.elemento))
    case 'preguntas':
      return lectura.elementos.flatMap((p) => [
        ...largo(p.enunciado, LARGO_MAXIMO.enunciado),
        ...p.alternativas.flatMap((a) => largo(a.texto, LARGO_MAXIMO.alternativa)),
      ])
    case 'verdadero-falso':
      return lectura.elementos.flatMap((a) => largo(a.texto, LARGO_MAXIMO.afirmacion))
    case 'parejas':
      return lectura.elementos.flatMap((p) => [...largo(p.a, LARGO_MAXIMO.carta), ...largo(p.b, LARGO_MAXIMO.carta)])
    case 'clasificar':
      return lectura.elementos.flatMap((c) => [
        ...largo(c.nombre, LARGO_MAXIMO.clasificar),
        ...c.elementos.flatMap((e) => largo(e, LARGO_MAXIMO.clasificar)),
      ])
  }
}
