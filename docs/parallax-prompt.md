# PRECISSA INSTITUTE — Implementar sección de scroll 3D con parallax por capas

> Prompt autosuficiente. Pégalo en Cowork o pásalo a un agente. Toda la información necesaria está aquí.

---

## 1. Qué hay que construir

Una **sección editorial con efecto parallax 3D al hacer scroll** dentro de la web PRECISSA INSTITUTE (escuela de estética + tienda de aparatología). La imagen base ya existe en disco. Hay que:

1. **Separar la imagen en 3 capas PNG** (fondo / rostro / mano).
2. **Integrar la sección** en `precissa.html` en el lugar indicado.
3. **Animar las capas al scrollear** con velocidades distintas → ilusión de profundidad real.

El resultado debe encajar con el sistema de diseño PRECISSA INSTITUTE: warm-neutral, editorial, sin animaciones spring exageradas.

---

## 2. Archivos de entrada

- **Proyecto:** `/Users/carlosalbiach/Documents/Web Bea/cowork-package/`
- **HTML a modificar:** `precissa.html` (ya existe, está montado siguiendo `prompt.md`)
- **Imagen original:** `le-petit-Jp4POW00eE0.jpg` (2624 × 3936 px, JPEG)
- **Spec maestra del sitio:** `prompt.md` (referencia para tokens, tono y componentes)

## 3. Qué hay en la imagen

Close-up editorial de un tratamiento de cejas (cosmetología). Tres planos de profundidad muy definidos:

| Plano | Contenido | Posición aprox. |
|---|---|---|
| **Fondo** | Cabina blureada, tonos honey/cream | Toda la imagen, sin recortar |
| **Medio** | Rostro de mujer (ojo cerrado, ceja, parte de mejilla) | Centro-izquierda, ~60% del frame |
| **Frente** | Mano con guante translúcido + cotton swab + herramienta pequeña | Esquinas superior-derecha e inferior |

Paleta: honey, cream, caramel, piel cálida. Encaja directamente con los tokens `--bg #F2ECE3`, `--soft #E5D9C5`, `--accent #A86B4E`.

---

## 4. Paso 1 — Separar la imagen en capas

Genera 3 archivos a partir del JPG original:

- `assets/parallax/layer-bg.jpg` → la imagen entera, sin tocar (versión `--bg`). Comprime a ~1800 px de ancho largo, calidad 80, formato WebP o JPEG.
- `assets/parallax/layer-face.png` → solo el rostro + ceja, fondo transparente.
- `assets/parallax/layer-hand.png` → solo la mano + guante + cotton swab + herramienta, fondo transparente.

**Cómo hacerlo (recomendado, automático):** usa `rembg` en Python.

```bash
pip install rembg pillow onnxruntime
```

```python
from rembg import remove, new_session
from PIL import Image

src = Image.open("cowork-package/le-petit-Jp4POW00eE0.jpg")

# Modelo bueno para retratos
session = new_session("isnet-general-use")

# Capa rostro: usar prompt de SAM o máscara manual
# Si rembg no separa bien rostro vs mano, usa segmentación con prompt:
#   pip install rembg[gpu,cli] && rembg i -m sam --sam-prompt ...
# Alternativa: producir UNA máscara global (sujeto-vs-fondo) y partir esa
# máscara en dos zonas por bounding-box (mano en zonas superior-derecha + inferior;
# rostro en el resto del sujeto).

# Pipeline mínimo viable:
foreground = remove(src, session=session)  # PNG con todo el sujeto recortado
foreground.save("cowork-package/assets/parallax/_full-cutout.png")
```

Si `rembg` no logra separar limpiamente mano de rostro, el fallback es:

1. Generar el cutout completo del sujeto (`_full-cutout.png`).
2. Pintar a mano dos máscaras en Photoshop / GIMP / Photopea (manos vs rostro) y exportar las dos PNG.

Si no se puede ejecutar Python en el entorno, **deja preparado el HTML/CSS/JS pensando en las 3 capas y deja un comentario en el código indicando los nombres de archivo esperados**. La persona usuaria las generará después.

