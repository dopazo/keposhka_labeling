/**
 * BoxContextMenu - DRAAG REGIME EDITION
 * Brutalist context menu for setting box charCount (digraphs)
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
    { value: 1, label: '1 CARÁCTER', description: 'LETRA SIMPLE', code: 'A, b, 5...' },
    { value: 2, label: '2 CARACTERES', description: 'DÍGRAFO', code: 'CH, sh, TH...' },
    { value: 3, label: '3 CARACTERES', description: 'TRÍGRAFO', code: 'RARO' },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-50"
      style={{ left: x, top: y }}
    >
      <div className="
        min-w-[220px] overflow-hidden
        bg-keposhka-black border-2 border-keposhka-red
        shadow-brutal
      ">
        {/* Header - Regime style */}
        <div className="px-3 py-2 bg-keposhka-red border-b-2 border-keposhka-black">
          <span className="text-xs font-display uppercase tracking-[0.15em] text-keposhka-white">
            CLASIFICACIÓN DE SECTOR
          </span>
        </div>

        {/* Options */}
        <div className="py-1">
          {options.map((option) => {
            const isSelected = currentCharCount === option.value;
            return (
              <button
                key={option.value}
                onClick={() => {
                  onSelect(option.value);
                  onClose();
                }}
                className={`
                  w-full px-3 py-2 text-left
                  border-l-4 transition-all duration-75
                  ${isSelected
                    ? 'bg-keposhka-red/30 border-l-keposhka-red text-keposhka-cream'
                    : 'border-l-transparent text-keposhka-cream/80 hover:bg-keposhka-steel/50 hover:border-l-keposhka-red/50'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-heading uppercase tracking-wider">
                      {option.label}
                    </span>
                    <span className="text-[10px] font-mono text-keposhka-steel">
                      {option.description} — {option.code}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 bg-keposhka-red flex items-center justify-center">
                      <span className="text-keposhka-white text-xs font-bold">✓</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="px-3 py-2 bg-keposhka-steel/30 border-t border-keposhka-steel">
          <span className="text-[9px] font-mono text-keposhka-steel uppercase">
            ESC para cerrar // Click fuera para cancelar
          </span>
        </div>
      </div>
    </div>
  );
});
