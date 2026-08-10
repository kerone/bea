---
name: auditar-web
description: Auditoría completa del sitio PRECISSA con revisores en paralelo (páginas nuevas, regresiones de la SPA, SEO global y verificación de arreglos previos). Úsala cuando pidan "auditar la web", "revisar que todo esté bien", "buscar errores" o antes de una tanda grande de cambios.
---

# Auditar la web

Lanza cuatro revisores **en paralelo y en modo solo lectura**, contrasta tú
mismo los hallazgos más graves contra el código, y presenta un informe
priorizado en español.

## Cómo ejecutarla

1. Lee `CLAUDE.md` para tener el contexto del proyecto.
2. Comprueba qué ha cambiado desde la última auditoría:
   `git log --oneline -20` y `git diff --stat HEAD~5`.
3. Lanza los **4 agentes a la vez** (todos en una sola respuesta, para que
   corran concurrentes). Usa `general-purpose`.
4. A cada agente dale: el ámbito, los datos oficiales del negocio (NAP) y la
   lista de "conocido e intencionado" para que no reporte falsos positivos.
5. Cuando terminen, **verifica tú mismo los 3-4 hallazgos más graves** leyendo
   el código. Los agentes se equivocan; no traslades nada sin comprobarlo.
6. Presenta el informe.

## Los cuatro ámbitos

**1 · Páginas nuevas o modificadas** — HTML bien formado, JSON-LD que parsea,
FAQ del schema idéntica al HTML visible, enlaces internos que existen, NAP
correcto, sin contenido cruzado entre cursos, analytics presente, viewport.

**2 · Regresiones de la SPA** — `index.html` y `assets/js/*`: sintaxis (extrae
los `<script>` y valida), IDs del DOM que existan, condiciones de carrera,
dobles render, el caso logout, que el router no entre en bucle. Recuerda las
trampas de la sección 7 de CLAUDE.md.

**3 · SEO global** — canibalización entre landings, sitemap vs archivos reales,
enlazado interno y páginas huérfanas, coherencia de los JSON-LD, metas
sociales, densidad de keyword, robots.txt.

**4 · Verificación de arreglos previos** — recorre la sección 6 y 7 de
CLAUDE.md punto por punto y confirma que ninguno ha vuelto a romperse.
Incluye: sitemap sin `#`, FAQ sincronizadas, un solo H1, `escapeJs` en los
onclick, versiones de CDN fijadas, decks con noindex, `assets/cursos/` que
sigue sin existir.

## Reglas para los agentes

Ponlo explícito en cada prompt:

- **SOLO LECTURA**: no modificar archivos ni tocar git.
- Devolver máximo 12 hallazgos, con archivo, línea, severidad
  (critical/high/medium/low), título en español y 2-3 frases con **evidencia
  citada**.
- Distinguir "confirmado" de "sospecha".
- Terminar con una línea de lo verificado sin incidencias.
- Texto plano estructurado, **no JSON**.

## Formato del informe final

En español, para alguien que no es desarrollador:

1. **Resumen en una frase.**
2. **✅ Lo que está bien** (breve, da tranquilidad y evita repetir trabajo).
3. **🔴 Lo que está mal** — problemas reales, con el impacto **en el negocio**,
   no en el código ("las alumnas ven X", "Google no indexa Y").
4. **🟡 Mejorable** — sin urgencia.
5. **Tu criterio**: si discrepas de algún revisor, dilo y explica por qué.
6. Pregunta si quiere que lo arregles.
