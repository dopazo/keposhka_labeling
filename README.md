# Keposhka Labeler

Herramienta de etiquetado para imágenes del lenguaje ficticio "Keposhka". Dibuja bounding boxes alrededor de caracteres y escribe la traducción - la app asigna automáticamente las letras a las cajas usando ordenamiento espacial inteligente (izquierda-derecha, arriba-abajo).

## Características

**Etiquetado Inteligente**
- Dibuja bounding boxes con arrastre del mouse o click rápido para repetir el último tamaño
- Asignación automática de caracteres usando algoritmo de ordenamiento espacial
- Validación en tiempo real con feedback visual (verde = asignado, rojo = sin asignar)
- Soporte para dígrafos (CH, GH, SH, TH) mediante menú contextual

**Canvas Interactivo**
- Zoom y pan con rueda del mouse o atajos de teclado (+/-, Ctrl+Arrastrar)
- Redimensionar y mover cajas con handles de transformación
- Toggle de visibilidad de cajas (tecla V) para ver la imagen original
- Indicador de click rápido muestra las dimensiones de la última caja en rojo

**Gestión de Flujo de Trabajo**
- Filtrar imágenes por estado (todas/pendientes/completadas)
- Buscar imágenes por nombre de archivo
- Navegación con atajos de teclado
- Avance automático a la siguiente imagen pendiente al guardar
- Modo borrador para anotaciones en progreso

**Alfabeto Keposhka**
- Panel de referencia interactivo con 70 caracteres válidos (0-9, A-Z, dígrafos case-sensitive)
- Inserción de caracteres con click
- Validación completa del alfabeto

## Stack Tecnológico

### Backend
- **FastAPI** - Framework web moderno de Python
- **Uvicorn** - Servidor ASGI
- **Pillow** - Procesamiento de imágenes
- **uv** - Gestor de paquetes Python

### Frontend
- **React 19** + **TypeScript** - Framework UI
- **Vite 7** - Herramienta de build y servidor de desarrollo
- **Tailwind CSS 3** - Estilos utility-first
- **react-konva** - Canvas para dibujo y manipulación
- **Zustand** - Gestión de estado
- **Zod** - Validación de esquemas
- **Bun** - Gestor de paquetes JavaScript

## Estructura del Proyecto

```
keposhka_labeling/
├── backend/
│   ├── main.py              # Aplicación FastAPI
│   ├── schemas.py           # Modelos Pydantic
│   ├── utils.py             # Utilidades de exportación YOLO
│   ├── pyproject.toml       # Dependencias Python
│   └── data/
│       ├── images/          # Imágenes fuente a anotar
│       ├── annotations/     # Archivos .txt (YOLO) y .json generados
│       └── reference/       # Referencia del alfabeto Keposhka
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── canvas/
    │   │   │   ├── StageBoard.tsx      # Componente principal del canvas
    │   │   │   ├── BoxTransformer.tsx  # Redimensionamiento/transformación
    │   │   │   └── UrlImage.tsx        # Cargador de imágenes
    │   │   ├── EditorPanel.tsx         # Panel lateral con input de texto
    │   │   ├── ReferencePanel.tsx      # Panel derecho con alfabeto
    │   │   └── BoxContextMenu.tsx      # Menú contextual para dígrafos
    │   ├── lib/
    │   │   ├── sorter.ts               # Algoritmo de ordenamiento espacial
    │   │   ├── validator.ts            # Validador del alfabeto Keposhka
    │   │   ├── schemas.ts              # Esquemas de validación Zod
    │   │   └── types.ts                # Definiciones de tipos TypeScript
    │   └── store/
    │       └── useStore.ts             # Gestión de estado Zustand
    ├── package.json
    └── vite.config.ts                  # Config de Vite con proxy API
```

## Instalación

