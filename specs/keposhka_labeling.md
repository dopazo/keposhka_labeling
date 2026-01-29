# Keposhka Labeler - Especificación Técnica

**Proyecto:** Herramienta de Etiquetado para Detección de Objetos (Keposhka → Español)
**Stack:** FastAPI (Python) + React (Vite) + React-Konva + Shadcn/UI
**Estado:** En Desarrollo (Actualizado con Entrevista)
**Fecha:** 28 de Enero, 2026

---

## 1. Objetivo

Desarrollar una aplicación web local (Single Page Application) de alto rendimiento para etiquetar imágenes del lenguaje ficticio "Keposhka". La herramienta optimizará el flujo de trabajo permitiendo al usuario dibujar múltiples "bounding boxes" y asignar sus etiquetas escribiendo la traducción del texto, utilizando un algoritmo de ordenamiento espacial automático con soporte para dígrafos/trígrafos.

---

## 2. Alfabeto Keposhka

Keposhka utiliza caracteres del alfabeto inglés simple, números, y letras compuestas (dígrafos):

**Caracteres válidos (ordenados alfabéticamente):**
```
0 1 2 3 4 5 6 7 8 9
A a B b C c CH ch D d E e F f G g GH gh H h I i J j K k L l M m N n O o P p Q q R r S s SH sh T t TH th U u V v W w X x Y y Z z
```

**Características importantes:**
- **Números (0-9):** Son parte del alfabeto. Aunque no necesitan "traducción", el usuario DEBE marcarlos e indicar qué número es
- **Case-sensitive:** Las mayúsculas y minúsculas son diferentes (A ≠ a)
- **Dígrafos:** Ch, ch, Gh, gh, Sh, sh, Th, th (cada uno representa UN solo carácter visual en Keposhka)
- **Sin puntuación:** No se deben etiquetar símbolos que no pertenecen al alfabeto Keposhka (!, ?, ., @, ñ, etc.)

---

## 3. Arquitectura del Sistema

### 3.1 Backend (Python / FastAPI)

- **Framework:** FastAPI + Uvicorn
- **Gestor de Paquetes:** uv
- **Responsabilidades:**
  - API REST para listar imágenes del directorio local (`GET /api/images`)
  - Servir los archivos de imagen estáticos desde el disco local
  - Recibir el payload JSON y guardar:
    - Archivo `.txt` en formato YOLO puro (coordenadas normalizadas)
    - Archivo `.json` con metadata (texto traducido, charCount por caja, etiquetas)
  - Validar la integridad de los datos con Pydantic

### 3.2 Frontend (React + Vite)

- **Build Tool:** Vite (TypeScript)
- **UI Framework:** Tailwind CSS + Shadcn/UI (para inputs, botones y layout)
- **Librería Gráfica:** react-konva (para el Canvas interactivo)
- **State Management:** zustand (Store global para cajas, imagen actual y texto)
- **Validación:** zod

---

## 4. Interfaces de Datos (Types)

### 4.1 Frontend (TypeScript)

```typescript
export interface BoundingBox {
  id: string;          // UUID único para tracking en React (key)
  x: number;           // Coordenada X en píxeles
  y: number;           // Coordenada Y en píxeles
  width: number;       // Ancho en píxeles
  height: number;      // Alto en píxeles
  charCount: number;   // Número de caracteres que consume (1 para letra simple, 2 para dígrafo, etc.)
  label?: string;      // Etiqueta asignada (ej: "A", "Ch", "5") calculada automáticamente
  isNew?: boolean;     // Flag para resaltar cajas recién creadas
}

export interface ImageMeta {
  filename: string;
  width: number;
  height: number;
  status: 'pending' | 'done'; // Estado para mostrar en la lista lateral
}

export interface AnnotationMetadata {
  filename: string;
  translatedText: string;        // Texto completo traducido (multilinea)
  boxes: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    charCount: number;
    label: string;
  }>;
}
```

### 4.2 API Contract (JSON)

**Payload para:** `POST /api/save`