---

## 5. Paso 2 — Dónde colocar la sección en `precissa.html`

**Ubicación recomendada:** entre la sección **Áreas de especialización** (sección 4 del Home según `prompt.md`) y la sección **Tests** (sección 5). Sirve como respiro editorial antes de cambiar de tema.

**Alternativa válida:** como hero de la card de **Cosmetología** dentro del grid de áreas (más integrado, menos protagonista).

Ir con la **principal** salvo que el HTML actual no tenga espacio razonable para un bloque vertical largo.

---

## 6. Paso 3 — HTML, CSS y JS

### Estructura HTML

```html
<section class="parallax-editorial" aria-label="Cosmetología en cabina">
  <div class="parallax-stage">
    <img class="parallax-layer" data-depth="0.08"
         src="assets/parallax/layer-bg.jpg"
         alt="" loading="lazy" decoding="async">
    <img class="parallax-layer" data-depth="0.22"
         src="assets/parallax/layer-face.png"
         alt="" loading="lazy" decoding="async">
    <img class="parallax-layer" data-depth="0.45"
         src="assets/parallax/layer-hand.png"
         alt="" loading="lazy" decoding="async">

    <div class="parallax-copy">
      <span class="eyebrow">· Cosmetología en cabina</span>
      <h2 class="display">
        El detalle se aprende <em>mirando.</em>
      </h2>
      <p class="lede">
        Cada protocolo de PRECISSA INSTITUTE se graba sobre piel real. Cejas, labios, párpado.
        La <em>técnica</em> antes que el resultado.
      </p>
      <a class="link-arrow" href="/cursos/cosmetologia">
        Ver itinerario de Cosmetología <span aria-hidden="true">→</span>
      </a>
    </div>
  </div>
</section>
```

Notas:
- `alt=""` en las imágenes porque son decorativas; el contexto va en `aria-label` y en el copy visible.
- `data-depth` controla la velocidad de cada capa (más alto = se mueve más rápido = más cerca del usuario).
- El bloque `.parallax-copy` se mantiene quieto sobre las capas que se mueven.

### CSS

```css
.parallax-editorial {
  position: relative;
  background: var(--bg2, #E6DDCC);
  padding: 96px 64px;
  overflow: hidden;
}

.parallax-stage {
  position: relative;
  max-width: 1280px;
  margin: 0 auto;
  aspect-ratio: 16 / 10;          /* en móvil cambia a 3/4 abajo */
  border-radius: 10px;
  overflow: hidden;
  isolation: isolate;
}

.parallax-layer {
  position: absolute;
  inset: -8% -8%;                  /* margen extra para que al moverse no asome borde */
  width: 116%;
  height: 116%;
  object-fit: cover;
  object-position: center;
  will-change: transform;
  transform: translate3d(0, 0, 0);
  transition: transform 80ms linear;  /* suavizado mínimo */
}

.parallax-copy {
  position: absolute;
  left: 48px;
  bottom: 48px;
  max-width: 440px;
  color: var(--bg, #F2ECE3);
  z-index: 2;
}

.parallax-copy .eyebrow {
  font-family: 'Manrope', sans-serif;
  font-size: 10.5px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--accent-soft, #ECDDD0);
  display: block;
  margin-bottom: 16px;
}

.parallax-copy .display {
  font-family: 'Instrument Serif', serif;
  font-size: 54px;
  line-height: 1.02;
  letter-spacing: -0.022em;
  margin: 0 0 18px;
}
.parallax-copy .display em { font-style: italic; }

.parallax-copy .lede {
  font-family: 'Manrope', sans-serif;
  font-size: 15px;
  line-height: 1.55;
  margin: 0 0 22px;
  color: rgba(242, 236, 227, 0.88);
}

.parallax-copy .link-arrow {
  font-family: 'Manrope', sans-serif;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--accent-soft, #ECDDD0);
  border-bottom: 1px solid currentColor;
  padding-bottom: 2px;
  text-decoration: none;
}

/* Overlay sutil para que el copy se lea bien sobre las capas */
.parallax-stage::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(36, 29, 23, 0.45) 0%,
    rgba(36, 29, 23, 0.15) 40%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 1;
}

@media (max-width: 768px) {
  .parallax-editorial { padding: 56px 18px; }
  .parallax-stage { aspect-ratio: 3 / 4; border-radius: 8px; }
  .parallax-copy {
    left: 22px;
    right: 22px;
    bottom: 28px;
    max-width: none;
  }
  .parallax-copy .display { font-size: 34px; }
}

@media (prefers-reduced-motion: reduce) {
  .parallax-layer {
    transform: none !important;
    transition: none;
  }
}
```

