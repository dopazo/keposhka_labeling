/**
 * Editor Panel Component
 * Left sidebar with file list and text input
 * Phase 4: UI de Etiquetado - Character highlighting and validation
 * Phase 5: Navigation and Image List - Filtering, search, keyboard nav
 */

import { useRef, useCallback, useMemo, useEffect } from 'react';
import { useStore, type FilterStatus } from '@/store/useStore';

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

// Filter button component
function FilterButton({
  label,
  value,
  current,
  count,
  onClick,
}: {
  label: string;
  value: FilterStatus;
  current: FilterStatus;
  count: number;
  onClick: (value: FilterStatus) => void;
}) {
  const isActive = current === value;
  return (
    <button
      onClick={() => onClick(value)}
      className={`
        flex-1 px-2 py-1.5 text-xs font-medium rounded-md
        transition-all duration-150
        ${
          isActive
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }
      `}
    >
      {label}
      <span
        className={`ml-1 ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}
      >
        ({count})
      </span>
    </button>
  );
}

export function EditorPanel() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const {
    inputText,
    setInputText,
    images,
    currentImage,
    validation,
    boxes,
    // Phase 5: Filter & Search
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    selectImage,
    selectNextImage,
    selectPreviousImage,
    isLoadingAnnotation,
    // Phase 6: Save
    isSaving,
    lastSaveResult,
    saveAnnotation,
    skipToNextPending,
    clearSaveResult,
  } = useStore();

  // Filtered images based on status and search query
  const filteredImages = useMemo(() => {
    return images.filter((img) => {
      // Apply status filter
      if (filterStatus !== 'all' && img.status !== filterStatus) {
        return false;
      }
      // Apply search query
      if (
        searchQuery &&
        !img.filename.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [images, filterStatus, searchQuery]);

  // Count by status for filter buttons
  const statusCounts = useMemo(() => {
    const searchFiltered = searchQuery
      ? images.filter((img) =>
          img.filename.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : images;
    return {
      all: searchFiltered.length,
      done: searchFiltered.filter((img) => img.status === 'done').length,
      pending: searchFiltered.filter((img) => img.status === 'pending').length,
    };
  }, [images, searchQuery]);

  // Determine if save button should be enabled (moved before useEffect that uses it)
  const canSave = useMemo(() => {
    // Must have an image selected
    if (!currentImage) return false;
    // Must have at least one box
    if (boxes.length === 0) return false;
    // Must be balanced and have no invalid characters
    return validation.isBalanced && validation.invalidCharIndices.length === 0;
  }, [currentImage, boxes.length, validation]);

  // Handle keyboard navigation and Shift+Enter to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift+Enter to save (works anywhere)
      if (e.key === 'Enter' && e.shiftKey && canSave && !isSaving) {
        e.preventDefault();
        saveAnnotation();
        return;
      }

      // Skip arrow navigation if focus is in textarea or search input
      const activeElement = document.activeElement;
      if (
        activeElement?.tagName === 'TEXTAREA' ||
        (activeElement?.tagName === 'INPUT' &&
          (activeElement as HTMLInputElement).type === 'text')
      ) {
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectNextImage();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectPreviousImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectNextImage, selectPreviousImage, canSave, isSaving, saveAnnotation]);

  // Scroll current image into view
  useEffect(() => {
    if (currentImage && listRef.current) {
      const currentButton = listRef.current.querySelector(
        `[data-filename="${currentImage.filename}"]`
      );
      if (currentButton) {
        currentButton.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [currentImage]);

  // Clear save result after 3 seconds
  useEffect(() => {
    if (lastSaveResult) {
      const timer = setTimeout(() => {
        clearSaveResult();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [lastSaveResult, clearSaveResult]);

  // Handler for save button
  const handleSave = useCallback(() => {
    if (canSave && !isSaving) {
      saveAnnotation();
    }
  }, [canSave, isSaving, saveAnnotation]);

  // Handler for skip button
  const handleSkip = useCallback(() => {
    skipToNextPending();
  }, [skipToNextPending]);

  const handleImageSelect = (image: (typeof images)[0]) => {
    selectImage(image);
  };

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputText(e.target.value);
    },
    [setInputText]
  );

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
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
        {/* Search & Filter Controls */}
        <div className="p-3 border-b border-slate-200 bg-white/50 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar imagen..."
              className="
                w-full pl-8 pr-3 py-2 text-sm
                bg-white border border-slate-200 rounded-lg
                placeholder:text-slate-400
                focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400
                transition-all duration-150
              "
            />
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-1">
            <FilterButton
              label="Todas"
              value="all"
              current={filterStatus}
              count={statusCounts.all}
              onClick={setFilterStatus}
            />
            <FilterButton
              label="Hechas"
              value="done"
              current={filterStatus}
              count={statusCounts.done}
              onClick={setFilterStatus}
            />
            <FilterButton
              label="Pend."
              value="pending"
              current={filterStatus}
              count={statusCounts.pending}
              onClick={setFilterStatus}
            />
          </div>
        </div>

        {/* Image List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoadingAnnotation && (
            <div className="flex items-center justify-center py-2">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {filteredImages.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-8">
              {images.length === 0
                ? 'No hay imágenes'
                : 'No hay resultados'}
            </div>
          ) : (
            filteredImages.map((image) => (
              <button
                key={image.filename}
                data-filename={image.filename}
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
                  <span className="truncate flex-1 font-medium">
                    {image.filename}
                  </span>
                  <span
                    className={`ml-2 text-sm flex-shrink-0 ${
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

        {/* Navigation hint */}
        <div className="px-3 py-2 border-t border-slate-200 bg-slate-50/80">
          <p className="text-[10px] text-slate-400 text-center">
            <kbd className="px-1 py-0.5 bg-slate-200 rounded text-slate-600">↑</kbd>
            <kbd className="px-1 py-0.5 bg-slate-200 rounded text-slate-600 ml-1">↓</kbd>
            {' '}para navegar
          </p>
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
        {/* Save Result Feedback */}
        {lastSaveResult && (
          <div
            className={`
              px-3 py-2 text-xs font-medium rounded-lg text-center
              transition-all duration-300
              ${
                lastSaveResult.success
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-red-100 text-red-700 border border-red-200'
              }
            `}
          >
            {lastSaveResult.message}
          </div>
        )}

        <button
          onClick={handleSave}
          className={`
            w-full px-4 py-2.5 text-sm font-semibold
            rounded-lg transition-all duration-150
            flex items-center justify-center gap-2
            ${
              canSave && !isSaving
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-200'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }
          `}
          disabled={!canSave || isSaving}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              Completar
              <span className="text-emerald-300 text-xs ml-1">(Shift+Enter)</span>
            </>
          )}
        </button>
        <button
          onClick={handleSkip}
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