```json
{
  "filename": "oracion_001.jpg",
  "image_width": 1920,
  "image_height": 1080,
  "translated_text": "Hola 123",
  "boxes": [
    {
      "id": "uuid-1",
      "label": "H",
      "char_count": 1,
      "x": 100,
      "y": 200,
      "w": 50,
      "h": 60
    },
    {
      "id": "uuid-2",
      "label": "o",
      "char_count": 1,
      "x": 160,
      "y": 200,
      "w": 45,
      "h": 60
    }
  ]
}
```

**Archivos generados:**
1. `oracion_001.txt` - Formato YOLO puro: `clase x_norm y_norm w_norm h_norm`
2. `oracion_001.json` - Metadata completa (AnnotationMetadata)

---

## 5. Estructura del Proyecto

```
/keposhka-labeler
├── /backend
│   ├── main.py             # FastAPI App - Endpoints
│   ├── schemas.py          # Modelos Pydantic: Box, Annotation
│   ├── utils.py            # Lógica de guardado YOLO + JSON
│   └── /data
│       ├── /images         # Imágenes a anotar
│       ├── /annotations    # Archivos .txt (YOLO) y .json generados
│       └── /reference      # Imagen del alfabeto Keposhka (pendiente)
│
├── /frontend
│   ├── vite.config.ts      # Configuración de Proxy: /api -> localhost:8000
│   ├── tsconfig.json       # Configuración de Alias: @/*
│   ├── package.json
│   └── src
│       ├── components
│       │   ├── ui/                      # Componentes Shadcn: Button, Input, Card...
│       │   ├── canvas/                  # Lógica Konva
│       │   │   ├── StageBoard.tsx       # El Canvas principal
│       │   │   ├── BoxTransformer.tsx   # Manejador de redimensionado
│       │   │   └── UrlImage.tsx         # Carga de imagen de fondo
│       │   ├── EditorPanel.tsx          # Sidebar izquierdo: Input multilinea + Lista de archivos
│       │   ├── ReferencePanel.tsx       # Panel derecho: Imagen del alfabeto Keposhka
│       │   └── BoxContextMenu.tsx       # Menú contextual para marcar dígrafos
│       ├── store
│       │   └── useStore.ts              # Zustand Actions: addBox, setInputText, updateCharCount...
│       ├── lib
│       │   ├── sorter.ts                # Algoritmo de ordenamiento espacial - Core Logic
│       │   └── validator.ts             # Validación de caracteres del alfabeto Keposhka
│       └── App.tsx
```

---

## 6. Layout de la Interfaz

```
┌─────────────────────────────────────────────────────────────────┐
│  [Keposhka Labeler]                              [Búsqueda]     │
├─────────┬───────────────────────────────────────────┬───────────┤
│         │                                           │           │
│  Lista  │         Canvas (React-Konva)              │  Panel de │
│   de    │                                           │ Referencia│
│ Archivos│    [Imagen de fondo con bounding boxes]  │           │
│         │                                           │  [Imagen  │
│ [Filter]│    Cajas con etiquetas:                  │ alfabeto  │
│ ○ All   │    - Verde: asignadas correctamente      │ Keposhka] │
│ ○ Done  │    - Rojo punteado: sin asignar          │           │
│ ○ Pend  │                                           │ (Espacio  │
│         │                                           │preparado) │
│ img_1   │                                           │           │
│ img_2   │                                           │           │
│ ...     │                                           │           │
│         ├───────────────────────────────────────────┤           │
│         │  [Textarea multilinea]                    │           │
│[Guardar]│  Escriba la traducción...                 │           │
│[Pendien]│  (Enter: nueva línea | Shift+Enter: Save) │           │
│         │  Caracteres inválidos: resaltados en rojo │           │
└─────────┴───────────────────────────────────────────┴───────────┘
```

---

## 7. Lógica de Negocio (Core)

### 7.1 Algoritmo de Auto-Ordenamiento (sorter.ts)

Este módulo recibe las cajas desordenadas, el texto traducido (multilinea), y asigna las etiquetas.

**Proceso:**

1. **Pre-procesamiento del texto:**
   - Separar el texto en líneas (splits por `\n`)
   - Validar caracteres (marcar inválidos en rojo)
   - Identificar espacios (se saltarán en la asignación)

2. **Ordenamiento Vertical (Y):**
   - Agrupa las cajas en "renglones" si su diferencia en Y es menor a un umbral
   - **Umbral dinámico:** ~30% de la altura promedio de todas las cajas
   - Cada renglón se asigna a una línea del texto

