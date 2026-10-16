import { liveQuery } from 'dexie'
import { useEffect, useState } from 'react'

export type Resultado<T> = { listo: false } | { listo: true; valor: T }

/**
 * Ejecuta una consulta y la repite cada vez que cambian los datos guardados.
 * La consulta se vuelve a armar solo cuando cambia `clave` (por ejemplo, el id del bloque).
 */
export function useConsulta<T>(consulta: () => Promise<T>, clave: string): Resultado<T> {
  const [resultado, setResultado] = useState<Resultado<T>>({ listo: false })

  useEffect(() => {
    setResultado({ listo: false })
    const suscripcion = liveQuery(consulta).subscribe({
      next: (valor) => setResultado({ listo: true, valor }),
      error: (error) => console.error(error),
    })
    return () => suscripcion.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave])

  return resultado
}
