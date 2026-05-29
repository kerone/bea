# Prompts Adobe Firefly · Portadas de cursos
> Generación de imágenes editoriales para usar como `cover` de cada curso.
> Mantienen la línea estética de las 4 categorías de la home: apothecary,
> luz cálida natural, paleta cream/beige/rose/clay, estilo documental, LUMINA
> presente en bodegón cuando es coherente con la escena.

---

## Tips antes de generar

- **Aspect ratio**: usa 16:9 horizontal (encaja con el card de los cursos)
- **Style / Visual intensity**: pon estilo "Photo" (no "Art"); intensidad media-alta
- **Reference image**: si quieres mayor coherencia entre todas, sube como referencia uno de los aciertos de las 4 categorías y baja la fuerza al 30-40%
- **Si Firefly censura algún prompt** (especialmente "plasma", "laser", "needle"): cambia el verbo por descripción más genérica ("device", "applicator", "treatment tool") y ejecuta de nuevo
- **Naming**: guarda cada imagen con el `id` del curso, ej. `assets/cursos/01-plasma-pen.jpg`, `02-hifu.jpg`, etc. Después actualizamos los `cover:` en `courses-data.js` en una sola pasada

---

## ESTÉTICA FACIAL AVANZADA

### 1 · Higiene Facial Profunda *(`higiene-facial-profunda`)*
```
Editorial photograph in a soft-lit aesthetic cabin. A young woman lying on a
treatment bed with her forehead wrapped in a cream cotton headband, her face
freshly cleansed and glowing. The aesthetician's hand gently applying a
translucent enzymatic peel with a fan brush along her cheekbone. Warm natural
daylight filtering through linen curtains, cream beige and dusty rose palette,
soft shadows on cream cotton sheets. A single amber-glass apothecary bottle
on a stone tray slightly out of focus in the background. Apothecary aesthetic,
Aesop x Officine Universelle Buly mood. Documentary editorial photography,
natural unretouched skin texture, fine film grain. 16:9 horizontal.
```

### 2 · Anatomía y fisiología cutánea *(`anatomia-fisiologia-cutanea`)*
```
Editorial extreme macro close-up of a young woman's cheek and jawline in side
profile, capturing natural unretouched skin texture, fine peach fuzz and a
subtle warm glow. Soft directional golden hour daylight from the left, cream
beige and rose palette, soft natural shadows. Background a blurred linen drape
in cream tone. Apothecary aesthetic, like a Vogue beauty close-up shot for a
dermatology feature. Documentary photography, natural film grain. 16:9 horizontal.
```

### 3 · Lifting + tinte de pestañas *(`pestanas-lifting-tinte`)*
```
Editorial macro close-up of a closed female eye during a lash lifting treatment.
A small silicone curling pad on the eyelid, the natural lashes curving upward
against it, glossy with lifting cream. The aesthetician's hand in a soft latex
glove holding a fine micro brush at the lash line. Warm natural daylight, cream
beige and rose palette, soft shadow on the eyelid. A small ceramic dish with
warm amber lash tint blurred in the background. Apothecary cabin aesthetic,
no makeup, Aesop mood. Documentary editorial photography, fine film grain.
16:9 horizontal.
```

### 4 · Extensiones de pestañas *(`pestanas-extensiones`)*
```
Editorial macro close-up of a closed female eye while an aesthetician applies
silk lash extensions. A hand in soft glove holding fine precision tweezers
placing one extension onto a natural lash. A cream gauze eye pad under the
lower lash line. Warm natural daylight, cream and beige palette, soft shadow.
Background slightly blurred showing a row of glossy black lash fans arranged
on a strip of cream linen. Apothecary aesthetic, calm and precise, like a
luxury beauty editorial. Documentary photography style, fine film grain. 16:9
horizontal.
```