3. **Ordenamiento Horizontal (X):**
   - Dentro de cada renglón, ordena las cajas de izquierda a derecha

4. **Asignación con dígrafos:**
   - Recorre las cajas en orden
   - Para cada caja, consume `charCount` caracteres del texto (saltando espacios)
   - Si la caja tiene `charCount=2` y el texto tiene "Ch", asigna "Ch" completo
   - Si la caja tiene `charCount=1`, asigna un solo carácter

5. **Validación y Feedback:**
   - Cuenta caracteres totales del texto (excluyendo espacios)
   - Cuenta caracteres consumidos por las cajas (suma de todos los `charCount`)
   - Si no coinciden:
     - Resalta caracteres no asignados en el textarea (fondo rojo)
     - Marca cajas sin asignar con borde punteado rojo
     - Deshabilita botón "Guardar"
   - Si coinciden:
     - Marca todas las cajas con borde verde
     - Habilita botón "Guardar"

### 7.2 Validación y Mapeo de Caracteres (validator.ts)

```typescript
// Alfabeto Keposhka ordenado (70 caracteres, índice = clase YOLO)
const KEPOSHKA_ALPHABET = [
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',  // 0-9
  'A', 'a', 'B', 'b', 'C', 'c', 'CH', 'ch',          // 10-17
  'D', 'd', 'E', 'e', 'F', 'f', 'G', 'g', 'GH', 'gh', // 18-27
  'H', 'h', 'I', 'i', 'J', 'j', 'K', 'k', 'L', 'l',  // 28-37
  'M', 'm', 'N', 'n', 'O', 'o', 'P', 'p', 'Q', 'q',  // 38-47
  'R', 'r', 'S', 's', 'SH', 'sh', 'T', 't', 'TH', 'th', // 48-57
  'U', 'u', 'V', 'v', 'W', 'w', 'X', 'x', 'Y', 'y',  // 58-67
  'Z', 'z'                                            // 68-69
];

const DIGRAPHS = ['CH', 'ch', 'GH', 'gh', 'SH', 'sh', 'TH', 'th'];

// Convierte etiqueta a clase YOLO
function labelToClassId(label: string): number {
  return KEPOSHKA_ALPHABET.indexOf(label);
}

// Convierte clase YOLO a etiqueta
function classIdToLabel(classId: number): string {
  return KEPOSHKA_ALPHABET[classId];
}

// Valida en tiempo real mientras el usuario escribe
function validateInput(text: string): {
  isValid: boolean;
  invalidChars: Array<{char: string, index: number}>;
}
```

### 7.3 Interacción en Canvas (StageBoard.tsx)

**Creación de cajas:**
- `onMouseDown` en el fondo → inicia dibujo
- `onMouseMove` → actualiza tamaño
- `onMouseUp` → finaliza caja (con `charCount=1` por defecto)

**Edición:**
- Al hacer clic en una caja existente, se activa el Transformer de Konva para permitir redimensionar
- **Clic derecho en una caja** → Abre menú contextual:
  ```
  ┌─────────────────┐
  │ 1 carácter      │
  │ 2 caracteres ✓  │
  │ 3 caracteres    │
  └─────────────────┘
  ```
  - Permite marcar si la caja es dígrafo/trígrafo
  - El usuario DEBE marcar los dígrafos ANTES de escribir el texto

**Eliminación:**
- Tecla `Delete` o `Backspace` con caja seleccionada → elimina la caja
- **Re-asignación automática inmediata:** Las etiquetas se recalculan instantáneamente

**Reactividad:**
- Al cambiar el tamaño, posición de una caja, o el texto, se dispara el re-ordenamiento automáticamente
- Feedback visual en tiempo real (verde/rojo)

---

## 8. Workflow del Usuario

### 8.1 Flujo Típico (Flujo Libre Intercalado)

El usuario puede trabajar en el orden que prefiera:

