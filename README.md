# AUREA — Escuela de estética avanzada

Web estática (HTML/CSS/JS puro) para la academia **AUREA**.
Sirve a la vez como vitrina pública de los cursos y como aula privada donde el alumnado accede a su materia (slides en HTML) y a sus tests.

> **Stack:** un solo `index.html` + scripts en `assets/js/`. Sin build, sin instalación. El backend de login/usuarios va por **Supabase** (plan gratuito).

---

## 🗺️ Estructura del proyecto

```
.
├── index.html
├── assets/
│   ├── js/
│   │   ├── supabase-config.js   ← URL + anon key de tu proyecto Supabase
│   │   ├── courses-data.js      ← "Base de datos" editable de los cursos
│   │   └── auth.js              ← Login/logout/signup (no tocar)
│   ├── cursos/
│   │   └── <id-del-curso>/
│   │       └── leccion-N/
│   │           └── index.html   ← Slides HTML de la lección
│   ├── le-petit.jpg
│   └── IMG-20260522-WA0032.jpg
├── docs/
│   ├── Temario_La_Piel.docx
│   └── parallax-prompt.md
└── README.md
```

---

## 🚀 Verla en local

Sin build, sin instalación.

```bash
python3 -m http.server 8000
```

Abre http://localhost:8000 y listo.

---

## 🧭 Estructura de navegación

### Docencia
- **Cursos** — Listado público con la portada y descripción de cada curso. Sin acceso al material; sirve para enseñar tu catálogo.
- **Acceso alumnado** — Login (Google + email). Una vez dentro, la alumna ve sus cursos. Cada curso tiene dos pestañas: **Materia** (las slides) y **Test**.

### Aparatología
- **Catálogo** — Tienda de aparatos.
- **Demos** y **Servicio técnico** — placeholders.

### Inicio
Una sola cifra de marca: "12 años formando profesionales". Resto del hero limpio.

---

## 🎓 Cómo gestionar el contenido (lo que te interesa)

### 1. Añadir un curso nuevo

1. Abre **`assets/js/courses-data.js`**.
2. Copia uno de los bloques existentes dentro de `window.AUREA_COURSES`.
3. Cambia `id` (sin espacios, todo en minúsculas), `title`, `description`, `cover`.
4. Define las `lessons` (puede ser un array vacío `[]` al principio).
5. Define el `test` con sus preguntas (campo `correct` es el **índice** de la respuesta correcta empezando en 0).
6. `git add . && git commit -m "Add curso X" && git push`. GitHub Pages despliega solo.

### 2. Subir las slides de una lección

Las slides son HTML embebido en un iframe a pantalla completa.

1. En **Claude Design Slides**, genera la lección y exporta como HTML (un solo archivo o una carpeta).
2. Crea la carpeta destino: `assets/cursos/<id-del-curso>/leccion-N/`.
3. Mete dentro el `index.html` (y los recursos que necesite: imágenes, css, js).
4. En `courses-data.js`, dentro del array `lessons`, añade:
   ```js
   {
     id: 'leccion-2',
     title: 'La epidermis',
     duration: '22 min',
     slides: 'assets/cursos/anatomia-fisiologia-cutanea/leccion-2/index.html'
   }
   ```
5. Commit + push.

> **Lección 1 de "Anatomía y fisiología cutánea"** está enlazada con valor especial `'leccion-integrada'`, que abre la lección visual con parallax 3D ya integrada en `index.html`. Es solo un caso particular para no perder esa demo; las lecciones nuevas usan rutas a HTML como las demás.

### 3. Editar los tests

Cada curso lleva su test en `courses-data.js`:

```js
test: {
  questions: [
    {
      q: '¿Cuántas capas tiene la piel?',
      options: ['2', '3', '4', '5'],
      correct: 1   // ← índice de la respuesta correcta (0-based)
    },
    ...
  ]
}
```

La corrección se hace en cliente: la alumna pulsa "Corregir test" y ve sus aciertos.

### 4. Actualizar un curso ya publicado

Solo edita el bloque correspondiente en `courses-data.js` o el HTML de la lección. Commit + push. La alumna ve los cambios al recargar.

---

## 🔐 Configurar Supabase (login real)

Mientras no esté configurado, "Acceso alumnado" muestra un aviso amarillo y no permite login. Para activarlo:

1. Crea cuenta gratis en https://supabase.com → **New project**.
2. Elige región **Europe (Frankfurt)** y espera ~1 min al provisioning.
3. **Settings → API** → copia:
   - **Project URL** (algo como `https://xxxx.supabase.co`)
   - **anon public key** (la pública, NO la `service_role`)
