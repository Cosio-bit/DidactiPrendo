# Textos reales de profesores

Aquí van los textos que manden profesores, **tal como los copiaron** desde Word, Google Docs,
Excel o ChatGPT. Un archivo `.txt` por texto, con un nombre que diga de dónde viene, por ejemplo
`word-guia-fracciones-6b.txt` o `chatgpt-quiz-ciencias.txt`.

- Antes de guardarlo, cambia los nombres de estudiantes por nombres inventados.
- Al correr `npm run test`, se crea `lecturas/<nombre>.json` con lo que entendió el lector.
  **Revísalo a mano**: si está bien, súbelo junto con el `.txt`; si no, hay que mejorar el lector.
- Si después cambia el lector y una lectura cambia, la prueba falla y muestra la diferencia.
  Si el cambio es correcto, actualiza con `npx vitest run -u`.