1. **Cargar imagen** (desde lista lateral o navegación por teclado)
2. **Dibujar cajas** alrededor de los caracteres visibles
3. **Marcar dígrafos** (clic derecho → "2 caracteres") si es necesario
4. **Escribir texto traducido** en el textarea multilinea:
   - Ver feedback en tiempo real (cajas se iluminan en verde/rojo)
   - Enter para nueva línea (múltiples oraciones)
   - Caracteres inválidos se resaltan en rojo automáticamente
5. **Ajustar si es necesario:**
   - Agregar/eliminar cajas
   - Mover/redimensionar cajas
   - Corregir texto
   - Las asignaciones se recalculan automáticamente
6. **Confirmar:**
   - **Shift+Enter** o botón "Completar" → Guarda y marca como 'done', salta a siguiente imagen pendiente
   - Botón "Dejar Pendiente" → Salta a siguiente imagen sin marcar la actual como 'done'

### 8.2 Re-anotación (Corrección)

Si el usuario abre una imagen que ya tiene anotaciones previas:

1. El sistema carga el archivo `.json`
2. Se recrean las cajas en el canvas con sus posiciones y `charCount` originales
3. Se reconstruye el texto completo en el textarea
4. El usuario puede editar libremente y volver a guardar

---

## 9. Navegación

### 9.1 Lista de Imágenes (Sidebar Izquierdo)

**Funcionalidades:**
- Muestra todas las imágenes del directorio `/data/images`
- Indicador visual de estado:
  - ✓ Verde: 'done' (existe archivo .json con anotaciones completas)
  - ○ Gris: 'pending'
- **Filtrado por estado:**
  - "Todas" / "Completadas" / "Pendientes"
- **Búsqueda por nombre:**
  - Input de búsqueda para saltar rápidamente a una imagen específica

### 9.2 Atajos de Teclado

- **Flechas ↑/↓:** Navegar entre imágenes (anterior/siguiente)
- **Shift+Enter:** Guardar y siguiente (marca como 'done')
- **Delete/Backspace:** Eliminar caja seleccionada
- **Esc:** Deseleccionar caja

---

## 10. Panel de Referencia (Sidebar Derecho)

**Propósito:** Facilitar la traducción mostrando el alfabeto completo de Keposhka

**Implementación:**
- Espacio reservado en el layout (panel derecho)
- Componente `ReferencePanel.tsx` con:
  - Placeholder/mensaje: "Imagen de referencia pendiente"
  - Código preparado para cargar imagen desde `/data/reference/alphabet.png` cuando esté disponible
- La imagen mostrará todos los caracteres de Keposhka con su traducción

---

## 11. Persistencia

### 11.1 Mapeo de Clases YOLO

El sistema utiliza **70 clases** (0-69) basadas en el orden del alfabeto Keposhka:

| Clases | Caracteres |
|--------|------------|
| 0-9    | 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 |
| 10-11  | A, a |
| 12-13  | B, b |
| 14-15  | C, c |
| 16-17  | CH, ch |
| 18-19  | D, d |
| 20-21  | E, e |
| 22-23  | F, f |
| 24-25  | G, g |
| 26-27  | GH, gh |
| 28-29  | H, h |
| 30-31  | I, i |
| 32-33  | J, j |
| 34-35  | K, k |
| 36-37  | L, l |
| 38-39  | M, m |
| 40-41  | N, n |
| 42-43  | O, o |
| 44-45  | P, p |
| 46-47  | Q, q |
| 48-49  | R, r |
| 50-51  | S, s |
| 52-53  | SH, sh |
| 54-55  | T, t |
| 56-57  | TH, th |
| 58-59  | U, u |
| 60-61  | V, v |
| 62-63  | W, w |
| 64-65  | X, x |
| 66-67  | Y, y |
| 68-69  | Z, z |

**Archivo `classes.txt`:** Se genera automáticamente al iniciar la aplicación en `/data/annotations/classes.txt`:
```
0
1
2
...
A
a
B
b
...
Z
z
```

### 11.2 Formato de Guardado

Para cada imagen anotada, se generan DOS archivos:

**1. Archivo YOLO (.txt) - Para entrenamiento del modelo:**
```
10 0.5234 0.3125 0.0260 0.0556
42 0.5703 0.3125 0.0234 0.0556
36 0.6172 0.3125 0.0234 0.0556
11 0.6641 0.3125 0.0234 0.0556
...
```
- Formato: `clase x_center_norm y_center_norm width_norm height_norm`
- Coordenadas normalizadas (0-1)
- La clase corresponde al índice del carácter en el alfabeto Keposhka (0-69)
- Ejemplo: "Hola" → clases 28 (H), 42 (o), 36 (l), 11 (a)