4. Abre `assets/js/supabase-config.js` y pégalos:
   ```js
   url: 'https://xxxx.supabase.co',
   anonKey: 'eyJhbGciOi...'
   ```
5. **Settings → Authentication → URL Configuration**:
   - **Site URL:** `https://TU_USUARIO.github.io/bea/`
   - **Redirect URLs:** añade también `http://localhost:8000` para pruebas locales.
6. **Activar Google** (opcional pero recomendado):
   - **Authentication → Providers → Google** → enable.
   - Necesitas un **OAuth Client ID** desde Google Cloud Console (`console.cloud.google.com` → APIs & Services → Credentials → OAuth client). Supabase te explica los pasos exactos.
7. Commit + push y recarga la web. El aviso amarillo desaparece y el login funciona.

> Plan gratuito: 50.000 usuarios/mes, 500 MB de DB, 1 GB de storage, 5 GB de tráfico/mes. Suficiente de sobra para arrancar.

### Dar de alta a una alumna

Tres opciones:
- **Auto-alta**: ella se registra desde la propia web con su email + contraseña. Llega un correo de confirmación.
- **Google**: pulsa "Continuar con Google" y entra en un clic.
- **Manual desde Supabase**: en el panel → **Authentication → Users → Invite user**. Le llega un email con enlace de acceso.

### Controlar qué alumna ve qué curso (Google Sheets)

La gestión de matrículas vive en una **hoja de Google compartida**, no en el código. Así la persona que gestiona alumnas no necesita tocar git ni saber programar — solo añadir o quitar filas en un spreadsheet.

**Estructura de la hoja:**

| email             | curso                          |
|-------------------|--------------------------------|
| maria@gmail.com   | anatomia-fisiologia-cutanea    |
| lucia@outlook.es  | anatomia-fisiologia-cutanea    |
| lucia@outlook.es  | peeling-quimico                |

- Cabecera en la fila 1: literalmente `email` y `curso`.
- **Una fila = una alumna con acceso a un curso**. Si una alumna tiene 3 cursos, hace 3 filas.
- El valor de `curso` es el `id` que aparece en `assets/js/courses-data.js`.

**Compartido como:** "Cualquier persona con el enlace · Lector". No hace falta "Publicar en la web".

**Flujo diario:**
1. Una alumna te paga un curso.
2. Abres la hoja, escribes su email + el id del curso.
3. La alumna refresca el aula y ya lo ve. (Hay un caché de 30s, así que puede tardar medio minuto.)

**Dar de baja:** borras la fila → la alumna pierde acceso al instante (al expirar el caché).

**Dónde está la URL de la hoja en el código:** `assets/js/enrollments.js`, constante `SHEET_ID`. Si cambias de hoja, solo hay que sustituir ese ID.

> **Nota de seguridad:** la hoja es accesible para cualquiera que conozca la URL, pero el ID tiene 44 caracteres aleatorios — nadie la encuentra por casualidad. Suficiente para una academia. Si en el futuro quieres seguridad fuerte (impedir descargar el contenido aunque conozcan la URL del HTML), migramos a una tabla `enrollments` en Supabase con Row Level Security.

---

## 🛠️ Sistema de diseño

Tokens CSS en `:root` dentro de `<style>`:

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#F2ECE3` | Fondo crema |
| `--bg2` | `#E6DDCC` | Crema profundo |
| `--ink` | `#241D17` | Texto principal "espresso" |
| `--accent` | `#A86B4E` | Acento "clay" |
| `--accent-dark` | `#7E4C36` | Hover del acento |
| `--accent-soft` | `#ECDDD0` | Fondos suaves de acento |
| `--serif` | `'Instrument Serif'` | Titulares editoriales |
| `--sans` | `'Manrope'` | Texto y UI |

---

## ✅ Checklist al añadir un curso

- [ ] `id` único, en kebab-case (`peeling-quimico`, no `Peeling Químico`).
- [ ] Imagen de portada en `assets/` y rutas relativas correctas.
- [ ] Cada lección tiene su HTML subido a `assets/cursos/<id>/leccion-N/`.
- [ ] El test tiene al menos 3 preguntas y todas con `correct` válido.
- [ ] Probado en local con `python3 -m http.server 8000` antes de pushear.

---

## 📄 Licencia

Proyecto privado para la academia AUREA. Todos los derechos reservados.
