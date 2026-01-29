/**
 * Editor Panel Component - DRAAG REGIME EDITION
 * Brutalist aesthetic with regime styling
 * Left sidebar with file list and text input
 */

import { memo, useRef, useCallback, useMemo, useEffect } from 'react';
import { useStore, type FilterStatus } from '@/store/useStore';

/**
 * Renders text with highlighted characters - Regime styling
 * Invalid chars = red background (ERROR)
 * Unassigned chars = amber background (WARNING)
 */
const HighlightedText = memo(function HighlightedText({
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
      className="absolute inset-0 px-3 py-2 text-sm pointer-events-none whitespace-pre-wrap break-words font-mono"
      aria-hidden="true"
    >
      {segments.map((segment, i) => {
        if (segment.type === 'invalid') {
          return (
            <span
              key={i}
              className="bg-keposhka-red/80 text-keposhka-white border-b-2 border-keposhka-white"
            >
              {segment.char}
            </span>
          );
        }
        if (segment.type === 'unassigned') {
          return (
            <span
              key={i}
              className="bg-amber-600/60 text-amber-100"
            >
              {segment.char}
            </span>
          );
        }
        return (
          <span key={i} className="text-transparent">
            {segment.char}
          </span>
        );
      })}
    </div>
  );
});

// Filter button - Brutalist style
const FilterButton = memo(function FilterButton({
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
        flex-1 px-2 py-1.5 text-xs font-heading uppercase tracking-wider
        border-2 transition-all duration-100
        ${
          isActive
            ? 'bg-keposhka-red text-keposhka-white border-keposhka-red shadow-brutal-sm'
            : 'bg-keposhka-black text-keposhka-cream border-keposhka-steel hover:border-keposhka-red'
        }
      `}
    >
      {label}
      <span className={`ml-1 font-mono ${isActive ? 'text-keposhka-cream/70' : 'text-keposhka-steel'}`}>
        [{count}]
      </span>
    </button>
  );
});

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
    filterStatus,
    setFilterStatus,
    searchQuery,
    setSearchQuery,
    selectImage,
    selectNextImage,
    selectPreviousImage,
    isLoadingAnnotation,
    isSaving,
    lastSaveResult,
    saveAnnotation,
    skipToNextPending,
    clearSaveResult,
  } = useStore();

  const filteredImages = useMemo(() => {
    return images.filter((img) => {
      if (filterStatus !== 'all' && img.status !== filterStatus) return false;
      if (searchQuery && !img.filename.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [images, filterStatus, searchQuery]);

  const statusCounts = useMemo(() => {
    const searchFiltered = searchQuery
      ? images.filter((img) => img.filename.toLowerCase().includes(searchQuery.toLowerCase()))
      : images;
    return {
      all: searchFiltered.length,
      done: searchFiltered.filter((img) => img.status === 'done').length,
      pending: searchFiltered.filter((img) => img.status === 'pending').length,
    };
  }, [images, searchQuery]);

  const canSave = useMemo(() => {
    if (!currentImage) return false;
    if (boxes.length === 0) return false;
    return validation.isBalanced && validation.invalidCharIndices.length === 0;
  }, [currentImage, boxes.length, validation]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.shiftKey && canSave && !isSaving) {
        e.preventDefault();
        saveAnnotation();
        return;
      }
      const activeElement = document.activeElement;
      if (activeElement?.tagName === 'TEXTAREA' || (activeElement?.tagName === 'INPUT' && (activeElement as HTMLInputElement).type === 'text')) {
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

  useEffect(() => {
    if (currentImage && listRef.current) {
      const currentButton = listRef.current.querySelector(`[data-filename="${currentImage.filename}"]`);
      if (currentButton) {
        currentButton.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [currentImage]);

  useEffect(() => {
    if (lastSaveResult) {
      const timer = setTimeout(() => clearSaveResult(), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastSaveResult, clearSaveResult]);

  const handleSave = useCallback(() => {
    if (canSave && !isSaving) saveAnnotation();
  }, [canSave, isSaving, saveAnnotation]);

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

  const statusMessage = useMemo(() => {
    if (!currentImage) {
      return { text: 'SELECCIONA ARCHIVO', color: 'text-keposhka-steel', icon: '>' };
    }
    if (boxes.length === 0) {
      return { text: 'DIBUJA SECTORES', color: 'text-keposhka-steel', icon: '□' };
    }
    if (validation.invalidCharIndices.length > 0) {
      return {
        text: `ERROR: ${validation.invalidCharIndices.length} CARACTER(ES) PROHIBIDO(S)`,
        color: 'text-keposhka-red',
        icon: '!',
      };
    }
    if (!validation.isBalanced) {
      const diff = validation.textCharCount - validation.boxCharCount;
      if (diff > 0) {
        return { text: `EXCESO: +${diff} CARACTERES`, color: 'text-amber-500', icon: '+' };
      } else {
        return { text: `DEFICIT: ${Math.abs(diff)} CARACTERES`, color: 'text-amber-500', icon: '-' };
      }
    }
    return { text: 'AUTORIZADO PARA ARCHIVO', color: 'text-green-500', icon: '✓' };
  }, [currentImage, boxes.length, validation]);

  return (
    <div className="h-full w-80 bg-keposhka-concrete border-r-4 border-keposhka-black flex flex-col noise-overlay">
      {/* REGIME HEADER */}
      <div className="panel-header relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-3">
          {/* Regime emblem */}
          <div className="w-8 h-8 bg-keposhka-black flex items-center justify-center">
            <span className="text-keposhka-red text-lg font-display">K</span>
          </div>
          <div>
            <h1 className="text-xl tracking-[0.25em] leading-none">KEPOSHKA</h1>
            <p className="text-[10px] tracking-[0.3em] text-keposhka-cream/60 mt-0.5">
              SISTEMA DE ETIQUETADO // DRAAG
            </p>
          </div>
        </div>
        {/* Diagonal stripes overlay */}
        <div className="absolute inset-0 bg-diagonal-stripes opacity-30" />
      </div>

      {/* ARCHIVO SECTION */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {/* Search & Filter - Industrial Control Panel */}
        <div className="p-3 border-b-2 border-keposhka-steel bg-keposhka-black/50 space-y-3">
          {/* Section label */}
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-keposhka-steel" />
            <span className="text-[10px] font-heading uppercase tracking-[0.2em] text-keposhka-steel">
              ARCHIVOS DE IMAGEN
            </span>
            <div className="h-px flex-1 bg-keposhka-steel" />
          </div>

          {/* Search Input - Brutal style */}
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="BUSCAR..."
              className="
                w-full pl-8 pr-8 py-2 text-sm font-mono uppercase
                bg-keposhka-black text-keposhka-cream
                border-2 border-keposhka-steel
                placeholder:text-keposhka-steel/50
                focus:outline-none focus:border-keposhka-red
                transition-colors duration-100
              "
            />
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-keposhka-red"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-keposhka-steel hover:text-keposhka-red"
              >
                <span className="font-mono text-xs">×</span>
              </button>
            )}
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-1">
            <FilterButton label="TODOS" value="all" current={filterStatus} count={statusCounts.all} onClick={setFilterStatus} />
            <FilterButton label="LISTO" value="done" current={filterStatus} count={statusCounts.done} onClick={setFilterStatus} />
            <FilterButton label="PEND." value="pending" current={filterStatus} count={statusCounts.pending} onClick={setFilterStatus} />
          </div>
        </div>

        {/* File List - Dossier style */}
        <div ref={listRef} className="flex-1 overflow-y-auto bg-keposhka-black/30">
          {isLoadingAnnotation && (
            <div className="flex items-center justify-center py-4 gap-2">
              <div className="w-3 h-3 border-2 border-keposhka-red border-t-transparent animate-spin" />
              <span className="text-xs font-mono text-keposhka-steel uppercase">Cargando datos...</span>
            </div>
          )}
          {filteredImages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl text-keposhka-steel/30 mb-2">∅</div>
              <span className="text-xs font-mono text-keposhka-steel uppercase">
                {images.length === 0 ? 'SIN ARCHIVOS' : 'SIN RESULTADOS'}
              </span>
            </div>
          ) : (
            <div className="divide-y divide-keposhka-steel/30">
              {filteredImages.map((image, index) => {
                const isActive = currentImage?.filename === image.filename;
                const isDone = image.status === 'done';
                return (
                  <button
                    key={image.filename}
                    data-filename={image.filename}
                    onClick={() => handleImageSelect(image)}
                    className={`
                      w-full text-left px-3 py-2.5 font-mono text-sm
                      border-l-4 transition-all duration-100
                      flex items-center gap-3
                      ${isActive
                        ? 'bg-keposhka-red text-keposhka-white border-l-keposhka-white'
                        : isDone
                          ? 'bg-keposhka-black/20 text-keposhka-cream/70 border-l-green-600 hover:bg-keposhka-steel/30'
                          : 'bg-transparent text-keposhka-cream/80 border-l-transparent hover:bg-keposhka-steel/30 hover:border-l-keposhka-red'
                      }
                    `}
                  >
                    {/* Index number */}
                    <span className={`text-[10px] w-6 ${isActive ? 'text-keposhka-cream/50' : 'text-keposhka-steel'}`}>
                      {String(index + 1).padStart(3, '0')}
                    </span>
                    {/* Filename */}
                    <span className="flex-1 truncate uppercase tracking-wide">
                      {image.filename}
                    </span>
                    {/* Status indicator */}
                    <span className={`text-sm font-bold ${isActive ? 'text-keposhka-white' : isDone ? 'text-green-500' : 'text-keposhka-steel/50'}`}>
                      {isDone ? '✓' : '○'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigation hint - industrial */}
        <div className="px-3 py-2 border-t-2 border-keposhka-steel bg-keposhka-black/50">
          <p className="text-[10px] text-keposhka-steel text-center font-mono">
            <kbd className="px-1.5 py-0.5 bg-keposhka-steel/30 border border-keposhka-steel text-keposhka-cream">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-keposhka-steel/30 border border-keposhka-steel text-keposhka-cream ml-1">↓</kbd>
            <span className="ml-2 uppercase">Navegar</span>
          </p>
        </div>
      </div>

      {/* TRADUCCIÓN SECTION */}
      <div className="border-t-4 border-keposhka-red bg-keposhka-black">
        {/* Section header */}
        <div className="px-4 py-2 bg-keposhka-red/20 border-b border-keposhka-red/50 flex items-center justify-between">
          <span className="text-xs font-heading uppercase tracking-[0.2em] text-keposhka-red">
            CAMPO DE TRADUCCIÓN
          </span>
          {/* Character count */}
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="px-2 py-0.5 bg-keposhka-black border border-keposhka-steel text-keposhka-cream">
              TXT:{validation.textCharCount}
            </span>
            <span className="px-2 py-0.5 bg-keposhka-black border border-keposhka-steel text-keposhka-cream">
              BOX:{validation.boxCharCount}
            </span>
          </div>
        </div>

        {/* Textarea with overlay */}
        <div className="p-3">
          <div className="relative">
            <HighlightedText
              text={inputText}
              invalidIndices={validation.invalidCharIndices}
              unassignedIndices={validation.unassignedTextIndices}
            />
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleTextChange}
              placeholder="INGRESE TEXTO TRADUCIDO..."
              className="
                w-full h-28 px-3 py-2 text-sm font-mono
                bg-keposhka-black/50 text-keposhka-cream
                border-2 border-keposhka-steel
                focus:outline-none focus:border-keposhka-red
                resize-none relative z-10
                placeholder:text-keposhka-steel/50 placeholder:uppercase
              "
              spellCheck={false}
            />
          </div>

          {/* Status and help */}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-keposhka-steel font-mono uppercase">
              Enter = Nueva Línea
            </span>
            <span className={`text-xs font-heading uppercase tracking-wider flex items-center gap-1 ${statusMessage.color}`}>
              <span className="font-mono">[{statusMessage.icon}]</span>
              {statusMessage.text}
            </span>
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center gap-4 text-[10px] font-mono uppercase">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-keposhka-red/80 border border-keposhka-red"></span>
              <span className="text-keposhka-steel">Prohibido</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-amber-600/60 border border-amber-600"></span>
              <span className="text-keposhka-steel">Excedente</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-600/60 border border-green-600"></span>
              <span className="text-keposhka-steel">Asignado</span>
            </span>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS - Regime style */}
      <div className="p-3 border-t-2 border-keposhka-steel bg-keposhka-black space-y-2">
        {/* Save Result Feedback */}
        {lastSaveResult && (
          <div
            className={`
              px-3 py-2 text-xs font-mono uppercase text-center
              border-2 transition-all duration-200
              ${lastSaveResult.success
                ? 'bg-green-900/50 text-green-400 border-green-600'
                : 'bg-keposhka-red/30 text-keposhka-red border-keposhka-red'
              }
            `}
          >
            {lastSaveResult.success ? '✓ ' : '✗ '}
            {lastSaveResult.message}
          </div>
        )}

        {/* Main save button - Big propaganda style */}
        <button
          onClick={handleSave}
          disabled={!canSave || isSaving}
          className={`
            w-full px-4 py-3 font-display text-lg uppercase tracking-[0.2em]
            border-2 transition-all duration-100
            flex items-center justify-center gap-3
            ${canSave && !isSaving
              ? 'bg-keposhka-red text-keposhka-white border-keposhka-black shadow-brutal hover:shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5'
              : 'bg-keposhka-steel/30 text-keposhka-steel border-keposhka-steel cursor-not-allowed'
            }
          `}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-keposhka-white border-t-transparent animate-spin" />
              <span>PROCESANDO...</span>
            </>
          ) : (
            <>
              <span className="text-2xl font-display">▸</span>
              <span>COMPLETAR</span>
              <span className="text-xs font-mono text-keposhka-cream/50">[SHIFT+ENTER]</span>
            </>
          )}
        </button>

        {/* Skip button - Secondary */}
        <button
          onClick={handleSkip}
          className="
            w-full px-4 py-2 font-heading text-sm uppercase tracking-wider
            bg-keposhka-black text-keposhka-cream
            border-2 border-keposhka-steel
            hover:border-keposhka-red hover:text-keposhka-red
            transition-colors duration-100
          "
        >
          OMITIR → SIGUIENTE PENDIENTE
        </button>
      </div>
    </div>
  );
}