### 5 · Diseño de cejas · Visajismo *(`cejas-diseno-visajismo`)*
```
Editorial portrait of a young woman, eyes closed in soft expression, the
aesthetician's hand drawing delicate measurement marks on her brow with a thin
white pencil. A small caliper-like measuring tool resting on her cheek. Three
small pencil dots mapping the brow architecture. Warm natural daylight, cream
beige and dusty rose palette, soft shadows, no makeup. Apothecary aesthetic,
calm and intentional. Documentary editorial photography, natural skin texture,
fine film grain. Composition centered on the brow area. 16:9 horizontal.
```

### 6 · Laminado + henna de cejas *(`cejas-laminado-henna`)*
```
Editorial macro close-up of a female brow during a brow lamination treatment.
The aesthetician's hand brushing creamy lamination paste through brow hairs
with a small angled brush, hairs aligned upward. A small ceramic dish with
warm henna paste blurred in the background. Warm natural daylight, cream
beige and warm amber palette, soft shadow. Apothecary cabin aesthetic, Aesop x
Officine Universelle Buly mood. Documentary photography style, natural skin,
fine film grain. 16:9 horizontal.
```

---

## ELECTROESTÉTICA

### 7 · Plasmapen *(`plasma-pen`)*
```
Editorial close-up of an aesthetician's gloved hand holding a sleek plasma
pen device near a woman's temple. A delicate tiny spark visible between the
tip and the skin, very subtle. The patient's eyes closed in calm. Warm natural
daylight in a soft-lit treatment cabin, cream beige and rose palette, soft
shadows on cream cotton sheets. A single amber apothecary glass bottle and a
stack of folded cream cotton towels on the side, slightly out of focus.
Apothecary aesthetic, calm clinical not sterile. Documentary editorial
photography, natural skin texture, fine film grain. 16:9 horizontal.
```

### 8 · Hyaluron Pen *(`hyaluron-pen`)*
```
Editorial close-up of an aesthetician's hand holding a slim silver hydraulic
applicator device pressed against a woman's lips. The device resembles a
refined fountain pen. Patient's eyes closed in calm, natural skin texture.
Warm natural daylight in a treatment cabin, cream beige and rose palette,
soft shadows on cream cotton sheets. A small amber dropper bottle on a stone
tray, blurred in the background. Apothecary aesthetic, calm and precise.
Documentary editorial photography, fine film grain. 16:9 horizontal.
```

### 9 · Dermapen · Microneedling *(`dermapen-microneedling`)*
```
Editorial close-up of an aesthetician's hand holding a microneedling pen
device gliding across a woman's cheek. The device has a sleek matte black
body. Subtle micro-points of pink flush on the cheek suggesting microneedling
effect. Patient's eyes closed in calm. Warm natural daylight in treatment
cabin, cream beige and dusty rose palette, soft shadow. A small amber glass
bottle in the background, blurred. Apothecary aesthetic, controlled and
precise. Documentary editorial photography, natural skin texture, fine film
grain. 16:9 horizontal.
```

### 10 · Vacuum · Cavitación · Radiofrecuencia corporal *(`vacuum-cavitacion-radiofrecuencia`)*
```
Editorial overhead flat-lay shot of three professional body aesthetic device
handles arranged on a cream linen cloth: a vacuum suction cup head, an
ultrasonic cavitation transducer, and a tripolar radiofrequency applicator.
Each device sleek and minimal in matte white and rose gold. Surrounded by
neatly rolled cream cotton towels, an amber apothecary glass bottle and a
small ceramic dish of warm massage oil. Warm natural daylight from the left,
cream beige and clay palette, soft shadows. Apothecary aesthetic, Aesop mood.
Documentary editorial photography, natural film grain. 16:9 horizontal.
```

### 11 · Diatermia *(`diatermia`)*
```
Editorial close-up of a woman's jawline during a radiofrequency treatment.
The aesthetician's gloved hand guiding a sleek tripolar handpiece across the
cheek, with a thin sheen of conductive gel on the skin and a subtle warm pink
glow at the contact area. Patient's eyes closed in calm. Warm natural daylight,
cream beige and rose palette, soft shadow on cream linen. A small amber
apothecary bottle and folded cream towels blurred in the background. Apothecary
cabin aesthetic, calm precision. Documentary editorial photography, natural
skin texture, fine film grain. 16:9 horizontal.
```