### Prerrequisitos
- Python 3.13+
- Node.js 18+ (para Bun)
- [uv](https://github.com/astral-sh/uv) - Gestor de paquetes Python
- [Bun](https://bun.sh) - Gestor de paquetes JavaScript

### Backend

```bash
cd backend

# Instalar dependencias con uv (primera vez)
uv sync

# Ejecutar servidor de desarrollo
uv run uvicorn main:app --reload
```

El backend estará disponible en `http://127.0.0.1:8000`

### Frontend

```bash
cd frontend

# Instalar dependencias con Bun (primera vez)
bun install

# Ejecutar servidor de desarrollo
bun run dev
```

El frontend estará disponible en `http://localhost:5173`

### Build para Producción

```bash
cd frontend

# Build optimizado para producción
bun run build

# Preview del build de producción
bun run preview
```

## Guía de Uso

### Flujo Básico

1. **Agregar Imágenes**: Coloca tus imágenes Keposhka en `backend/data/images/`
2. **Iniciar Servidores**: Ejecuta ambos servidores (backend y frontend)
3. **Abrir App**: Navega a `http://localhost:5173`
4. **Seleccionar Imagen**: Click en una imagen de la lista del panel izquierdo
5. **Dibujar Cajas**: Click y arrastra en el canvas para crear bounding boxes
6. **Escribir Traducción**: Ingresa el texto traducido en el textarea (panel izquierdo)
7. **Asignación Automática**: Las etiquetas se asignan automáticamente en orden de lectura
8. **Guardar**: Presiona "Completar" o `Shift+Enter` para guardar y avanzar

### Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `Arrastrar` | Dibujar nueva bounding box |
| `Click` | Crear caja con las últimas dimensiones (indicador rojo) |
| `Delete` / `Backspace` | Eliminar caja seleccionada |
| `Esc` | Deseleccionar caja |
| `Click Derecho` | Abrir menú de dígrafos (establecer charCount) |
| `Shift+Enter` | Guardar y avanzar a siguiente imagen |
| `Ctrl+Arrastrar` | Desplazar canvas |
| `Rueda del Mouse` | Zoom in/out |
| `+` / `-` | Zoom in/out |
| `0` | Resetear zoom a 100% |
| `V` | Toggle visibilidad de cajas |
| `Flechas` | Navegar entre imágenes |

### Trabajando con Dígrafos

Algunos caracteres Keposhka son dígrafos (2 caracteres por caja):
- Click derecho en una caja para abrir el menú contextual
- Selecciona la cantidad de caracteres (1, 2 o 3)
- Aparecerá una insignia roja mostrando la cantidad
- El ordenador consumirá esa cantidad de caracteres para la caja

Dígrafos válidos: `CH`, `ch`, `GH`, `gh`, `SH`, `sh`, `TH`, `th`

### Estados de Imagen

- **Pendiente** (gris) - Aún no completada o guardada como borrador
- **Completada** (verde) - Completamente anotada y guardada

Filtra imágenes usando el dropdown de estado en el panel izquierdo.

## API Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/images` | GET | Lista todas las imágenes con estado y dimensiones |
| `/api/annotations/{filename}` | GET | Obtiene anotación existente de una imagen |
| `/api/save` | POST | Guarda anotación (YOLO + JSON) |
| `/health` | GET | Health check |
| `/images/{filename}` | GET | Sirve archivos de imagen estáticos |

## Formato de Salida

Para cada imagen anotada, se generan dos archivos en `backend/data/annotations/`:

### 1. Formato YOLO (`.txt`)
Usado para entrenamiento de modelos. Solo se genera cuando el estado es "done".

```
class_id x_center y_center width height
```

Todas las coordenadas están normalizadas (rango 0-1).

Ejemplo:
```
10 0.5234 0.3125 0.0260 0.0556
42 0.5703 0.3125 0.0234 0.0556
```

### 2. Metadata JSON (`.json`)
Usado para re-edición. Siempre se genera (borradores y completados).

```json
{
  "filename": "image001.jpg",
  "translatedText": "Hola mundo",
  "imageWidth": 1920,
  "imageHeight": 1080,
  "status": "done",
  "boxes": [
    {
      "id": "uuid-here",
      "x": 100,
      "y": 50,
      "width": 30,
      "height": 40,
      "charCount": 1,
      "label": "H"
    }
  ]
}
```

### 3. Archivo de Clases (`classes.txt`)
Auto-generado al iniciar el backend con los 70 caracteres Keposhka.

## Algoritmo de Ordenamiento

El algoritmo de ordenamiento espacial (`sorter.ts`) funciona así:

1. **Detección de Filas**: Agrupa cajas en filas horizontales usando umbral dinámico (~30% de altura promedio)
2. **Ordenamiento Izquierda-Derecha**: Ordena cajas dentro de cada fila por coordenada X
3. **Asignación de Caracteres**: Consume caracteres del texto traducido (saltando espacios)
4. **Manejo de Dígrafos**: Respeta la propiedad `charCount` (consume 2-3 chars para dígrafos)
5. **Validación**: Asegura que el total de caracteres coincida con la capacidad total de cajas

Feedback visual:
- **Borde verde**: Caja tiene etiqueta asignada
- **Borde rojo punteado**: Caja sin asignar (estado desbalanceado)

## Configuración

### Proxy de Vite (Frontend)

El frontend hace proxy de las peticiones API para evitar problemas de CORS:

```typescript
// vite.config.ts
proxy: {
  '/api': {
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
  }
}
```

### Alias de Rutas

```typescript
// tsconfig.json
"paths": {
  "@/*": ["./src/*"]
}
```

## Solución de Problemas

**El backend no inicia:**
- Verifica que `uv` está instalado: `pip install uv`
- Revisa la versión de Python: `python --version` (necesita 3.13+)

**El frontend no inicia:**
- Verifica que Bun está instalado: `curl -fsSL https://bun.sh/install | bash`
- Limpia node_modules: `rm -rf node_modules && bun install`

**Las imágenes no cargan:**
- Verifica que las imágenes están en `backend/data/images/`
- Verifica que el servidor backend está corriendo en el puerto 8000
- Revisa la consola del navegador por errores CORS

**Las cajas no se alinean:**
- Las imágenes se ajustan automáticamente al canvas con transformación de coordenadas correcta
- El estado de zoom/pan se resetea al cambiar de imagen

## Licencia
MIT

## Agradecimientos
- Wyatt Kennedy por crear fuente [Keposhka Regular Font](https://www.1001fonts.com/keposhka-regular-font.html)
