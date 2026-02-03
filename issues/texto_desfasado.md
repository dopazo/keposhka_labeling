# Issue: Texto Desfasado en Campo de Traduccion

## Descripcion del Problema

El campo de traduccion en `EditorPanel.tsx` utiliza una tecnica de "overlay" para mostrar texto con resaltado de colores (caracteres invalidos en rojo, caracteres sin asignar en ambar). Esta tecnica consiste en:

1. Un `<textarea>` con texto transparente donde el usuario escribe
2. Un `<div>` overlay (HighlightedText) posicionado encima que renderiza el mismo texto con los colores de resaltado

**El problema**: El texto del overlay y el texto del textarea no estan perfectamente alineados. Estan "desfasados" horizontalmente, lo que causa:

- Al seleccionar texto visualmente, se selecciona texto diferente del textarea subyacente
- Al copiar, el contenido copiado no corresponde con lo que se ve seleccionado
- Ejemplo: Seleccionar visualmente "month" copia "lf of" (texto de otra posicion)

### Evidencia Visual

- El texto naranja (resaltado) aparece en una posicion
- Al seleccionar caracter por caracter, la seleccion "salta" a caracteres de otras palabras
- En DevTools el contenido del textarea es correcto (no esta duplicado)

## Arquitectura Actual

### Componente HighlightedText

```tsx
const HighlightedText = memo(function HighlightedText({
  text,
  invalidIndices,
  unassignedIndices,
  scrollTop,
}) {
  // Genera segmentos de texto con tipo: 'normal' | 'invalid' | 'unassigned'

  return (
    <div
      className="absolute overflow-hidden pointer-events-none select-none"
      style={{ top: '2px', left: '2px', right: '2px', bottom: '2px' }}
      aria-hidden="true"
    >
      <div
        className="px-3 py-2 text-sm whitespace-pre-wrap break-words font-mono leading-5"
        style={{ transform: `translateY(-${scrollTop}px)` }}
      >
        {segments.map((segment, i) => (
          <span key={i} className={...}>{segment.char}</span>
        ))}
      </div>
    </div>
  );
});
```

### Textarea

```tsx
<textarea
  className="
    w-full h-28 px-3 py-2 text-sm font-mono leading-5
    bg-transparent textarea-transparent
    border-2 border-keposhka-cream/30
    focus:outline-none focus:border-keposhka-red
    resize-none relative z-10 overflow-y-auto
    placeholder:text-keposhka-cream/40 placeholder:uppercase
  "
  spellCheck={false}
/>
```

### CSS para Textarea Transparente

```css
.textarea-transparent {
  color: transparent !important;
  -webkit-text-fill-color: transparent !important;
  caret-color: var(--keposhka-red);
}

.textarea-transparent::placeholder {
  color: rgba(245, 240, 230, 0.4) !important;
  -webkit-text-fill-color: rgba(245, 240, 230, 0.4) !important;
}

.textarea-transparent::selection {
  color: transparent !important;
  -webkit-text-fill-color: transparent !important;
  background-color: rgba(137, 24, 26, 0.3);
}
```

## Intentos de Solucion (No Exitosos)

### Intento 1: Agregar `select-none` al overlay
- **Cambio**: Agregar clase `select-none` al div del HighlightedText
- **Razon**: Evitar que el overlay sea seleccionable
- **Resultado**: No soluciono el problema - el desfase visual persiste

### Intento 2: CSS para seleccion transparente
- **Cambio**: Agregar estilos `::selection` y `::-moz-selection` con `color: transparent`
- **Razon**: Evitar que el texto del textarea sea visible al seleccionar
- **Resultado**: No soluciono el problema - el desfase es de posicionamiento, no de visibilidad

### Intento 3: Remover border del overlay y posicionar con inset exacto
- **Cambio**: Cambiar de `border-2 border-transparent` a `style={{ top: '2px', left: '2px', right: '2px', bottom: '2px' }}`
- **Razon**: El border transparente podria estar afectando el layout interno
- **Resultado**: No soluciono el problema

