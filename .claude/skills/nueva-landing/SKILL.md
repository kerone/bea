---
name: nueva-landing
description: Crea una landing SEO local nueva para un curso de PRECISSA (/cursos/<curso>-valencia/), con contenido real, schema, FAQ, formulario y todo el cableado (sitemap, catálogo, enlaces internos). Úsala cuando pidan "una landing para el curso X" o "posicionar el curso X en Valencia".
---

# Nueva landing de curso

Crea una landing local completa y la deja enlazada desde todo el sitio.

## Antes de escribir nada

1. Lee `CLAUDE.md`.
2. Saca los datos reales del curso de `assets/js/courses-data.js`
   (título, nivel, duración, descripción, categoría).
3. **Saca el contenido real del temario** para que la landing no sea humo. Si
   el curso tiene su deck en el bucket privado, pídeselo a la propietaria o
   usa la descripción larga de `courses-data.js`. Nunca inventes parámetros
   técnicos (longitudes de onda, profundidades, protocolos).
4. Decide el slug: `<curso>-valencia`, en minúsculas y sin tildes.

## Plantilla

**Copia la estructura de una landing existente** (`cursos/hifu-valencia/` es
buena referencia): comparte el mismo `<style>`, la misma cabecera, migas,
bloque de contacto y footer. Así no diverge el diseño.

## Contenido obligatorio (~900 palabras)

1. **Hero**: eyebrow, `<h1>` con "en Valencia", lede de 2 líneas, CTA
   "Solicitar información →" que baja a `#contacto`, y botón de llamar.
2. **Qué es** — 2 párrafos explicando la técnica con criterio, no marketing.
3. **El curso incluye** — lista de 10-12 puntos con `<strong>` + detalle.
4. **A quién va dirigido** — 3-4 perfiles.
5. **Ficha** — modalidad, nivel · duración, certificación.
6. **Seguridad y normativa** — 2 párrafos. Es lo que casi nadie escribe y
   Google premia (REACH en pigmentos, AEMPS en aparatología, requisitos
   higiénico-sanitarios de la Comunidad Valenciana).
7. **FAQ** — 7-8 preguntas reales, incluida siempre "¿Dónde se imparte el
   curso en Valencia?".
8. **Cursos relacionados** — 3 landings hermanas + enlace al catálogo.
9. **Contacto** con el formulario (ver abajo).

## Los 4 bloques JSON-LD

BreadcrumbList (Inicio → Cursos → esta), Course (con `hasCourseInstance`
onsite + online), EducationalOrganization (copia el de otra landing, con el
NAP y `areaServed` de Valencia) y FAQPage.

⚠️ **El FAQPage debe generarse desde el HTML visible**, no escribirse a mano:
mismas preguntas, mismas respuestas, mismo orden. Google lo exige.

## Formulario

Copia el bloque `lp-form` de otra landing: campos nombre / email / teléfono /
mensaje / casilla RGPD, endpoint de FormSubmit, campo oculto `producto` con el
nombre del curso y `origen` con el slug (así sabéis qué landing convierte).
Valida `res.ok` **y** `json.success`.

## Cableado (no te lo saltes: si no, la página queda huérfana)

- [ ] `sitemap.xml`: añadir la URL con `lastmod` de hoy y priority 0.9
- [ ] `cursos/index.html`: que el curso enlace a la landing en el HTML **y**
      en el `ItemList` del JSON-LD
- [ ] `index.html`: añadirla a la columna "Cursos en Valencia" del footer
- [ ] Las landings hermanas: añadirla a sus "cursos relacionados"
- [ ] `sw.js`: añadirla a `PRECACHE_URLS` y subir `CACHE_VERSION`

## Validar antes de publicar

Los 4 JSON-LD parsean · FAQ schema == HTML · el JS del formulario compila ·
todos los `href` internos existen · title ≤ 60 caracteres y meta description
≤ 160 · canonical y og:url iguales.

Después usa `/desplegar`.

## Al terminar

Dile a la propietaria que pida **indexación de la URL nueva** en Search
Console (Inspeccionar URL → Solicitar indexación): acelera semanas.
