/**
 * BoxContextMenu - Right-click context menu for setting box charCount
 * Phase 4: UI de Etiquetado
 * Phase 7: Memoized for performance
 *
 * Allows users to mark boxes as digraphs/trigraphs (1/2/3 characters)
 */

import { memo, useEffect, useRef } from 'react';

interface BoxContextMenuProps {
  x: number;
  y: number;
  currentCharCount: number;
  onSelect: (charCount: number) => void;
  onClose: () => void;
}

export const BoxContextMenu = memo(function BoxContextMenu({
  x,
  y,
  currentCharCount,
  onSelect,
  onClose,
}: BoxContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Delay adding listeners to prevent immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const options = [
    { value: 1, label: '1 carácter', description: 'Letra simple (A, b, 5...)' },
    { value: 2, label: '2 caracteres', description: 'Dígrafo (CH, sh, TH...)' },
    { value: 3, label: '3 caracteres', description: 'Trígrafo (raro)' },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-50 animate-in fade-in-0 zoom-in-95 duration-100"
      style={{
        left: x,
        top: y,
      }}
    >
      <div
        className="
          min-w-[200px] rounded-lg overflow-hidden
          bg-gray-900/95 backdrop-blur-sm
          border border-gray-700/50
          shadow-2xl shadow-black/50
        "
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-gray-700/50 bg-gray-800/50">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Caracteres por caja
          </span>
        </div>

        {/* Options */}
        <div className="py-1">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onSelect(option.value);
                onClose();
              }}
              className={`
                w-full px-3 py-2 text-left
                flex items-center justify-between gap-3
                transition-colors duration-75
                ${
                  currentCharCount === option.value
                    ? 'bg-indigo-600/30 text-indigo-300'
                    : 'text-gray-200 hover:bg-gray-700/50'
                }
              `}
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{option.label}</span>
                <span className="text-xs text-gray-500">{option.description}</span>
              </div>
              {currentCharCount === option.value && (
                <svg
                  className="w-4 h-4 text-indigo-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div className="px-3 py-2 border-t border-gray-700/50 bg-gray-800/30">
          <span className="text-[10px] text-gray-500">
            Clic derecho en caja para cambiar
          </span>
        </div>
      </div>
    </div>
  );
});