### 12 · IPL · Fotorejuvenecimiento *(`ipl-fotorejuvenecimiento`)*
```
Editorial close-up of a woman's cheek during an intense pulsed light treatment.
The aesthetician's hand holding a sleek matte IPL handpiece pressed against
the skin, a soft warm yellow flash glow at the contact point. Patient wearing
protective dark goggles. Warm natural daylight, cream beige and warm amber
palette, soft shadow on cream linen. Apothecary cabin aesthetic, controlled
and precise. Documentary editorial photography, natural skin, fine film grain.
16:9 horizontal.
```

### 13 · Depilación láser *(`depilacion-laser`)*
```
Editorial close-up of an aesthetician's gloved hand holding a diode laser
handpiece gliding across a woman's calf or forearm. Patient wearing protective
dark goggles. A faint cool blue tint at the contact head between handle and
skin. Warm natural daylight in a treatment cabin, cream beige and clay palette,
soft shadow on cream linen drape. A small amber apothecary bottle blurred in
the background. Apothecary aesthetic, calm precision. Documentary editorial
photography, fine film grain. 16:9 horizontal.
```

### 14 · Láser Q-switched Nd:YAG · Carbon Peel *(`laser-switched-yag-carbon-peel`)*
```
Editorial close-up of a woman's face covered in a thin layer of black carbon
peel mask just before laser activation. The aesthetician's gloved hand
holding a sleek laser handpiece hovering near the cheek. Patient's eyes closed
beneath protective goggles. Warm natural daylight in the cabin, cream beige
contrasted softly with the matte black carbon mask, soft shadow. Apothecary
aesthetic, calm precision. Documentary editorial photography, natural skin
visible at the jawline, fine film grain. 16:9 horizontal.
```

### 15 · HIFU · Lifting facial no quirúrgico *(`hifu`)*
```
Editorial close-up of a woman's jawline during a focused ultrasound treatment.
The aesthetician's gloved hand holding a sleek handpiece with cartridge
against the cheek along the jaw, a thin layer of transparent conductive gel
on the skin. Patient's eyes closed in calm. Warm natural daylight in a soft
cabin, cream beige and rose palette, soft shadow. A small amber apothecary
bottle and folded cotton towels blurred in the background. Apothecary cabin
aesthetic, premium calm precision. Documentary editorial photography, natural
skin texture, fine film grain. 16:9 horizontal.
```

---

## MICROPIGMENTACIÓN

### 16 · Microblading de cejas *(`microblading-cejas`)*
```
Editorial macro close-up of a female brow during microblading. The aesthetician's
gloved hand holding a fine microblade tool drawing a single hair-like stroke
along the brow. Faint pencil marking dots visible across the brow architecture.
A small ceramic dish of warm brown pigment blurred in the background. Warm
natural daylight, cream beige and warm amber palette, soft shadow. Apothecary
aesthetic, calm precision craft. Documentary editorial photography, natural
skin texture, fine film grain. 16:9 horizontal.
```

### 17 · Micropigmentación de labios *(`micropigmentacion-labios`)*
```
Editorial extreme macro close-up of female lips during a lip blush treatment.
The aesthetician's gloved hand holding a fine PMU device, the cartridge tip
gliding along the upper lip border. Lips with delicate dusty pink pigment in
soft saturation. Warm natural daylight, cream beige and warm rose palette,
soft shadow. Apothecary aesthetic, calm craft precision. Documentary editorial
photography, natural skin texture, fine film grain. 16:9 horizontal.
```

### 18 · Neutralización de labios *(`neutralizacion-labios`)*
```
Editorial close-up of female lips during a color correction session. The
aesthetician's gloved hand applying a soft peach-orange neutralizing pigment
with a fine PMU device. A small ceramic palette with peach and warm orange
pigments next to a tiny color wheel reference card, blurred in the background.
Warm natural daylight, cream beige and apricot palette, soft shadow. Apothecary
craft aesthetic, technical precision. Documentary editorial photography,
natural skin texture, fine film grain. 16:9 horizontal.
```

