# AUREA — Escuela de estética avanzada

Web estática (HTML/CSS/JS puro, sin dependencias) para la academia de estética **AUREA**.
Incluye el sistema de marketing editorial + un **visor de lección visual** con animación parallax 3D al hacer scroll, basado en el temario "La piel · Introducción".

---

## 📂 Estructura del proyecto

```
.
├── index.html              ← La web completa (single page, varias pantallas)
├── assets/                 ← Imágenes y recursos
│   ├── le-petit.jpg        ← Imagen usada en el parallax 3D
│   └── IMG-20260522-WA0032.jpg
├── docs/                   ← Documentación y materiales fuente
│   ├── Temario_La_Piel.docx  ← Temario académico completo (50 págs.)
│   └── parallax-prompt.md    ← Especificación técnica de la sección parallax
├── .gitignore
└── README.md
```

---

## 🚀 Cómo verla en local

No necesita build ni instalación. Tres opciones:

### Opción A — Doble clic
Abre `index.html` directamente con el navegador. Funciona, aunque algunas imágenes pueden tardar más por la política `file://`.

### Opción B — Servidor con Python (sin instalar nada extra)

```bash
python3 -m http.server 8000
```

Luego abre [http://localhost:8000](http://localhost:8000).

### Opción C — Servidor con Node

```bash
npx --yes http-server -p 8000 -c-1
```

---

## 🧭 Pantallas disponibles

La web es una SPA (single page) con varias "pantallas" que se conmutan vía `goTo()`:

| Pantalla | Cómo llegar | Contenido |
|---|---|---|
| **Home** | Por defecto | Hero editorial, áreas de especialización, cursos destacados, aparatología, tests, testimonios |
| **Curso** | Click en "Cursos" o cualquier "Ver curso →" | Detalle del curso *Anatomía y fisiología cutánea*, con 16 lecciones en 4 módulos |
| **Lección** | Click en la lección 1 del curso | **Lección visual con 9 diapositivas + parallax 3D + quiz final** |
| **Test** | Botón "Hacer test" en home/lección | Tests interactivos con feedback |
| **Resultado** | Tras enviar un test | Score, certificado, revisión de respuestas |
| **Tienda** | "Aparatología" en la nav | Catálogo de aparatos |
| **Producto** | Click en un producto | Detalle con galería y card "Aprende a usarlo" |

> Consejo: el flujo principal de demo es **Home → Cursos → Lección 1** para ver la nueva lección visual con el parallax 3D.

---

## 🎓 La lección visual (lección 1 — La piel)

9 diapositivas que se descubren con scroll suave:

1. **Portada** — Título grande + meta (duración, slides, test)
2. **Concepto** — Cifras clave de la piel (2 m², 5 kg, 28 días, 4M+ receptores)
3. **Las 3 capas** — Diagrama interactivo (epidermis, dermis, hipodermis)
4. **Piel fina vs gruesa** — Comparativa visual
5. **Editorial parallax 3D** — La imagen `le-petit.jpg` con efecto profundidad al scrollear
6. **Tu trabajo** — La responsabilidad del profesional
7. **Tres ideas claras** — Resumen visual
8. **Quiz** — 3 preguntas con feedback inmediato
9. **Cierre** — Resultado y CTA a la siguiente lección

Navegación lateral con dots (desktop), topbar de progreso fija, fade-in al entrar en viewport. Respeta `prefers-reduced-motion`.

### Si quieres separar la imagen `le-petit.jpg` en 3 capas reales

El HTML/JS ya está preparado para varias capas con `data-depth` distintos. Sigue las instrucciones de `docs/parallax-prompt.md` (usar `rembg` para separar fondo / rostro / mano) y sustituye el `<img>` único en la sección `.lv-parallax-stage` por tres `<img class="lv-parallax-layer" data-depth="...">`.

---

## 📚 Temario académico

`docs/Temario_La_Piel.docx` contiene el temario completo de FP Estética sobre "La Piel" (16 unidades, glosario, autoevaluaciones, ~50 páginas). Es la base de los contenidos del curso *Anatomía y fisiología cutánea* dentro de la web.

---

## 🌍 Subir a GitHub

Desde la raíz del proyecto:

```bash
git init
git add .
git commit -m "Initial commit: AUREA — web + lección visual de la piel"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

### Publicar como GitHub Pages

1. En el repo de GitHub → **Settings** → **Pages**.
2. **Source**: *Deploy from a branch* → branch `main` / folder `/ (root)` → **Save**.
3. La web quedará publicada en `https://TU_USUARIO.github.io/TU_REPO/`.

No hace falta build: el `index.html` se sirve tal cual.

---

## 🎨 Sistema de diseño (tokens CSS)

Todo el sistema vive en `:root` dentro de `<style>` en `index.html`:

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#F2ECE3` | Fondo base, "cream" |
| `--bg2` | `#E6DDCC` | Fondo alterno, "cream profundo" |
| `--ink` | `#241D17` | Texto principal, "espresso" |
| `--accent` | `#A86B4E` | Acento "clay" |
| `--accent-dark` | `#7E4C36` | Hover del acento |
| `--accent-soft` | `#ECDDD0` | Fondos suaves de acento |
| `--serif` | `'Instrument Serif'` | Titulares editoriales |
| `--sans` | `'Manrope'` | Texto y UI |

---

## 🛠️ Próximos pasos sugeridos

- [ ] Separar `le-petit.jpg` en 3 capas PNG reales con `rembg` (instrucciones en `docs/parallax-prompt.md`).
- [ ] Crear las lecciones 2–16 reutilizando la estructura de la lección 1 (`#page-leccion`).
- [ ] Migrar a Next.js + Supabase cuando se necesite login, progreso persistente y certificados reales.
- [ ] Integrar Stripe para los pagos de cursos y aparatología.

---

## 📄 Licencia

Proyecto privado para la academia AUREA. Todos los derechos reservados.
