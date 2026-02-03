/**
 * Reference Panel Component - DRAAG REGIME EDITION
 * Shows keyboard → Keposhka character mapping
 * Click on any character to add it to the translation field
 */

import { KEPOSHKA_ALPHABET } from '@/lib/validator';
import { useStore } from '@/store/useStore';

// Map label to Keposhka font character (for digraphs)
const LABEL_TO_KEPOSHKA = {
  'CH': '(', 'ch': ')',
  'TH': '[', 'th': ']',
  'SH': '{', 'sh': '}',
  'GH': '\\', 'gh': '|',
} as const;

// Get Keposhka font character for any label
const getKeposhkaChar = (label: string): string => {
  if (label in LABEL_TO_KEPOSHKA) {
    return LABEL_TO_KEPOSHKA[label as keyof typeof LABEL_TO_KEPOSHKA];
  }
  return label; // Single letters map directly
};

export function ReferencePanel() {
  const { inputText, setInputText } = useStore();

  // Handler to append character to translation field
  const handleCharClick = (label: string) => {
    setInputText(inputText + label);
  };

  // Group characters - includes digraphs in correct order by ID
  const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  // Uppercase with digraphs in order: A, B, C, CH, D, E, F, G, GH, H...S, SH, T, TH, U...Z
  const uppercaseWithDigraphs = [
    'A', 'B', 'C', 'CH', 'D', 'E', 'F', 'G', 'GH', 'H', 'I', 'J', 'K', 'L',
    'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'SH', 'T', 'TH', 'U', 'V', 'W', 'X', 'Y', 'Z'
  ];
  // Lowercase with digraphs in order: a, b, c, ch, d, e, f, g, gh, h...s, sh, t, th, u...z
  const lowercaseWithDigraphs = [
    'a', 'b', 'c', 'ch', 'd', 'e', 'f', 'g', 'gh', 'h', 'i', 'j', 'k', 'l',
    'm', 'n', 'o', 'p', 'q', 'r', 's', 'sh', 't', 'th', 'u', 'v', 'w', 'x', 'y', 'z'
  ];

  return (
    <div className="h-full w-full bg-keposhka-concrete border-l-4 border-keposhka-black flex flex-col noise-overlay">
      {/* REGIME HEADER */}
      <div className="panel-header relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-keposhka-black flex items-center justify-center border border-keposhka-cream/20">
              <span className="font-display text-keposhka-cream text-sm">⌨</span>
            </div>
            <div>
              <h2 className="text-lg tracking-[0.2em] leading-none">REFERENCIA</h2>
              <p className="text-[10px] tracking-[0.2em] text-keposhka-cream/60 mt-0.5">
                MAPEO TECLADO → KEPOSHKA
              </p>
            </div>
          </div>
          {/* Classification badge */}
          <div className="px-2 py-1 bg-keposhka-black border border-keposhka-cream/30 text-[8px] font-mono tracking-wider">
            70 CLASES
          </div>
        </div>
        <div className="absolute inset-0 bg-diagonal-stripes opacity-30" />
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Uppercase Letters Section (includes digraphs) */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-heading uppercase tracking-[0.15em] text-keposhka-red">
              MAYÚSCULAS
            </span>
            <div className="h-px flex-1 bg-keposhka-steel" />
            <span className="text-[10px] font-mono text-keposhka-steel">[A-Z]</span>
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {uppercaseWithDigraphs.map((label) => {
              const idx = KEPOSHKA_ALPHABET.indexOf(label);
              const isDigraph = label.length > 1;
              return (
                <button
                  key={label}
                  onClick={() => handleCharClick(label)}
                  className="
                    bg-keposhka-steel/30 border border-keposhka-steel
                    hover:border-keposhka-red hover:bg-keposhka-red/20 transition-colors
                    p-1.5 flex flex-col items-center gap-0.5 cursor-pointer
                    active:bg-keposhka-red/40 active:scale-95
                  "
                >
                  <div className={`font-mono text-keposhka-cream/60 ${isDigraph ? 'text-[10px]' : 'text-xs'}`}>
                    {label}
                  </div>
                  <div className="font-['Keposhka'] text-2xl text-keposhka-cream leading-none">
                    {getKeposhkaChar(label)}
                  </div>
                  <div className="text-[8px] font-mono text-keposhka-cream/50">
                    {String(idx).padStart(2, '0')}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Lowercase Letters Section (includes digraphs) */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-heading uppercase tracking-[0.15em] text-keposhka-red">
              MINÚSCULAS
            </span>
            <div className="h-px flex-1 bg-keposhka-steel" />
            <span className="text-[10px] font-mono text-keposhka-steel">[a-z]</span>
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {lowercaseWithDigraphs.map((label) => {
              const idx = KEPOSHKA_ALPHABET.indexOf(label);
              const isDigraph = label.length > 1;
              return (
                <button
                  key={label}
                  onClick={() => handleCharClick(label)}
                  className="
                    bg-keposhka-black border border-keposhka-steel/50
                    hover:border-keposhka-red/70 hover:bg-keposhka-red/20 transition-colors
                    p-1.5 flex flex-col items-center gap-0.5 cursor-pointer
                    active:bg-keposhka-red/40 active:scale-95
                  "
                >
                  <div className={`font-mono text-keposhka-cream/50 ${isDigraph ? 'text-[10px]' : 'text-xs'}`}>
                    {label}
                  </div>
                  <div className="font-['Keposhka'] text-2xl text-keposhka-cream/80 leading-none">
                    {getKeposhkaChar(label)}
                  </div>
                  <div className="text-[8px] font-mono text-keposhka-cream/50">
                    {String(idx).padStart(2, '0')}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Numbers Section */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-heading uppercase tracking-[0.15em] text-keposhka-red">
              NÚMEROS
            </span>
            <div className="h-px flex-1 bg-keposhka-steel" />
            <span className="text-[10px] font-mono text-keposhka-steel">[0-9]</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {numbers.map((label) => {
              const idx = KEPOSHKA_ALPHABET.indexOf(label);
              return (
                <button
                  key={label}
                  onClick={() => handleCharClick(label)}
                  className="
                    bg-keposhka-black border-2 border-keposhka-steel
                    hover:border-keposhka-red hover:bg-keposhka-red/20 transition-colors
                    p-2 flex flex-col items-center gap-1 cursor-pointer
                    active:bg-keposhka-red/40 active:scale-95
                  "
                >
                  <div className="font-mono text-sm text-keposhka-cream/60">
                    {label}
                  </div>
                  <div className="font-['Keposhka'] text-3xl text-keposhka-cream leading-none">
                    {getKeposhkaChar(label)}
                  </div>
                  <div className="text-[8px] font-mono text-keposhka-cream/50 mt-1">
                    {String(idx).padStart(2, '0')}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* FOOTER - Classification stamp */}
      <div className="p-3 border-t-2 border-keposhka-steel bg-keposhka-black/50">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase">
          <span className="text-keposhka-steel">
            CLASIFICACIÓN: PÚBLICO
          </span>
          <span className="text-keposhka-red">
            DRAAG CULTURAL DEPT.
          </span>
        </div>
      </div>
    </div>
  );
}
