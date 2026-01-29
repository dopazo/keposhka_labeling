/**
 * Editor Panel Component
 * Left sidebar with file list and text input
 * Phase 4: UI de Etiquetado - Character highlighting and validation
 */

import { useRef, useCallback, useMemo } from 'react';
import { useStore } from '@/store/useStore';

/**
 * Renders text with highlighted characters
 * Invalid chars = red background
 * Unassigned chars = yellow background
 */
function HighlightedText({
  text,
  invalidIndices,
  unassignedIndices,
}: {
  text: string;
  invalidIndices: number[];
  unassignedIndices: number[];
}) {
  const invalidSet = useMemo(() => new Set(invalidIndices), [invalidIndices]);
  const unassignedSet = useMemo(() => new Set(unassignedIndices), [unassignedIndices]);

  // Build segments for rendering
  const segments = useMemo(() => {
    const result: { char: string; type: 'normal' | 'invalid' | 'unassigned' }[] = [];

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      let type: 'normal' | 'invalid' | 'unassigned' = 'normal';

      if (invalidSet.has(i)) {
        type = 'invalid';
      } else if (unassignedSet.has(i)) {
        type = 'unassigned';
      }

      result.push({ char, type });
    }

    return result;
  }, [text, invalidSet, unassignedSet]);

  return (
    <div
      className="
        absolute inset-0 px-3 py-2 text-sm
        pointer-events-none whitespace-pre-wrap break-words
        font-mono
      "
      aria-hidden="true"
    >
      {segments.map((segment, i) => {
        if (segment.type === 'invalid') {
          return (
            <span
              key={i}
              className="bg-red-400/60 text-red-900 rounded-sm"
            >
              {segment.char}
            </span>
          );
        }
        if (segment.type === 'unassigned') {
          return (
            <span
              key={i}
              className="bg-amber-300/60 text-amber-900 rounded-sm"
            >
              {segment.char}
            </span>
          );
        }
        // Normal character - render invisible to maintain spacing
        return (
          <span key={i} className="text-transparent">
            {segment.char}
          </span>
        );
      })}
    </div>
  );
}

export function EditorPanel() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    inputText,
    setInputText,
    images,
    currentImage,
    setCurrentImage,
    validation,
    boxes,
  } = useStore();

  const handleImageSelect = (image: typeof images[0]) => {
    setCurrentImage(image);
    // TODO: Load existing annotations if available
  };

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputText(e.target.value);
    },
    [setInputText]
  );

  // Determine if save button should be enabled
  const canSave = useMemo(() => {
    // Must have an image selected
    if (!currentImage) return false;
    // Must have at least one box
    if (boxes.length === 0) return false;
    // Must be balanced and have no invalid characters
    return validation.isBalanced && validation.invalidCharIndices.length === 0;
  }, [currentImage, boxes.length, validation]);

  // Status message for the user
  const statusMessage = useMemo(() => {
    if (!currentImage) {
      return { text: 'Selecciona una imagen', color: 'text-gray-500' };
    }
    if (boxes.length === 0) {
      return { text: 'Dibuja cajas alrededor de los caracteres', color: 'text-gray-500' };
    }
    if (validation.invalidCharIndices.length > 0) {
      return {
        text: `${validation.invalidCharIndices.length} carácter(es) inválido(s)`,
        color: 'text-red-600',
      };
    }
    if (!validation.isBalanced) {
      const diff = validation.textCharCount - validation.boxCharCount;
      if (diff > 0) {
        return {
          text: `Sobran ${diff} carácter(es) en el texto`,
          color: 'text-amber-600',
        };
      } else {
        return {
          text: `Faltan ${Math.abs(diff)} carácter(es) en el texto`,
          color: 'text-amber-600',
        };
      }
    }
    return { text: 'Listo para guardar', color: 'text-green-600' };
  }, [currentImage, boxes.length, validation]);

  return (
    <div className="h-full w-72 bg-slate-50 border-r border-slate-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white">
        <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
          Keposhka Labeler
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">Herramienta de etiquetado</p>
      </div>

      {/* Image List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-2 px-2">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Imágenes
          </h3>
          {/* TODO: Add filter buttons (All/Done/Pending) */}
          {/* TODO: Add search input */}
        </div>

        <div className="space-y-1">
          {images.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-8">
              No hay imágenes
            </div>
          ) : (
            images.map((image) => (
              <button
                key={image.filename}
                onClick={() => handleImageSelect(image)}
                className={`
                  w-full text-left px-3 py-2 rounded-lg text-sm
                  transition-all duration-150
                  ${
                    currentImage?.filename === image.filename
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'hover:bg-slate-100 text-slate-700'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate flex-1 font-medium">{image.filename}</span>
                  <span
                    className={`ml-2 text-sm ${
                      currentImage?.filename === image.filename
                        ? 'text-indigo-200'
                        : image.status === 'done'
                        ? 'text-emerald-500'
                        : 'text-slate-300'
                    }`}
                  >
                    {image.status === 'done' ? '✓' : '○'}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Text Input Area with Highlighting */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Traducción
          </label>
          {/* Character count badge */}
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">
              Texto: {validation.textCharCount}
            </span>
            <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">
              Cajas: {validation.boxCharCount}
            </span>
          </div>
        </div>

        {/* Textarea with overlay for highlighting */}
        <div className="relative">
          {/* Highlight overlay */}
          <HighlightedText
            text={inputText}
            invalidIndices={validation.invalidCharIndices}
            unassignedIndices={validation.unassignedTextIndices}
          />

          {/* Actual textarea */}
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={handleTextChange}
            placeholder="Escriba la traducción..."
            className="
              w-full h-32 px-3 py-2 text-sm
              bg-transparent border border-slate-300 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
              resize-none font-mono
              relative z-10
            "
            spellCheck={false}
          />
        </div>

        {/* Help text and status */}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">
            Enter: nueva línea
          </span>
          <span className={`text-xs font-medium ${statusMessage.color}`}>
            {statusMessage.text}
          </span>
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-red-400/60 rounded-sm"></span>
            <span className="text-slate-500">Inválido</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-amber-300/60 rounded-sm"></span>
            <span className="text-slate-500">Sin asignar</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-emerald-400/60 rounded-sm"></span>
            <span className="text-slate-500">Asignado</span>
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-slate-200 bg-white space-y-2">
        <button
          className={`
            w-full px-4 py-2.5 text-sm font-semibold
            rounded-lg transition-all duration-150
            ${
              canSave
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-200'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }
          `}
          disabled={!canSave}
        >
          {canSave ? 'Completar' : 'Completar'}
        </button>
        <button
          className="
            w-full px-4 py-2 text-sm font-medium
            bg-slate-100 text-slate-700
            rounded-lg hover:bg-slate-200 transition-colors
          "
        >
          Dejar Pendiente
        </button>
      </div>
    </div>
  );
}
