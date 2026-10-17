// Todos los textos visibles de la aplicación. Nunca escribirlos directo en los componentes.

type TipoConTexto = 'ruleta' | 'preguntas' | 'parejas' | 'verdadero-falso' | 'ordenar' | 'clasificar'

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
    /** El saludo en dos partes, para marcar "profe" con crayón. */
    saludoInicio: 'Hola, ',
    saludoDestacado: 'profe',
    logoCompleto: 'DidactiPrendo: así de fácil, enseño y aprendo',
    descripcion: 'Convierte tus listas y preguntas en actividades para proyectar en la sala.',
    comoFunciona: 'Así funciona',
    pasos: [
      'Pega el texto que ya tienes: de Word, Excel o ChatGPT.',
      'Elige la actividad: ruleta, preguntas, memorice y más.',
      'Proyecta y juega con el curso.',
    ],
    crearActividad: 'Crear actividad',
    misActividades: 'Mis actividades',
  },
  misActividades: {
    titulo: 'Mis actividades',
    cargando: 'Cargando tus actividades…',
    vacio: 'Todavía no tienes actividades guardadas.',
    editar: 'Editar',
    proyectar: 'Proyectar',
    borrar: 'Borrar',
    modificada: (fecha: string) => `Modificada ${fecha}`,
    hoy: 'hoy',
    ayer: 'ayer',
    elDia: (fecha: string) => `el ${fecha}`,
  },
  tipos: {
    ruleta: 'Ruleta',
    preguntas: 'Selección múltiple',
    parejas: 'Parejas',
    'verdadero-falso': 'Verdadero o falso',
    ordenar: 'Ordenar',
    clasificar: 'Clasificar',
    marcador: 'Marcador',
    temporizador: 'Temporizador',
  },
  editor: {
    titulo: 'Tu actividad',
    nombre: 'Nombre de la actividad',
    nombrePorDefecto: 'Actividad sin nombre',
    pegaTuTexto: 'Pega tu texto aquí',
    porEjemplo: (ejemplo: string) => `Por ejemplo:\n${ejemplo}`,
    comoEscribirlo: 'Cómo escribirlo',
    probarEjemplo: 'Probar con este ejemplo',
    ejemplos: {
      ruleta: 'Ana\nBenjamín\nCatalina\nDiego',
      preguntas: '¿Cuánto es 1/2 + 1/4?\na) 2/6\n*b) 3/4\nc) 1/8',
      parejas: 'perro = dog\ngato = cat\ncasa = house',
      'verdadero-falso': 'La ballena es un mamífero (V)\nEl Sol es un planeta (F)',
      ordenar: 'Semilla\nGerminación\nPlanta\nFlor\nFruto',
      clasificar: 'Mamíferos: perro, ballena, puma\nAves: cóndor, loica, pingüino',
    },
    comoEscribir: {
      ruleta: 'Un elemento por línea: nombres del curso, temas, preguntas para conversar.',
      preguntas: 'La pregunta y debajo sus alternativas a), b), c). Pon un * antes de la correcta.',
      parejas: 'Una pareja por línea, separada por =. También sirven dos columnas copiadas de Word o Excel.',
      'verdadero-falso': 'Una afirmación por línea, con (V) o (F) al final.',
      ordenar: 'Un elemento por línea, en el orden correcto. Al proyectar aparecen desordenados.',
      clasificar: 'Cada categoría con dos puntos y sus elementos separados por comas.',
    },
    listo: 'Listo',
    proyectar: 'Proyectar',
    imprimir: 'Imprimir',
    cargando: 'Abriendo la actividad…',
    noEncontrada: 'Esta actividad ya no existe. Puede que la hayas borrado.',
  },
  ruleta: {
    opciones: 'Opciones de la ruleta',
    eliminarAlSalir: 'Sacar de la ruleta lo que sale',
    sonido: 'Sonido al girar',
  },
  imprimir: {
    titulo: 'Imprimir',
    volver: 'Volver a la actividad',
    imprimir: 'Imprimir',
    queImprimir: '¿Qué quieres imprimir?',
    tarjetas: 'Tarjetas A, B, C, D',
    tarjetasVF: 'Tarjetas V y F',
    preguntas: 'Las preguntas en papel',
    afirmaciones: 'Las afirmaciones en papel',
    explicacionTarjetasVF:
      'Dos juegos de tarjetas V y F por hoja para recortar. Cada estudiante (o equipo) levanta la que elige.',
    instruccionVF: 'Escribe V si la afirmación es verdadera o F si es falsa.',
    explicacionTarjetas:
      'Cuatro tarjetas por hoja para recortar. Cada estudiante (o equipo) levanta la letra que elige. Sirven para cualquier repaso.',
    explicacionPreguntas:
      'Sin las respuestas, por si no hay proyector. La pauta con las respuestas sale en una hoja aparte.',
    nombreYCurso: 'Nombre: ______________________________   Curso: ________',
    instruccion: 'Encierra en un círculo la letra de la alternativa correcta.',
    pauta: (titulo: string) => `Pauta: ${titulo}`,
    sinMarcar: '(sin respuesta marcada)',
  },
  preguntas: {
    opciones: 'Opciones de las preguntas',
    temporizador: 'Tiempo para responder',
    sinTiempo: 'Sin tiempo',
    segundos: (s: number) => (s < 60 ? `${s} segundos` : s === 60 ? '1 minuto' : s % 60 === 0 ? `${s / 60} minutos` : `${Math.floor(s / 60)} min ${s % 60} s`),
    sonido: 'Sonido al acabarse el tiempo',
  },
  proyeccion: {
    girar: 'Girar',
    pantallaCompleta: 'Pantalla completa',
    salirPantallaCompleta: 'Salir de pantalla completa',
    salir: 'Salir',
    volverAEmpezar: 'Volver a empezar',
    ruletaInicio: 'Presiona Girar',
    ruletaDescripcion: (n: number) => `Ruleta con ${n} ${n === 1 ? 'elemento' : 'elementos'}`,
    salio: (elemento: string) => `Salió: ${elemento}`,
    quedan: (n: number, total: number) => `Quedan ${n} de ${total}`,
    enLaRuleta: (n: number) => `${n} en la ruleta`,
    todosSalieron: 'Ya salieron todos.',
    teclasRuleta: 'Espacio: girar · F: pantalla completa · Esc: salir',
    ruletaPocosElementos: 'La ruleta necesita al menos 2 elementos. Sal y agrega más en tu actividad.',
    tipoNoDisponible: 'Este tipo de actividad todavía no se puede proyectar.',
    sinPreguntas: 'Esta actividad no tiene preguntas con alternativas. Sal y revisa el texto.',
    numeroPregunta: (n: number, total: number) => `Pregunta ${n} de ${total}`,
    numeroAfirmacion: (n: number, total: number) => `Afirmación ${n} de ${total}`,
    parejasEncontradas: (n: number, total: number) => `Parejas: ${n} de ${total}`,
    memoriceInicio: 'Elijan dos cartas',
    esPareja: '¡Son pareja!',
    noEsPareja: 'No son pareja',
    memoriceTerminado: '¡Encontraron todas!',
    cartaTapada: (n: number) => `Carta ${n}, tapada`,
    tapar: 'Tapar',
    mostrarTodas: 'Mostrar todas',
    teclasParejas: 'Flechas: moverse · Espacio o Enter: voltear · F: pantalla completa · Esc: salir',
    sinParejas: 'Esta actividad no tiene parejas. Sal y revisa el texto.',
    enSuLugar: (n: number, total: number) => `${n} de ${total} en su lugar`,
    ordenTerminado: '¡Quedó ordenado!',
    ordenCorrecto: 'Orden',
    porOrdenar: 'Por ordenar',
    cualSigue: '¿Cuál va aquí?',
    noVaAqui: 'No va aquí',
    deshacerPaso: '← Deshacer',
    revelarSiguiente: 'Mostrar el que sigue',
    teclasOrdenar: 'Toca el que propone el curso · Espacio: el que sigue · ←: deshacer · Esc: salir',
    sinElementosOrdenar: 'Esta actividad necesita al menos 2 elementos para ordenar. Sal y revisa el texto.',
    ubicados: (n: number, total: number) => `${n} de ${total} clasificados`,
    clasificacionTerminada: '¡Todo clasificado!',
    categoriaBoton: (n: number, nombre: string) => `${n}: ${nombre}`,
    noVaEn: (categoria: string) => `No va en «${categoria}»`,
    ubicarSiguiente: 'Mostrar dónde va',
    elegirCategoria: 'Ahora toca su categoría, o presiona su número',
    teclasClasificar: 'Toca un elemento y luego su categoría · Espacio: mostrar dónde va · ←: deshacer · Esc: salir',
    sinCategorias: 'Esta actividad necesita al menos 2 categorías con elementos. Sal y revisa el texto.',
    teclasVF: 'Espacio: revelar y avanzar · ←: anterior · F: pantalla completa · Esc: salir',
    teclasVFConTiempo: 'Espacio: revelar y avanzar · ←: anterior · P: pausar · F: pantalla completa · Esc: salir',
    sinAfirmaciones: 'Esta actividad no tiene afirmaciones. Sal y revisa el texto.',
    sinEnunciado: '(Pregunta sin enunciado)',
    correcta: 'Correcta',
    paraComentar: 'Para comentar',
    revelar: 'Revelar respuesta',
    siguiente: 'Siguiente →',
    anterior: '← Anterior',
    terminar: 'Terminar',
    comentarError: 'Comentar el error',
    quitarComentario: 'Quitar comentario',
    elegirError: 'Toca la alternativa incorrecta que quieres comentar, o presiona su letra.',
    sinRespuestaMarcada: 'Esta pregunta no tiene la respuesta correcta marcada.',
    pausar: 'Pausar',
    seguir: 'Seguir',
    seAcaboElTiempo: '¡Tiempo!',
    repasoTerminado: 'Fin del repaso',
    terminaste: '¡Terminaron el repaso!',
    teclasPreguntas: 'Espacio: revelar y avanzar · ←: anterior · A a E: comentar el error · F: pantalla completa · Esc: salir',
    teclasPreguntasConTiempo:
      'Espacio: revelar y avanzar · ←: anterior · A a E: comentar el error · P: pausar · F: pantalla completa · Esc: salir',
  },
  vistaPrevia: {
    titulo: 'Así quedará',
    tipo: 'Tipo de actividad',
    sugerido: 'sugerido',
    revisa: 'Revisa esto',
    correcta: 'correcta',
    cantidad: (tipo: TipoConTexto, n: number) => {
      const [singular, plural] = {
        ruleta: ['elemento', 'elementos'],
        ordenar: ['elemento', 'elementos'],
        preguntas: ['pregunta', 'preguntas'],
        parejas: ['pareja', 'parejas'],
        'verdadero-falso': ['afirmación', 'afirmaciones'],
        clasificar: ['categoría', 'categorías'],
      }[tipo]
      return `${n} ${n === 1 ? singular : plural}`
    },
    verdadero: 'Verdadero',
    falso: 'Falso',
    sinMarcar: 'sin marcar',
    paso: (n: number) => `${n}.`,
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
    cambioOpciones: 'cambio de opciones',
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
    lineasSinPareja: (lineas: string[]) =>
      lineas.length === 1
        ? `No usamos esta línea porque no encontramos su pareja: ${citar(lineas)}. Escribe las dos partes separadas por =, por ejemplo: perro = dog.`
        : `No usamos estas líneas porque no encontramos su pareja: ${citar(lineas)}. Escribe las dos partes separadas por =, por ejemplo: perro = dog.`,
    sinParejas: 'Para el memorice se necesitan al menos 2 parejas. Escribe una por línea, separadas por =, por ejemplo: perro = dog.',
    demasiadasParejas: (cantidad: number, maximo: number) =>
      `Hay ${cantidad} parejas. El memorice se lee bien con ${maximo} como máximo.`,
    sinAfirmaciones: 'No encontramos afirmaciones. Escribe una por línea con (V) o (F) al final.',
    sinRespuesta: (numeros: number[]) =>
      numeros.length === 1
        ? `La afirmación ${numeros[0]} no dice si es verdadera o falsa. Agrega (V) o (F) al final.`
        : `Las afirmaciones ${enumerar(numeros.map(String))} no dicen si son verdaderas o falsas. Agrega (V) o (F) al final.`,
    ordenadoPorNumero: 'Los ordenamos según los números que traían.',
    pocosParaOrdenar: (minimo: number) => `Para ordenar se necesitan al menos ${minimo} elementos.`,
    demasiadosParaOrdenar: (cantidad: number, maximo: number) =>
      `Hay ${cantidad} elementos. Para ordenar en la sala se leen bien ${maximo} como máximo.`,
    lineasSinCategoria: (lineas: string[]) =>
      lineas.length === 1
        ? `No usamos esta línea porque no está bajo ninguna categoría: ${citar(lineas)}.`
        : `No usamos estas líneas porque no están bajo ninguna categoría: ${citar(lineas)}.`,
    pocasCategorias:
      'Para clasificar se necesitan al menos 2 categorías con elementos. Escribe cada categoría con dos puntos, por ejemplo: Mamíferos: perro, ballena.',
    categoriasVacias: (nombres: string[]) =>
      nombres.length === 1
        ? `La categoría ${citar(nombres)} no tiene elementos.`
        : `Las categorías ${citar(nombres)} no tienen elementos.`,
    enDosCategorias: (elementos: string[]) =>
      elementos.length === 1
        ? `${citar(elementos)} está en más de una categoría.`
        : `${citar(elementos)} están en más de una categoría.`,
    demasiadasCategorias: (cantidad: number, maximo: number) =>
      `Hay ${cantidad} categorías. Se ven bien en la sala ${maximo} como máximo.`,
    textosLargos: (largos: string[]) =>
      largos.length === 1
        ? `Este texto es largo y en la sala se verá con letra más chica: ${citar(largos)}. Si puedes, acórtalo.`
        : `Estos textos son largos y en la sala se verán con letra más chica: ${citar(largos)}. Si puedes, acórtalos.`,
    preguntasRepetidas: (numeros: number[]) =>
      `${preguntasN(numeros, 'aparece', 'aparecen')} más de una vez. No las borramos, por si es a propósito.`,
  },
} as const
