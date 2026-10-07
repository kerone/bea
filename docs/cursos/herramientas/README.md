# Herramientas para regenerar el contenido de un curso

Flujo usado para el curso 07 (Depilación láser · manual de 60 h):

1. `python3 -I docx2md.py manual.docx manual-bruto.md` — convierte el Word
   a Markdown (títulos, listas, tablas, marcadores de imagen `![[IMG:...]]`).
2. Extraer las imágenes del .docx (`unzip -j manual.docx 'word/media/*'`),
   optimizarlas a JPEG de 1000 px (Pillow) y guardar su base64 + `meta.json`
   con nombre corto y texto alternativo (ver `construir-*.py`).
3. `python3 -I materia-libro.py <carpeta> embed` (y `… docs`) — la MATERIA del
   aula con estructura de libro de texto: mismo texto del manual, envuelto en
   componentes `ac-*` (portada, índice, capítulos, objetivos, figuras,
   actividades, evidencias, casos) que index.html sabe pintar. Los tests y el
   examen se recortan (van a `test.questions` en courses-data.js).
   `node qa-materia.cjs preview.html capturas` fotografía la vista previa.
   (Versión anterior, sin estructura: `python3 -I construir-depilacion-laser.py <carpeta>`, que genera:
   - la materia `.md` con las imágenes embebidas (se sube desde el panel),
   - la copia versionada para `docs/cursos/` con imágenes como archivos,
   - (el deck automático que generaba este script se descartó: troceaba el
     texto en diapositivas y no servía para dar clase).
4. `python3 -I deck-depilacion-laser.py <carpeta>` — el deck DOCENTE real:
   diapositivas escritas a mano (una idea por pantalla, infografías con sus
   puntos clave, casos, cronogramas de las jornadas) y un panel de GUION
   (botón "Guion" o tecla N) con el texto íntegro del manual de cada
   diapositiva, para quien expone. Reutiliza el CSS/JS del deck original de
   PRECISSA y añade componentes (.split, .cards, .kpis, .pasos, .checks…).
5. `node qa-deck.cjs deck.html carpeta-capturas` — comprueba que ninguna
   diapositiva desborda los 720 px y saca capturas de muestra
   (`NODE_PATH` no sirve con ESM: el script usa `require` con ruta absoluta).
   `node qa-js.cjs deck.html carpeta` comprueba errores JS, navegación y guion.

La subida al bucket privado la hace la propietaria desde el panel de
administración (Materia → elegir archivo · Lección → subir HTML).
