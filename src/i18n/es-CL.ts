// Todos los textos visibles de la aplicación. Nunca escribirlos directo en los componentes.

/** "a", "a y b", "a, b y c" */
function enumerar(cosas: string[]): string {
  if (cosas.length <= 1) return cosas.join('')
  return `${cosas.slice(0, -1).join(', ')} y ${cosas[cosas.length - 1]}`
}

/** «texto», recortado si es muy largo; muestra hasta 3 y cuenta el resto. */
function citar(textos: string[]): string {
  const recortar = (t: string) => (t.length > 50 ? `${t.slice(0, 49)}…` : t)
  const citas = textos.slice(0, 3).map((t) => `«${recortar(t)}»`)
  if (textos.length > 3) citas.push(`${textos.length - 3} más`)
  return enumerar(citas)
}

/** "La pregunta 2" / "Las preguntas 1 y 4", con el verbo en singular o plural. */
function preguntasN(numeros: number[], singular: string, plural: string): string {
  return numeros.length === 1
    ? `La pregunta ${numeros[0]} ${singular}`
    : `Las preguntas ${enumerar(numeros.map(String))} ${plural}`
}

export const textos = {
  app: {
    nombre: 'DidactiPrendo',
    volverAlInicio: 'Volver al inicio',
    altoContraste: 'Alto contraste',
  },
  inicio: {
    saludo: 'Hola, profe',
    crearActividad: 'Crear actividad',
    misActividades: 'Mis actividades',
  },
  misActividades: {
    titulo: 'Mis actividades',
    cargando: 'Cargando tus actividades…',
    vacio: 'Todavía no tienes actividades guardadas.',
    abrir: 'Abrir',
    borrar: 'Borrar',
    modificada: (fecha: string) => `Modificada el ${fecha}`,
  },
  tipos: {
    ruleta: 'Ruleta',
    preguntas: 'Preguntas con alternativas',
    marcador: 'Marcador',
    temporizador: 'Temporizador',
  },
  editor: {
    titulo: 'Tu actividad',
    nombre: 'Nombre de la actividad',
    nombrePorDefecto: 'Actividad sin nombre',
    pegaTuTexto: 'Pega tu texto aquí',
    ejemplo: 'Por ejemplo:\nAna\nBenjamín\nCatalina',
    ayuda:
      'Un elemento por línea. Para preguntas: la pregunta, debajo las alternativas a), b), c) y un * antes de la correcta.',
    listo: 'Listo',
    cargando: 'Abriendo la actividad…',
    noEncontrada: 'Esta actividad ya no existe. Puede que la hayas borrado.',
  },
  vistaPrevia: {
    titulo: 'Así quedará',
    tipo: 'Tipo de actividad',
    sugerido: 'sugerido',
    vacia: 'Aquí verás tu actividad cuando pegues o escribas el texto.',
    revisa: 'Revisa esto',
    correcta: 'correcta',
    cantidad: (tipo: 'ruleta' | 'preguntas', n: number) =>
      tipo === 'ruleta'
        ? `${n} ${n === 1 ? 'elemento' : 'elementos'}`
        : `${n} ${n === 1 ? 'pregunta' : 'preguntas'}`,
  },
  confirmarBorrado: {
    titulo: '¿Borrar esta actividad?',
    mensaje: (nombre: string) =>
      `Se borrará «${nombre}». Si te equivocas, puedes recuperarla con «Deshacer» mientras no cierres la página.`,
    confirmar: 'Sí, borrar',
    cancelar: 'Cancelar',
  },
  avisos: {
    inicial: 'Todo se guarda solo, en este computador.',
    guardado: 'Guardado',
    borrada: (nombre: string) => `Se borró «${nombre}»`,
    deshacer: 'Deshacer',
    deshecho: (descripcion: string) => `Se deshizo: ${descripcion}`,
    errorGuardar: 'No se pudo guardar. No cierres la página e inténtalo de nuevo.',
    errorDeshacer: 'No se pudo deshacer. Inténtalo de nuevo.',
  },
  acciones: {
    cambioNombre: 'cambio de nombre',
    cambioTexto: 'cambio de texto',
    cambioTipo: 'cambio de tipo de actividad',
    borrado: (nombre: string) => `borrado de «${nombre}»`,
  },
  lector: {
    sinElementos: 'No encontramos nada para usar. Escribe o pega un elemento por línea.',
    sinPreguntas:
      'No encontramos preguntas con alternativas. Escribe la pregunta y, debajo, sus alternativas a), b), c), con * antes de la correcta.',
    lineasIgnoradasLista: (lineas: string[]) =>
      lineas.length === 1
        ? `No usamos esta línea porque parece un título o un comentario: ${citar(lineas)}.`
        : `No usamos estas líneas porque parecen títulos o comentarios: ${citar(lineas)}.`,
    lineasIgnoradasPreguntas: (lineas: string[]) =>
      lineas.length === 1
        ? `No usamos esta línea porque no es parte de una pregunta con alternativas: ${citar(lineas)}.`
        : `No usamos estas líneas porque no son parte de una pregunta con alternativas: ${citar(lineas)}.`,
    separadoPorComas: 'Separamos el texto en las comas. Si no era una lista, escribe un elemento por línea.',
    repetidos: (elementos: string[]) =>
      elementos.length === 1
        ? `${citar(elementos)} aparece más de una vez. No lo borramos, por si es a propósito.`
        : `${citar(elementos)} aparecen más de una vez. No los borramos, por si es a propósito.`,
    pocosElementos: 'La ruleta necesita al menos 2 elementos.',
    demasiadosElementos: (cantidad: number, maximo: number) =>
      `Hay ${cantidad} elementos. La ruleta se lee bien con ${maximo} como máximo.`,
    sinEnunciado: (numeros: number[]) =>
      `${preguntasN(numeros, 'no tiene', 'no tienen')} enunciado. Escribe la pregunta en la línea de arriba de las alternativas.`,
    sinCorrecta: (numeros: number[]) =>
      `${preguntasN(numeros, 'no tiene', 'no tienen')} la respuesta correcta marcada. Pon un * antes de la correcta, por ejemplo: *b) 3/4`,
    variasCorrectas: (numeros: number[]) =>
      `${preguntasN(numeros, 'tiene', 'tienen')} más de una alternativa marcada como correcta.`,
    pocasAlternativas: (numeros: number[]) =>
      `${preguntasN(numeros, 'tiene', 'tienen')} una sola alternativa. Agrega al menos otra.`,
    preguntasRepetidas: (numeros: number[]) =>
      `${preguntasN(numeros, 'aparece', 'aparecen')} más de una vez. No las borramos, por si es a propósito.`,
  },
} as const
