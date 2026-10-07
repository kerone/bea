# Herramientas para regenerar el contenido de un curso

Flujo usado para el curso 07 (Depilación láser · manual de 60 h):

1. `python3 -I docx2md.py manual.docx manual-bruto.md` — convierte el Word
   a Markdown (títulos, listas, tablas, marcadores de imagen `![[IMG:...]]`).
2. Extraer las imágenes del .docx (`unzip -j manual.docx 'word/media/*'`),
   optimizarlas a JPEG de 1000 px (Pillow) y guardar su base64 + `meta.json`
   con nombre corto y texto alternativo (ver `construir-*.py`).
3. `python3 -I construir-depilacion-laser.py <carpeta>` — genera:
   - la materia `.md` con las imágenes embebidas (se sube desde el panel),
   - la copia versionada para `docs/cursos/` con imágenes como archivos,
   - el deck HTML con el estilo de PRECISSA (CSS/JS del deck original).
4. `node qa-deck.cjs deck.html carpeta-capturas` — comprueba que ninguna
   diapositiva desborda los 720 px y saca capturas de muestra
   (`NODE_PATH` no sirve con ESM: el script usa `require` con ruta absoluta).

La subida al bucket privado la hace la propietaria desde el panel de
administración (Materia → elegir archivo · Lección → subir HTML).
