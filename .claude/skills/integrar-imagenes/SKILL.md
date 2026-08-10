---
name: integrar-imagenes
description: Integra portadas de cursos en la web de PRECISSA — optimiza las imágenes, genera WebP, las coloca en assets/ y las cablea en courses-data.js con su alt. Úsala cuando la propietaria envíe imágenes de cursos o diga "monta estas portadas", "integra las fotos de Firefly".
---

# Integrar portadas de cursos

Las imágenes llegan de Adobe Firefly a 16:9 y suelen pesar 2-4 MB. Hay que
dejarlas listas para web y cablearlas.

## 1. Localiza las imágenes

- Si la propietaria las adjunta al chat, estarán en la carpeta de subidas.
- Si ejecuta Claude en su Mac, pregunta la carpeta (normalmente `~/Downloads`).
- Empareja cada archivo con su **id de curso** de `courses-data.js`. Si el
  nombre no lo deja claro, **abre la imagen y mírala** antes de asignarla:
  colocar la foto equivocada en un curso es peor que no ponerla.

## 2. Optimiza

Las tarjetas del catálogo se muestran a ~600 px de ancho. Objetivo: **≤ 120 KB**.

```python
from PIL import Image
im = Image.open(src).convert('RGB')
# 16:9 → 1200x675 va sobrado para retina en las tarjetas
im.thumbnail((1200, 1200), Image.LANCZOS)
im.save(f'assets/{course_id}.jpg', 'JPEG', quality=80, optimize=True, progressive=True)
im.save(f'assets/{course_id}.webp', 'WEBP', quality=80, method=6)
```

Nombra siempre con el **id exacto del curso**: `assets/hifu.jpg`,
`assets/microblading-cejas.jpg`…

## 3. Cablea en courses-data.js

Cambia el `cover` de cada curso de `assets/le-petit.jpg` a su imagen propia.
Edita con precisión (el `cover` correcto dentro del objeto correcto); no hagas
reemplazos globales a ciegas.

## 4. Texto alternativo

Las plantillas de tarjeta usan `alt=""` genérico. Si añades `alt`, que
describa la escena real y mencione el curso
(*"Aplicación de HIFU en el contorno mandibular · curso en Valencia"*).
Suma en accesibilidad y en búsqueda de imágenes.

## 5. Comprueba

- Todas las rutas de `cover` existen en disco
  (`node -e` cargando courses-data.js y comprobando con `fs.existsSync`)
- Ninguna imagen pasa de 120 KB
- Cuenta cuántos cursos siguen con `le-petit.jpg` y dilo en el resumen

Después, `/desplegar`.

## Contexto útil

- Son 23 cursos. Al principio, 21 compartían la portada de relleno.
- `le-petit.jpg` es el marcador de posición **a propósito** mientras faltan
  fotos: no lo borres aunque quede sin uso.
- Los prompts de Firefly y el reparto por curso están en el historial del
  proyecto; el plan gratuito son 25 imágenes al mes.
