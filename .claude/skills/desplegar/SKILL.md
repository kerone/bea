---
name: desplegar
description: Valida el sitio PRECISSA (JSON-LD, sintaxis JS, sitemap, enlaces, FAQ sincronizadas) y solo si todo pasa, commitea y publica en el Worker de Cloudflare. Úsala antes de cualquier push, o cuando pidan "publica los cambios", "sube esto".
---

# Validar y publicar

Nunca hagas push sin pasar esta comprobación. Un JSON-LD roto o un `<script>`
con un error de sintaxis tumba la web entera, y solo se nota en producción.

## 1. Qué ha cambiado

```bash
git status --short && git diff --stat
```

## 2. Validaciones (todas deben pasar)

**JSON-LD de las páginas tocadas**

```python
import re, json
for b in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
    json.loads(b)   # revienta si hay un error
```

**JavaScript inline de index.html** (son 2 bloques; extráelos y compílalos)

```javascript
const s = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
for (const x of s) new Function(x);   // lanza si hay error de sintaxis
```

**JS externo**: `node --check` sobre cada archivo tocado de `assets/js/` y
sobre `sw.js`.

**sitemap.xml** (si lo tocaste): que parsee como XML y **que no contenga
ninguna URL con `#`**.

**FAQ sincronizadas** (si tocaste una landing): las preguntas y respuestas del
bloque `FAQPage` deben coincidir literalmente con las del HTML visible, en el
mismo orden.

**Enlaces internos nuevos**: que el archivo destino exista en disco.

## 3. Publicar

Solo si todo lo anterior pasa:

```bash
git add -A
git commit -m "<mensaje claro en español, sin tildes en el asunto>"
git push origin <rama-actual>:main
git push origin <rama-actual>
```

> El despliegue va a `main`: el Worker de Cloudflare publica automáticamente
> al recibir el push. Se empuja también a la rama de trabajo para mantenerlas
> sincronizadas.

## 4. Después

- Di a la propietaria que **tarda ~2 minutos** en verse.
- Si es un cambio visual, recuérdale probar en **incógnito** (el service
  worker puede servirle la versión anterior en su navegador normal).
- Si tocaste `sw.js`, sube `CACHE_VERSION`.

## Si el cambio "no se ve"

Por orden, sin saltarte pasos:
1. ¿Llegó el push a `main`? (`git log origin/main --oneline -3`)
2. ¿El build del Worker está en verde? (Cloudflare → Workers & Pages →
   `precissainstitute` → Deployments)
3. Solo entonces: caché del navegador.

Nunca afirmes que algo está publicado sin haber comprobado 1 y 2.
