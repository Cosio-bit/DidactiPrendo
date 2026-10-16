import { useEffect, useRef } from 'react'
import { textos } from './i18n/es-CL.ts'
import { irA, useRuta } from './navegacion.ts'
import { Editor } from './pantallas/Editor.tsx'
import { Inicio } from './pantallas/Inicio.tsx'
import { MisActividades } from './pantallas/MisActividades.tsx'
import { BarraGuardado } from './ui/BarraGuardado.tsx'
import { Boton } from './ui/Boton.tsx'
import { useTema } from './ui/tema.ts'

function App() {
  const ruta = useRuta()
  const [tema, setTema] = useTema()
  const principal = useRef<HTMLElement>(null)

  // Al cambiar de pantalla, el foco va al título para quien usa teclado o lector de pantalla.
  useEffect(() => {
    principal.current?.querySelector<HTMLElement>('h1')?.focus()
  }, [ruta.pantalla])

  return (
    <div className="app">
      <header className="cabecera">
        {ruta.pantalla === 'inicio' ? (
          <span className="cabecera__nombre">{textos.app.nombre}</span>
        ) : (
          <Boton onClick={() => irA({ pantalla: 'inicio' })}>{textos.app.volverAlInicio}</Boton>
        )}
        <Boton
          aria-pressed={tema === 'alto-contraste'}
          onClick={() => setTema(tema === 'alto-contraste' ? 'normal' : 'alto-contraste')}
        >
          {textos.app.altoContraste}
        </Boton>
      </header>

      <main ref={principal} className="principal">
        {ruta.pantalla === 'inicio' && <Inicio />}
        {ruta.pantalla === 'mis-actividades' && <MisActividades />}
        {ruta.pantalla === 'editor' && <Editor key={ruta.id} id={ruta.id} />}
      </main>

      <BarraGuardado />
    </div>
  )
}

export default App
