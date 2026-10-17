import { useId } from 'react'
import { textos } from '../i18n/es-CL.ts'
import { Boton } from '../ui/Boton.tsx'
import type { Lectura } from '../parser/tipos.ts'

interface Props {
  lectura: Lectura
  hayTexto: boolean
  onUsarEjemplo: (ejemplo: string) => void
}

const t = textos.vistaPrevia

function letra(indice: number) {
  return `${String.fromCharCode(97 + indice)})`
}

/** Cómo se verán los elementos según el tipo. */
function Elementos({ lectura }: { lectura: Lectura }) {
  switch (lectura.tipo) {
    case 'ruleta':
    case 'ordenar':
      return (
        <ol
          className={
            // Dos columnas solo con elementos cortos; si no, se partirían en dos líneas.
            lectura.tipo === 'ruleta' && lectura.elementos.length > 8 && lectura.elementos.every((e) => e.length <= 12)
              ? 'vista-previa__lista vista-previa__lista--columnas'
              : 'vista-previa__lista'
          }
        >
          {lectura.elementos.map((elemento, i) => (
            <li key={i}>{elemento}</li>
          ))}
        </ol>
      )
    case 'preguntas':
      return (
        <ol className="vista-previa__preguntas">
          {lectura.elementos.map((pregunta, i) => (
            <li key={i}>
              <p className="vista-previa__enunciado">{pregunta.enunciado}</p>
              <ul className="vista-previa__alternativas">
                {pregunta.alternativas.map((a, j) => (
                  <li key={j} className={a.correcta ? 'alternativa alternativa--correcta' : 'alternativa'}>
                    {letra(j)} {a.texto}
                    {a.correcta && <strong className="etiqueta-correcta"> ✓ {t.correcta}</strong>}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )
    case 'parejas':
      return (
        <ol className="vista-previa__lista">
          {lectura.elementos.map((p, i) => (
            <li key={i}>
              {p.a} <span aria-hidden="true">↔</span> {p.b}
            </li>
          ))}
        </ol>
      )
    case 'verdadero-falso':
      return (
        <ol className="vista-previa__lista">
          {lectura.elementos.map((a, i) => (
            <li key={i}>
              {a.texto}{' '}
              <strong className={a.verdadera === null ? 'etiqueta' : 'etiqueta-correcta'}>
                ({a.verdadera === null ? t.sinMarcar : a.verdadera ? t.verdadero : t.falso})
              </strong>
            </li>
          ))}
        </ol>
      )
    case 'clasificar':
      return (
        <ul className="vista-previa__categorias">
          {lectura.elementos.map((c, i) => (
            <li key={i}>
              <p className="vista-previa__enunciado">{c.nombre}</p>
              <p>{c.elementos.join(', ')}</p>
            </li>
          ))}
        </ul>
      )
  }
}

export function VistaPrevia({ lectura, hayTexto, onUsarEjemplo }: Props) {
  const idTitulo = useId()

  return (
    <section className="vista-previa" aria-labelledby={idTitulo}>
      <h2 id={idTitulo}>{t.titulo}</h2>


      {!hayTexto && (
        <div className="como-escribir">
          <h3>{textos.editor.comoEscribirlo}</h3>
          <p>{textos.editor.comoEscribir[lectura.tipo]}</p>
          <Boton variante="herramienta" onClick={() => onUsarEjemplo(textos.editor.ejemplos[lectura.tipo])}>{textos.editor.probarEjemplo}</Boton>
        </div>
      )}

      {lectura.advertencias.length > 0 && (
        <div className="advertencias">
          <h3>{t.revisa}</h3>
          <ul>
            {lectura.advertencias.map((a) => (
              <li key={a.codigo}>{a.mensaje}</li>
            ))}
          </ul>
        </div>
      )}

      {lectura.elementos.length > 0 && (
        <>
          <p className="vista-previa__cantidad">{t.cantidad(lectura.tipo, lectura.elementos.length)}</p>
          <Elementos lectura={lectura} />
        </>
      )}
    </section>
  )
}