### JavaScript

Vanilla, sin dependencias. Usa `IntersectionObserver` para activar el listener solo cuando la sección está en viewport, y `requestAnimationFrame` para animar a 60 fps.

```html
<script>
(() => {
  const stage = document.querySelector('.parallax-stage');
  if (!stage) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const layers = stage.querySelectorAll('.parallax-layer');
  let active = false;
  let raf = null;

  const update = () => {
    const rect = stage.getBoundingClientRect();
    const vh = window.innerHeight;
    // progress: -1 (sección entrando por abajo) → 0 (centrada) → 1 (saliendo por arriba)
    const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
    const clamped = Math.max(-1.2, Math.min(1.2, progress));

    layers.forEach((layer) => {
      const depth = parseFloat(layer.dataset.depth) || 0.1;
      const translate = -clamped * depth * 120; // px
      layer.style.transform = `translate3d(0, ${translate.toFixed(2)}px, 0)`;
    });
    raf = null;
  };

  const onScroll = () => {
    if (raf === null) raf = requestAnimationFrame(update);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !active) {
        active = true;
        window.addEventListener('scroll', onScroll, { passive: true });
        update();
      } else if (!entry.isIntersecting && active) {
        active = false;
        window.removeEventListener('scroll', onScroll);
      }
    });
  }, { rootMargin: '20% 0px' });

  io.observe(stage);
})();
</script>
```

---

## 7. Restricciones y criterios de aceptación

- **Performance:** 60 fps en scroll. Solo `transform` (nada de cambiar `top`/`left`/`margin`). `will-change: transform` solo en capas activas.
- **Accesibilidad:** respeta `prefers-reduced-motion` (sin movimiento). Imágenes decorativas con `alt=""`. Copy con contraste AA mínimo sobre la imagen (de ahí el gradiente overlay).
- **Sin dependencias externas:** no añadas GSAP, Lenis, ni Three.js. Vanilla JS y CSS puros.
- **Sin frameworks de animación tipo spring** (lo prohíbe el brief).
- **Mobile:** funciona pero con menos intensidad — `data-depth` se mantiene, la aspect ratio cambia a 3/4. Si en tests el efecto se siente excesivo en móvil, multiplicar el `translate` por `0.6` en `<= 768px`.
- **No tocar nada fuera de la sección nueva.** Resto del HTML/CSS intacto.

---

## 8. Cómo verificar que está bien

1. Abre `precissa.html` en un navegador.
2. Haz scroll lento hasta la sección. Las 3 capas deben moverse a distinta velocidad: fondo lento, rostro medio, mano rápida.
3. Activa "reducir movimiento" en el SO → el efecto se desactiva, la imagen queda fija.
4. Redimensiona a 390 px → layout móvil, sin glitches.
5. Lighthouse / DevTools → no hay layout shift (CLS = 0), scroll a 60 fps.

---

## 9. Entregable

- `precissa.html` modificado (nueva sección integrada en el orden indicado).
- `assets/parallax/layer-bg.jpg|.webp`
- `assets/parallax/layer-face.png`
- `assets/parallax/layer-hand.png`
- (Opcional) un script `scripts/build-parallax-layers.py` si has automatizado la separación con `rembg`.

Si alguna de las capas no se puede generar automáticamente, deja los archivos como placeholder con un comentario `<!-- TODO: generar capa manualmente -->` y el resto funcionando.
