/**
 * Editor Panel Component - DRAAG REGIME EDITION
 * Brutalist aesthetic with regime styling
 * Left sidebar with file list and text input
 */

import { memo, useRef, useCallback, useMemo, useEffect } from 'react';
import { useStore, type FilterStatus } from '@/store/useStore';

/**
 * Generates HTML content for contenteditable with highlighted characters
 * Uses grouped spans (consecutive chars of same type) for proper text rendering
 */
function generateHighlightedHTML(
  text: string,
  invalidIndices: number[],
  unassignedIndices: number[]
): string {
  if (text.length === 0) return '';

  const invalidSet = new Set(invalidIndices);
  const unassignedSet = new Set(unassignedIndices);

  // Group consecutive characters of the same type
  const groups: { text: string; type: 'normal' | 'invalid' | 'unassigned' }[] = [];
  let currentType: 'normal' | 'invalid' | 'unassigned' = 'normal';
  let currentText = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    let charType: 'normal' | 'invalid' | 'unassigned' = 'normal';

    if (invalidSet.has(i)) {
      charType = 'invalid';
    } else if (unassignedSet.has(i)) {
      charType = 'unassigned';
    }

    if (charType === currentType) {
      currentText += char;
    } else {
      if (currentText) {
        groups.push({ text: currentText, type: currentType });
      }
      currentType = charType;
      currentText = char;
    }
  }
  if (currentText) {
    groups.push({ text: currentText, type: currentType });
  }

  // Convert groups to HTML
  return groups.map(group => {
    // Escape HTML special chars and convert newlines/spaces for proper display
    const escaped = group.text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');

    switch (group.type) {
      case 'invalid':
        return `<span class="highlight-invalid">${escaped}</span>`;
      case 'unassigned':
        return `<span class="highlight-unassigned">${escaped}</span>`;
      default:
        return `<span class="highlight-normal">${escaped}</span>`;
    }
  }).join('');
}

/**
 * Extracts plain text from contenteditable element, preserving newlines
 */
function getPlainTextFromElement(element: HTMLElement | DocumentFragment): string {
  let text = '';

  const processNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent || '';
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();

      // Handle line breaks
      if (tagName === 'br') {
        text += '\n';
      } else if (tagName === 'div' || tagName === 'p') {
        // Block elements: add newline before if we have content
        if (text.length > 0 && !text.endsWith('\n')) {
          text += '\n';
        }
        el.childNodes.forEach(processNode);
      } else {
        // Inline elements (spans, etc.)
        el.childNodes.forEach(processNode);
      }
    }
  };

  element.childNodes.forEach(processNode);
  return text;
}

/**
 * Restores cursor position after content update
 */