### 19 · Micropigmentación de eyeliner *(`micropigmentacion-eyeliner`)*
```
Editorial macro close-up of a closed female eye during an eyeliner micropigmentation
session. The aesthetician's gloved hand holding a fine PMU device running along
the upper lash line, gently between the lashes. A small protective eye shield
visible on the eyelid. Warm natural daylight, cream beige and soft rose palette,
soft shadow. Apothecary aesthetic, delicate calm precision. Documentary editorial
photography, natural skin texture, fine film grain. 16:9 horizontal.
```

---

## CORPORAL Y BIENESTAR

### 20 · Drenaje linfático manual *(`drenaje-linfatico`)*
```
Editorial close-up of an aesthetician's hands performing manual lymphatic
drainage on a woman's neck and clavicle area, with slow gentle pumping motion
suggested by the soft contact. Patient lying on a treatment bed, eyes closed
in deep relaxation. Warm natural daylight through linen curtains, cream beige
and rose palette, soft shadows on cream cotton sheets. A small amber apothecary
bottle and a stone tray blurred in the background. Apothecary spa aesthetic,
calm and intentional. Documentary editorial photography, natural skin, fine
film grain. 16:9 horizontal.
```

### 21 · Maderoterapia *(`maderoterapia`)*
```
Editorial close-up of an aesthetician's hands using a wooden Cuban roller
massage tool on a woman's thigh, the skin glistening with warm massage oil.
Other wooden tools — a cup, a fungus-shaped tool, a flat paddle — arranged on
a cream linen cloth nearby. Warm natural daylight in a cabin, cream beige and
warm clay palette, soft shadow. A small amber oil bottle on a stone tray,
blurred. Apothecary spa aesthetic, artisanal and grounded. Documentary
editorial photography, natural skin texture, fine film grain. 16:9 horizontal.
```

### 22 · Masaje reductor y remodelante *(`masaje-reductor-remodelante`)*
```
Editorial close-up of an aesthetician's hands performing a deep modeling
massage on a woman's flank, hands kneading the skin with firm yet calm
pressure. Skin glistening with warm massage oil. Patient lying on a treatment
bed. Warm natural daylight, cream beige and rose palette, soft shadow on
cream linen. A small amber apothecary bottle and a stone tray blurred in the
background. Apothecary spa aesthetic, controlled artisanal precision.
Documentary editorial photography, natural skin, fine film grain. 16:9
horizontal.
```

### 23 · Limpieza de espalda profunda *(`limpieza-espalda`)*
```
Editorial close-up of a woman lying face down on a treatment bed, upper back
and shoulder blades exposed. The aesthetician's gloved hand applying a
translucent cleansing gel along the shoulder with a soft brush. Warm natural
daylight through linen curtains, cream beige and rose palette, soft shadows on
cream cotton sheets. A small amber apothecary bottle and a stack of folded
cream towels blurred in the background. Apothecary spa aesthetic, calm and
clinical without being sterile. Documentary editorial photography, natural
skin texture, fine film grain. 16:9 horizontal.
```

---

## Cuando tengas las 23 imágenes

1. Guarda cada una con su nombre canónico:
   `assets/cursos/<course-id>.jpg`
   Ej. `assets/cursos/plasma-pen.jpg`, `assets/cursos/hifu.jpg`, etc.

2. Las paso por **sharp** para optimizarlas (de los 1-3 MB que salen
   de Firefly a unos 80-150 KB en `webp`/`jpg` progresivo manteniendo
   nitidez).

3. Actualizo el campo `cover:` de cada curso en
   `assets/js/courses-data.js` en una sola pasada.

Si una imagen no te convence, dame el id y la regenero ajustando el
prompt (mismo molde, cambiando el detalle que no encaje).
