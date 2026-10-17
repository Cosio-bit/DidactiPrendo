import { textos } from '../../i18n/es-CL.ts'
import type { Pregunta } from '../../parser/tipos.ts'
import { letra } from './logica.ts'

const t = textos.imprimir

function enGrupos<T>(lista: T[], tamano: number): T[][] {
  const grupos: T[][] = []
  for (let i = 0; i < lista.length; i += tamano) grupos.push(lista.slice(i, i + tamano))
  return grupos
}

/** Cuatro tarjetas por hoja, para recortar por la línea punteada. */
export function Tarjetas({ letras }: { letras: string[] }) {
  return (
    <>
      {enGrupos(letras, 4).map((grupo, i) => (
        <div key={i} className="hoja hoja--tarjetas">
          {grupo.map((l) => (
            <div key={l} className="tarjeta">
              <span className="tarjeta__letra">{l}</span>
            </div>
          ))}
        </div>
      ))}
    </>
  )
}

/** Las preguntas sin respuestas, y la pauta en una hoja aparte para el profe. */
export function PreguntasEnPapel({ titulo, preguntas }: { titulo: string; preguntas: Pregunta[] }) {
  return (
    <>
      <div className="hoja hoja--texto">
        <h2 className="hoja__titulo">{titulo}</h2>
        <p className="hoja__datos">{t.nombreYCurso}</p>
        <p className="hoja__instruccion">{t.instruccion}</p>
        <ol className="hoja__preguntas">
          {preguntas.map((p, i) => (
            <li key={i} className="hoja__pregunta">
              <p className="hoja__enunciado">{p.enunciado}</p>
              <ul className="hoja__alternativas">
                {p.alternativas.map((a, j) => (
                  <li key={j}>
                    {letra(j)}) {a.texto}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
      <div className="hoja hoja--texto hoja--pauta">
        <h2 className="hoja__titulo">{t.pauta(titulo)}</h2>
        <ol className="hoja__respuestas">
          {preguntas.map((p, i) => {
            const correctas = p.alternativas.flatMap((a, j) => (a.correcta ? [letra(j)] : []))
            return <li key={i}>{correctas.length > 0 ? correctas.join(', ') : t.sinMarcar}</li>
          })}
        </ol>
      </div>
    </>
  )
}