### Intento 4: Agregar line-height explicito
- **Cambio**: Agregar `leading-5` tanto al overlay como al textarea
- **Razon**: Asegurar que ambos tengan el mismo line-height (1.25rem / 20px)
- **Resultado**: No soluciono el problema

## Posibles Causas Raiz

### 1. Diferencias en Renderizado de Texto
- El textarea y el div pueden renderizar el mismo texto con diferencias sutiles en:
  - Kerning (espaciado entre caracteres)
  - Sub-pixel rendering
  - Anti-aliasing

### 2. Diferencias en Word Wrapping
- El textarea puede tener reglas de word-wrap diferentes a `whitespace-pre-wrap break-words`
- El punto donde el texto salta a la siguiente linea puede diferir

### 3. Scrollbar Space
- El textarea con `overflow-y-auto` puede reservar espacio para scrollbar
- Este espacio reduce el ancho del area de texto pero no afecta al overlay

### 4. Box Model Differences
- Diferencias en `box-sizing` entre textarea y div
- Padding interno del textarea puede diferir del especificado

### 5. Font Rendering en Diferentes Elementos
- Aunque ambos usan `font-mono`, el navegador puede renderizar diferente en textarea vs div
- El textarea puede tener estilos user-agent que afectan el renderizado

### 6. Caracteres Renderizados Individualmente
- El overlay renderiza cada caracter en un `<span>` separado
- Esto puede causar diferencias en el espaciado comparado con texto continuo

## Informacion Tecnica Relevante

### Estructura del DOM
```
div.relative (contenedor)
  ├── HighlightedText (absolute, pointer-events-none)
  │     └── div (con transform para scroll sync)
  │           └── span * N (cada caracter)
  └── textarea (relative z-10, texto transparente)
```

### Estilos Compartidos (deberian ser identicos)
- `px-3 py-2` (padding: 0.5rem 0.75rem)
- `text-sm` (font-size: 0.875rem)
- `font-mono` (font-family: monospace)
- `leading-5` (line-height: 1.25rem)
- `whitespace-pre-wrap`
- `break-words`

### Navegador de Prueba
- (Agregar info del navegador usado para testing)

## Posibles Soluciones a Explorar

### 1. Usar contenteditable en lugar de textarea
- Reemplazar el textarea por un `<div contenteditable>`
- Aplicar el resaltado directamente al contenido
- **Pros**: Elimina el problema de sincronizacion
- **Contras**: Mas complejo de manejar, comportamiento diferente

### 2. Canvas-based Text Rendering
- Renderizar el texto en un canvas
- Control total sobre posicionamiento de caracteres
- **Contras**: Muy complejo, pierde accesibilidad

### 3. Medir y Ajustar Dinamicamente
- Usar `measureText()` o elementos de medicion para calcular posiciones exactas
- Ajustar el overlay basado en mediciones reales
- **Contras**: Complejo y potencialmente lento

### 4. Investigar CSS Especificos del Textarea
- Inspeccionar computed styles del textarea
- Identificar diferencias especificas
- Aplicar resets o overrides necesarios

### 5. Usar una Libreria Especializada
- Librerias como CodeMirror, Monaco Editor, o similares
- Ya resuelven este problema de syntax highlighting en inputs
- **Contras**: Dependencia adicional, posible overkill

## Archivos Involucrados

- `frontend/src/components/EditorPanel.tsx` - Componente principal
- `frontend/src/index.css` - Estilos CSS incluyendo `.textarea-transparent`

## Proximos Pasos Sugeridos

1. Inspeccionar computed styles de ambos elementos en DevTools
2. Comparar el ancho exacto del area de texto en textarea vs overlay
3. Probar con un texto simple de caracteres iguales (ej: "aaaaaaa") para ver el patron de desfase
4. Verificar si el desfase es constante o variable
5. Probar en diferentes navegadores para ver si es browser-specific