**2. Archivo Metadata (.json) - Para re-edición:**
```json
{
  "filename": "oracion_001.jpg",
  "translatedText": "Hola 123\nMundo",
  "imageWidth": 1920,
  "imageHeight": 1080,
  "boxes": [
    {
      "id": "uuid-1",
      "x": 100,
      "y": 200,
      "width": 50,
      "height": 60,
      "charCount": 1,
      "label": "H"
    },
    {
      "id": "uuid-2",
      "x": 160,
      "y": 200,
      "width": 45,
      "height": 60,
      "charCount": 2,
      "label": "Ch"
    }
  ]
}
```

### 11.3 Estado de las Imágenes

Una imagen se marca como **'done'** cuando:
- El usuario presiona **Shift+Enter** (Guardar y siguiente), o
- El usuario hace clic en el botón **"Completar"**

Esto genera ambos archivos (.txt y .json) y actualiza el estado visual en la lista.

---

## 12. Configuración Clave

### 12.1 Vite Proxy (vite.config.ts)

Para evitar problemas de CORS durante el desarrollo:

```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  }
})
```

---

## 13. Decisiones de Diseño (UX/UI)

### 13.1 Espacios en el Texto

- Los espacios en el texto traducido **NO** se asignan a cajas
- Se saltan automáticamente durante la asignación
- Las cajas siempre representan caracteres visuales de Keposhka

### 13.2 Feedback Visual en Tiempo Real

**Cajas en el Canvas:**
- 🟢 **Borde verde continuo:** Caja asignada correctamente
- 🔴 **Borde rojo punteado:** Caja sin asignar (falta texto o hay error)

**Textarea:**
- 🔴 **Fondo rojo en caracteres:** Caracteres inválidos (no pertenecen al alfabeto Keposhka)
- 🟡 **Highlight amarillo:** Caracteres no asignados (sobran caracteres para la cantidad de cajas)

**Botón Guardar:**
- **Deshabilitado (gris):** Si hay caracteres inválidos O desbalance entre texto y cajas
- **Habilitado (verde):** Solo cuando todo está balanceado y válido

### 13.3 Sin Undo/Redo

- **Decisión:** No implementar funcionalidad de deshacer/rehacer en la versión inicial
- **Razón:** Menor complejidad, el usuario puede ajustar manualmente
- **Mitigación:** La asignación automática y feedback visual reducen la necesidad de undo

### 13.4 Zoom y Pan

- **Decisión:** Solo ajustar imagen a pantalla (fit to viewport)
- **Razón:** Suficiente para la mayoría de casos, menor complejidad inicial
- **Futuro:** Se puede agregar zoom manual si resulta necesario

---

## 14. Fases de Desarrollo

### Fase 1: Setup & Estructura Base
- Inicializar estructura de carpetas (Backend/Frontend)
- Configurar uv (backend) y npm (frontend)
- Configurar Vite Proxy y Tailwind/Shadcn
- Crear endpoint backend `GET /api/images` que lista archivos del directorio
- Implementar layout de 3 columnas (lista izq, canvas centro, referencia der)
- Implementar panel de referencia con placeholder ("Imagen pendiente")
- Crear store de Zustand con estado inicial (boxes, currentImage, inputText)

### Fase 2: Canvas Interactivo
- Implementar carga de imagen en Konva (UrlImage)
- Implementar auto-fit de imagen al viewport (escalar para que quepa)
- Implementar dibujo de rectángulos (mouseDown → mouseMove → mouseUp)
- Implementar selección de cajas (clic para seleccionar)
- Implementar BoxTransformer para redimensionar/mover cajas
- Implementar eliminación de cajas (Delete/Backspace)
- Implementar deselección (Esc)
- Feedback visual básico: borde de caja seleccionada

### Fase 3: Algoritmo de Ordenamiento y Validación
- Desarrollar `validator.ts`:
  - Constante `KEPOSHKA_ALPHABET` (70 caracteres)
  - Funciones `labelToClassId()` y `classIdToLabel()`
  - Función `validateInput()` para detectar caracteres inválidos
