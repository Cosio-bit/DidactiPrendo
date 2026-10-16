import { useEffect, useState } from 'react'

export type Tema = 'normal' | 'alto-contraste'

const CLAVE = 'didactiprendo:tema'

function leerTema(): Tema {
  try {
    return localStorage.getItem(CLAVE) === 'alto-contraste' ? 'alto-contraste' : 'normal'
  } catch {
    return 'normal'
  }
}

export function useTema() {
  const [tema, setTema] = useState<Tema>(leerTema)

  useEffect(() => {
    document.documentElement.dataset.tema = tema
    try {
      localStorage.setItem(CLAVE, tema)
    } catch {
      // Sin almacenamiento local el tema dura solo esta visita.
    }
  }, [tema])

  return [tema, setTema] as const
}
