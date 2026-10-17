import { useId } from 'react'
import { textos } from '../i18n/es-CL.ts'
import type { Lectura, TipoLectura } from '../parser/tipos.ts'

const TIPOS: TipoLectura[] = ['ruleta', 'preguntas']

interface Props {
  lectura: Lectura
  hayTexto: boolean
  onCambiarTipo: (tipo: TipoLectura) => void
}

function letra(indice: number) {
  return `${String.fromCharCode(97 + indice)})`
}

export function VistaPrevia({ lectura, hayTexto, onCambiarTipo }: Props) {
  const idTitulo = useId()
  const nombreGrupo = useId()
  const t = textos.vistaPrevia

  return (
    <section className="vista-previa" aria-labelledby={idTitulo}>
      <h2 id={idTitulo}>{t.titulo}</h2>

      <fieldset className="selector-tipo">
        <legend>{t.tipo}</legend>
        {TIPOS.map((tipo) => (
          <label
            key={tipo}
            className={
              lectura.tipo === tipo ? 'selector-tipo__opcion selector-tipo__opcion--elegida' : 'selector-tipo__opcion'
            }
          >
            <input
              type="radio"
              name={nombreGrupo}
              checked={lectura.tipo === tipo}
              onChange={() => onCambiarTipo(tipo)}
            />
            <span>
              {textos.tipos[tipo]}
              {hayTexto && lectura.tipoSugerido === tipo && (
                <span className="etiqueta"> ({t.sugerido})</span>
              )}
            </span>
          </label>
        ))}
      </fieldset>

      {!hayTexto && <p className="nota">{t.vacia}</p>}

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
        <p className="vista-previa__cantidad">{t.cantidad(lectura.tipo, lectura.elementos.length)}</p>
      )}

      {lectura.tipo === 'ruleta' && lectura.elementos.length > 0 && (
        <ol className="vista-previa__lista">
          {lectura.elementos.map((elemento, i) => (
            <li key={i}>{elemento}</li>
          ))}
        </ol>
      )}

      {lectura.tipo === 'preguntas' && lectura.elementos.length > 0 && (
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
      )}
    </section>
  )
}