- Desarrollar `sorter.ts`:
  - Agrupar cajas en renglones (umbral dinámico: 30% altura promedio)
  - Ordenar izquierda→derecha dentro de cada renglón
  - Saltar espacios en el texto
  - Consumir `charCount` caracteres por caja
- Conectar textarea multilinea con store de Zustand
- Re-calcular asignaciones en cada cambio (texto, cajas, posiciones)

### Fase 4: UI de Etiquetado
- Renderizar etiquetas de texto debajo de cada caja en el canvas
- Implementar menú contextual (clic derecho) para marcar dígrafos (1/2/3 chars)
- Implementar feedback visual en tiempo real:
  - Cajas asignadas: borde verde continuo
  - Cajas sin asignar: borde rojo punteado
  - Caracteres inválidos en textarea: fondo rojo
  - Caracteres no asignados (sobran): fondo amarillo
- Deshabilitar botón "Guardar" si hay desbalance o errores

### Fase 5: Navegación y Lista de Imágenes
- Implementar lista de imágenes en sidebar izquierdo
- Mostrar estado visual (done ✓ verde / pending ○ gris)
- Implementar filtrado por estado (Todas / Completadas / Pendientes)
- Implementar búsqueda por nombre de archivo
- Implementar navegación con flechas del teclado (↑/↓)
- Cargar imagen seleccionada en el canvas

### Fase 6: Persistencia (YOLO + JSON)
- Generar `classes.txt` automáticamente al iniciar (70 clases)
- Crear endpoint `POST /api/save`:
  - Convertir píxeles → coordenadas normalizadas (0-1)
  - Guardar archivo `.txt` en formato YOLO (clase x y w h)
  - Guardar archivo `.json` con metadata completa
- Crear endpoint `GET /api/annotations/{filename}`:
  - Retornar metadata JSON si existe
  - Retornar null/404 si no hay anotación previa
- Implementar carga de anotaciones previas al seleccionar imagen
- Actualizar estado de imagen a 'done' al guardar exitosamente

### Fase 7: Flujo Completo y Polish
- Implementar botón "Completar" (guarda + marca done + siguiente pendiente)
- Implementar botón "Dejar Pendiente" (siguiente sin marcar)
- Implementar atajo Shift+Enter (equivalente a "Completar")
- Validación exhaustiva con Zod (frontend) y Pydantic (backend)
- Manejo de errores: toast/notificaciones para éxito/error
- Estados de carga (spinners) durante operaciones async
- Optimización de performance (memo, useMemo, useCallback donde sea necesario)

---

## 15. Criterios de Aceptación

- [ ] La aplicación carga instantáneamente (Vite)
- [ ] Dibujo de cajas fluido, sin lag
- [ ] El texto ingresado se distribuye correctamente en las cajas según lectura occidental (Izquierda-Derecha, Arriba-Abajo)
- [ ] Los dígrafos (Ch, ch, Gh, gh, Sh, sh, Th, th) se asignan correctamente a cajas marcadas con `charCount=2`
- [ ] Los espacios en el texto se saltan automáticamente sin asignar a cajas
- [ ] Caracteres inválidos se resaltan en rojo en el textarea
- [ ] Feedback visual en tiempo real: cajas verdes (OK) / rojas (error)
- [ ] El botón "Guardar" solo se habilita cuando todo está balanceado
- [ ] Los archivos .txt generados son compatibles con YOLOv8 (Clase X Y W H norm)
- [ ] Los archivos .json contienen toda la metadata para re-edición
- [ ] La re-apertura de imágenes anotadas carga correctamente las cajas y el texto
- [ ] Navegación fluida entre imágenes (flechas, búsqueda, filtrado)
- [ ] Shift+Enter guarda y salta a la siguiente imagen pendiente
- [ ] El panel de referencia tiene espacio reservado para la imagen del alfabeto
- [ ] La interfaz utiliza componentes de Shadcn/UI para mantener coherencia visual
- [ ] Soporte para múltiples líneas de texto (Enter para nueva línea)
- [ ] Los números (0-9) se etiquetan correctamente como cualquier otro carácter
