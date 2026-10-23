import { useEffect, useRef } from 'react'
import { textos } from './i18n/es-CL.ts'
import { irA, useRuta } from './navegacion.ts'
import { Editor } from './pantallas/Editor.tsx'
import { CrearConIA } from './pantallas/CrearConIA.tsx'
import { Inicio } from './pantallas/Inicio.tsx'
import { MisActividades } from './pantallas/MisActividades.tsx'
import { Imprimir } from './pantallas/Imprimir.tsx'
import { Proyectar } from './pantallas/Proyectar.tsx'
import { Recibir } from './pantallas/Recibir.tsx'
import { BarraGuardado } from './ui/BarraGuardado.tsx'
import { Boton } from './ui/Boton.tsx'
import { useTema } from './ui/tema.ts'
import { useSoltarArchivos } from './ui/useSoltarArchivos.ts'
import { cargarMaterial } from './pantallas/cargarMaterial.ts'

const cargarArchivosSoltados = (archivos: File[]) => void cargarMaterial(archivos)

function App() {
  const ruta = useRuta()
  const [tema, setTema] = useTema()
  const principal = useRef<HTMLElement>(null)

  // Al cambiar de pantalla, el foco va al título para quien usa teclado o lector de pantalla.
  // Al abrir la app no: el navegador ya parte desde el comienzo de la página.
  const pantallaAnterior = useRef(ruta.pantalla)
  useEffect(() => {
    if (pantallaAnterior.current === ruta.pantalla) return
    pantallaAnterior.current = ruta.pantalla
    principal.current?.querySelector<HTMLElement>('h1')?.focus()
  }, [ruta.pantalla])

  // Un archivo de actividades soltado en cualquier parte de la app se carga (en la proyección se ignora).
  // Una guía o material (PDF, Word, una foto) va a Crear con IA.
  const archivoEncima = useSoltarArchivos(ruta.pantalla === 'proyectar' ? null : cargarArchivosSoltados)

  // La proyección ocupa toda la pantalla, sin cabecera ni barra de guardado.
  if (ruta.pantalla === 'proyectar') return <Proyectar key={ruta.id} id={ruta.id} />

  return (
    <div className="app">
      <header className="cabecera">
        <div className="cabecera__inicio">
          <span className="cabecera__marca">
            <img className="cabecera__logo" src="/logo.png" alt="" width={56} height={56} />
            <span className="cabecera__nombre">{textos.app.nombre}</span>
          </span>
          {ruta.pantalla !== 'inicio' && (
            <Boton variante="navegacion" onClick={() => irA({ pantalla: 'inicio' })}>
              <span className="texto-largo">{textos.app.volverAlInicio}</span>
              <span className="texto-corto">{textos.app.inicio}</span>
            </Boton>
          )}
        </div>
        <Boton
          variante="herramienta"
          aria-pressed={tema === 'alto-contraste'}
          onClick={() => setTema(tema === 'alto-contraste' ? 'normal' : 'alto-contraste')}
        >
          {textos.app.altoContraste}
        </Boton>
      </header>

      <main ref={principal} className="principal cuadricula">
        {ruta.pantalla === 'inicio' && <Inicio />}
        {ruta.pantalla === 'mis-actividades' && <MisActividades />}
        {ruta.pantalla === 'crear-con-ia' && <CrearConIA />}
        {ruta.pantalla === 'editor' && <Editor key={ruta.id} id={ruta.id} />}
        {ruta.pantalla === 'imprimir' && <Imprimir key={ruta.id} id={ruta.id} />}
        {ruta.pantalla === 'recibir' && <Recibir key={ruta.datos} datos={ruta.datos} />}
      </main>

      <BarraGuardado />
      {archivoEncima && (
        <div className="soltar-aqui" aria-hidden="true">
          <p>{ruta.pantalla === 'crear-con-ia' ? textos.respaldo.soltarGuia : textos.respaldo.soltarAqui}</p>
        </div>
      )}
    </div>
  )
}

export default App
