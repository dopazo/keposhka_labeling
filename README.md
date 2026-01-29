# Keposhka Labeler

Herramienta de etiquetado para imágenes del lenguaje ficticio "Keposhka". Permite dibujar bounding boxes alrededor de caracteres y asignar automáticamente las etiquetas mediante ordenamiento espacial.

## Stack Tecnológico

- **Backend**: FastAPI + Uvicorn (Python), gestionado con `uv`
- **Frontend**: React + Vite + TypeScript, Tailwind CSS, react-konva, zustand
- **Package Manager (Frontend)**: Bun

## Estructura del Proyecto

```
/keposhka-labeler
├── /backend
│   ├── main.py             # FastAPI App - Endpoints
│   ├── schemas.py          # Modelos Pydantic
│   ├── utils.py            # Lógica de guardado YOLO + JSON
│   └── /data
│       ├── /images         # Imágenes a anotar
│       ├── /annotations    # Archivos .txt (YOLO) y .json generados
│       └── /reference      # Imagen del alfabeto Keposhka (pendiente)
│
├── /frontend
│   ├── vite.config.ts      # Configuración de Proxy: /api -> localhost:8000
│   ├── tsconfig.json       # Configuración de Alias: @/*
│   └── src
│       ├── components/     # Componentes React
│       ├── store/          # Zustand state management
│       └── lib/            # Utilidades (validator, sorter, types)
```

## Instalación

### Backend

```bash
cd backend

# Instalar dependencias con uv
uv sync

# Ejecutar servidor de desarrollo
uv run uvicorn main:app --reload
```

El backend estará disponible en `http://127.0.0.1:8000`

### Frontend

```bash
cd frontend

# Instalar dependencias con Bun
bun install

# Ejecutar servidor de desarrollo
bun run dev
```

El frontend estará disponible en `http://localhost:5173`

## Uso

1. Coloca las imágenes de Keposhka en `backend/data/images/`
2. Inicia el backend (FastAPI)
3. Inicia el frontend (Vite)
4. Abre `http://localhost:5173` en tu navegador
5. Selecciona una imagen de la lista lateral
6. Dibuja bounding boxes alrededor de los caracteres
7. Escribe la traducción en el textarea
8. El sistema asignará automáticamente las etiquetas
9. Presiona "Completar" o Shift+Enter para guardar

## Estado del Desarrollo

✅ **Fase 1 Completada**:
- Estructura de backend y frontend configurada
- Endpoint `GET /api/images` implementado
- Layout de 3 columnas (lista, canvas, referencia)
- Panel de referencia con placeholder
- Store de Zustand con estado inicial
- Validador de alfabeto Keposhka

🚧 **Fase 2** (Por implementar):
- Canvas interactivo con react-konva
- Dibujo de bounding boxes
- Transformer para redimensionar/mover cajas

🚧 **Fase 3** (Por implementar):
- Algoritmo de ordenamiento espacial
- Asignación automática de etiquetas
- Soporte para dígrafos (CH, GH, SH, TH)

## API Endpoints

- `GET /api/images` - Lista todas las imágenes con su estado
- `GET /api/annotations/{filename}` - Obtiene anotaciones existentes
- `POST /api/save` - Guarda anotaciones en formato YOLO + JSON
- `GET /health` - Health check

## Formato de Salida

Para cada imagen anotada, se generan dos archivos:

1. **`.txt`** (YOLO format): Para entrenamiento del modelo
   ```
   10 0.5234 0.3125 0.0260 0.0556
   42 0.5703 0.3125 0.0234 0.0556
   ```

2. **`.json`** (Metadata): Para re-edición
   ```json
   {
     "filename": "imagen.jpg",
     "translatedText": "Hola",
     "boxes": [...]
   }
   ```

## Licencia

MIT