function restoreCursorPosition(element: HTMLElement, offset: number): void {
  const selection = window.getSelection();
  if (!selection) return;

  let currentOffset = 0;
  let targetNode: Node | null = null;
  let targetOffset = 0;

  const findPosition = (node: Node): boolean => {
    if (node.nodeType === Node.TEXT_NODE) {
      const textLength = (node.textContent || '').length;
      if (currentOffset + textLength >= offset) {
        targetNode = node;
        targetOffset = offset - currentOffset;
        return true;
      }
      currentOffset += textLength;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.tagName.toLowerCase() === 'br') {
        if (currentOffset === offset) {
          targetNode = node;
          targetOffset = 0;
          return true;
        }
        currentOffset += 1;
      } else {
        for (const child of Array.from(el.childNodes)) {
          if (findPosition(child)) return true;
        }
      }
    }
    return false;
  };

  findPosition(element);

  if (targetNode) {
    const range = document.createRange();
    range.setStart(targetNode, targetOffset);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

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
            : 'bg-keposhka-black text-keposhka-cream border-keposhka-cream/40 hover:border-keposhka-red'
        }
      `}
    >
      {label}
      <span className={`ml-1 font-mono ${isActive ? 'text-keposhka-cream/70' : 'text-keposhka-cream/60'}`}>
        [{count}]
      </span>
    </button>
  );
});

export function EditorPanel() {
  const editableRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);

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
    saveDraft,
    skipToNextPending,
    clearSaveResult,
    setCursorPosition,
    cursorPosition,
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
      const isInTextField =
        activeElement?.tagName === 'TEXTAREA' ||
        (activeElement?.tagName === 'INPUT' && (activeElement as HTMLInputElement).type === 'text') ||
        (activeElement as HTMLElement)?.isContentEditable;
      if (isInTextField) {
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
    // Reset scroll when changing images
    if (editableRef.current) {
      editableRef.current.scrollTop = 0;
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

  const canSaveDraft = useMemo(() => {
    if (!currentImage) return false;
    return boxes.length > 0 || inputText.trim() !== '';
  }, [currentImage, boxes.length, inputText]);

  const handleSkip = useCallback(async () => {
    // Save as draft if there's content to save
    if (canSaveDraft && !isSaving) {
      await saveDraft();
    } else {
      skipToNextPending();
    }
  }, [canSaveDraft, isSaving, saveDraft, skipToNextPending]);

  const handleImageSelect = (image: (typeof images)[0]) => {
    selectImage(image);
  };

  const handleInput = useCallback(() => {
    if (isComposingRef.current) return;
    if (editableRef.current) {
      const newText = getPlainTextFromElement(editableRef.current);
      setInputText(newText);
    }
  }, [setInputText]);

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(() => {
    isComposingRef.current = false;
    handleInput();
  }, [handleInput]);

  // Save cursor position when selection changes or on blur
  const saveCursorPosition = useCallback(() => {
    if (!editableRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    if (!editableRef.current.contains(selection.anchorNode)) return;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editableRef.current);
    preCaretRange.setEnd(range.startContainer, range.startOffset);
    const cursorOffset = getPlainTextFromElement(preCaretRange.cloneContents() as unknown as HTMLElement).length;

    setCursorPosition(cursorOffset);
  }, [setCursorPosition]);

  const handleBlur = useCallback(() => {
    saveCursorPosition();
  }, [saveCursorPosition]);

  const handleSelect = useCallback(() => {
    saveCursorPosition();
  }, [saveCursorPosition]);

  // Sync contenteditable content when inputText changes externally (e.g., loading annotation, reference panel)
  useEffect(() => {
    if (editableRef.current) {
      // Get current text from the element
      const currentText = getPlainTextFromElement(editableRef.current);
      // Only update if text is different (to preserve cursor position when typing)
      if (currentText !== inputText) {
        // Save selection state
        const selection = window.getSelection();
        const hadFocus = document.activeElement === editableRef.current;

        // Update HTML content
        editableRef.current.innerHTML = generateHighlightedHTML(
          inputText,
          validation.invalidCharIndices,
          validation.unassignedTextIndices
        );

        // Restore focus and cursor position
        if (hadFocus && selection) {
          editableRef.current.focus();
          // Move cursor to end
          const range = document.createRange();
          range.selectNodeContents(editableRef.current);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        } else if (cursorPosition !== null) {
          // Text changed externally (e.g., from reference panel) - restore cursor to saved position
          editableRef.current.focus();
          try {
            restoreCursorPosition(editableRef.current, cursorPosition);
          } catch {
            // If restoration fails, move to end
            const range = document.createRange();
            range.selectNodeContents(editableRef.current);
            range.collapse(false);
            window.getSelection()?.removeAllRanges();
            window.getSelection()?.addRange(range);
          }
        }
      } else {
        // Text is same, just update highlighting while preserving cursor
        const selection = window.getSelection();
        let cursorOffset = 0;

        // Calculate cursor offset in plain text
        if (selection && selection.rangeCount > 0 && editableRef.current.contains(selection.anchorNode)) {
          const range = selection.getRangeAt(0);
          const preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(editableRef.current);
          preCaretRange.setEnd(range.startContainer, range.startOffset);
          cursorOffset = getPlainTextFromElement(preCaretRange.cloneContents() as unknown as HTMLElement).length;
        }

        // Update HTML
        editableRef.current.innerHTML = generateHighlightedHTML(
          inputText,
          validation.invalidCharIndices,
          validation.unassignedTextIndices
        );

        // Restore cursor position
        if (selection && document.activeElement === editableRef.current) {
          try {
            restoreCursorPosition(editableRef.current, cursorOffset);
          } catch {
            // If restoration fails, just move to end
            const range = document.createRange();
            range.selectNodeContents(editableRef.current);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      }
    }
  }, [inputText, validation.invalidCharIndices, validation.unassignedTextIndices]);

  const statusMessage = useMemo(() => {
    if (!currentImage) {
      return { text: 'SELECT FILE', color: 'text-keposhka-steel', icon: '>' };
    }
    if (boxes.length === 0) {
      return { text: 'DRAW BOXES', color: 'text-keposhka-steel', icon: '□' };
    }
    if (validation.invalidCharIndices.length > 0) {
      return {
        text: `ERROR: ${validation.invalidCharIndices.length} INVALID CHARACTER(S)`,
        color: 'text-keposhka-red',
        icon: '!',
      };
    }
    if (!validation.isBalanced) {
      const diff = validation.textCharCount - validation.boxCharCount;
      if (diff > 0) {
        return { text: `EXCESS: +${diff} CHARACTERS`, color: 'text-amber-500', icon: '+' };
      } else {
        return { text: `DEFICIT: ${Math.abs(diff)} CHARACTERS`, color: 'text-amber-500', icon: '-' };
      }
    }
    return { text: 'READY TO SAVE', color: 'text-green-500', icon: '✓' };
  }, [currentImage, boxes.length, validation]);

  return (
    <div className="h-full w-80 bg-keposhka-concrete border-r-4 border-keposhka-black flex flex-col noise-overlay">
      {/* REGIME HEADER */}
      <div className="panel-header relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-xl tracking-[0.25em] leading-none">KEPOSHKA</h1>
          <p className="text-[10px] tracking-[0.3em] text-keposhka-cream/60 mt-0.5">
            LABELING SYSTEM // DRAAG
          </p>
        </div>
        {/* Diagonal stripes overlay */}
        <div className="absolute inset-0 bg-diagonal-stripes opacity-30" />
      </div>

      {/* ARCHIVO SECTION */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {/* Search & Filter - Industrial Control Panel */}
        <div className="p-3 border-b-2 border-keposhka-cream/20 bg-keposhka-black/50 space-y-3">
          {/* Section label */}
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-keposhka-cream/30" />
            <span className="text-[10px] font-heading uppercase tracking-[0.2em] text-keposhka-cream/80">
              IMAGE FILES
            </span>
            <div className="h-px flex-1 bg-keposhka-cream/30" />
          </div>

          {/* Search Input - Brutal style */}
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH..."
              className="
                w-full pl-8 pr-8 py-2 text-sm font-mono uppercase
                bg-keposhka-black text-keposhka-cream
                border-2 border-keposhka-cream/30
                placeholder:text-keposhka-cream/40
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
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-keposhka-cream/70 hover:text-keposhka-red"
              >
                <span className="font-mono text-xs">×</span>
              </button>
            )}
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-1">
            <FilterButton label="ALL" value="all" current={filterStatus} count={statusCounts.all} onClick={setFilterStatus} />
            <FilterButton label="DONE" value="done" current={filterStatus} count={statusCounts.done} onClick={setFilterStatus} />
            <FilterButton label="PEND." value="pending" current={filterStatus} count={statusCounts.pending} onClick={setFilterStatus} />
          </div>
        </div>

        {/* File List - Dossier style */}
        <div ref={listRef} className="flex-1 overflow-y-auto bg-keposhka-black/30">
          {isLoadingAnnotation && (
            <div className="flex items-center justify-center py-4 gap-2">
              <div className="w-3 h-3 border-2 border-keposhka-red border-t-transparent animate-spin" />
              <span className="text-xs font-mono text-keposhka-cream/80 uppercase">Loading data...</span>
            </div>
          )}
          {filteredImages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl text-keposhka-cream/30 mb-2">∅</div>
              <span className="text-xs font-mono text-keposhka-cream/60 uppercase">
                {images.length === 0 ? 'NO FILES' : 'NO RESULTS'}
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
                    <span className={`text-[10px] w-6 ${isActive ? 'text-keposhka-cream/50' : 'text-keposhka-cream/40'}`}>
                      {String(index + 1).padStart(3, '0')}
                    </span>
                    {/* Filename */}
                    <span className="flex-1 truncate uppercase tracking-wide">
                      {image.filename}
                    </span>
                    {/* Status indicator */}
                    <span className={`text-sm font-bold ${isActive ? 'text-keposhka-white' : isDone ? 'text-green-500' : 'text-keposhka-cream/40'}`}>
                      {isDone ? '✓' : '○'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Navigation hint - industrial */}
        <div className="px-3 py-2 border-t-2 border-keposhka-cream/20 bg-keposhka-black/50">
          <p className="text-[10px] text-keposhka-cream/70 text-center font-mono">
            <kbd className="px-1.5 py-0.5 bg-keposhka-cream/10 border border-keposhka-cream/40 text-keposhka-cream">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-keposhka-cream/10 border border-keposhka-cream/40 text-keposhka-cream ml-1">↓</kbd>
            <span className="ml-2 uppercase">Navigate</span>
          </p>
        </div>
      </div>

      {/* TRADUCCIÓN SECTION */}
      <div className="border-t-4 border-keposhka-red bg-keposhka-black">
        {/* Section header */}
        <div className="px-4 py-2 bg-keposhka-red/20 border-b border-keposhka-red/50 flex items-center justify-between">
          <span className="text-xs font-heading uppercase tracking-[0.2em] text-keposhka-red">
            TRANSLATION FIELD
          </span>
          {/* Character count */}
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="px-2 py-0.5 bg-keposhka-black border border-keposhka-cream/40 text-keposhka-cream">
              TXT:{validation.textCharCount}
            </span>
            <span className="px-2 py-0.5 bg-keposhka-black border border-keposhka-cream/40 text-keposhka-cream">
              BOX:{validation.boxCharCount}
            </span>
          </div>
        </div>

        {/* Editable text field with inline highlighting */}
        <div className="p-3">
          <div className="relative">
            <div
              ref={editableRef}
              contentEditable
              onInput={handleInput}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              onBlur={handleBlur}
              onSelect={handleSelect}
              data-placeholder="ENTER TRANSLATED TEXT..."
              spellCheck={false}
              className="
                w-full h-28 px-3 py-2 text-sm font-mono
                bg-keposhka-black/50 text-keposhka-cream
                border-2 border-keposhka-cream/30
                focus:outline-none focus:border-keposhka-red
                overflow-y-auto whitespace-pre-wrap break-words
                editable-placeholder
              "
              style={{ caretColor: 'var(--keposhka-red)' }}
            />
          </div>

          {/* Status and help */}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-keposhka-cream/60 font-mono uppercase">
              Enter = New Line
            </span>
            <span className={`text-xs font-heading uppercase tracking-wider flex items-center gap-1 ${statusMessage.color}`}>
              <span className="font-mono">[{statusMessage.icon}]</span>
              {statusMessage.text}
            </span>
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center gap-4 text-[10px] font-mono uppercase">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-keposhka-red border border-keposhka-red"></span>
              <span className="text-keposhka-cream/70">Invalid</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-amber-500 border border-amber-500"></span>
              <span className="text-keposhka-cream/70">Unassigned</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-600/60 border border-green-600"></span>
              <span className="text-keposhka-cream/70">Assigned</span>
            </span>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS - Regime style */}
      <div className="p-3 border-t-2 border-keposhka-cream/20 bg-keposhka-black space-y-2">
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
              <span>PROCESSING...</span>
            </>
          ) : (
            <>
              <span>COMPLETE</span>
              <span className="text-xs font-mono text-keposhka-cream/50">[SHIFT+ENTER]</span>
            </>
          )}
        </button>

        {/* Skip/Save Draft button - Secondary */}
        <button
          onClick={handleSkip}
          disabled={isSaving}
          className="
            w-full px-4 py-2 font-heading text-sm uppercase tracking-wider
            bg-keposhka-black text-keposhka-cream
            border-2 border-keposhka-cream/40
            hover:border-keposhka-red hover:text-keposhka-red
            transition-colors duration-100
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {canSaveDraft ? 'SAVE DRAFT → NEXT' : 'SKIP → NEXT PENDING'}
        </button>
      </div>
    </div>
  );
}
