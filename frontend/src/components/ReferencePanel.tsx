/**
 * Reference Panel Component - DRAAG REGIME EDITION
 * Shows keyboard → Keposhka character mapping
 */

import { KEPOSHKA_ALPHABET, DIGRAPHS } from '@/lib/validator';

// Mapping of keyboard characters to Keposhka font characters
// For digraphs, we use special characters in the font
const KEYBOARD_TO_KEPOSHKA_MAP = {
  // Numbers - direct mapping
  '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
  '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',

  // Letters - direct mapping
  'A': 'A', 'a': 'a', 'B': 'B', 'b': 'b', 'C': 'C', 'c': 'c',
  'D': 'D', 'd': 'd', 'E': 'E', 'e': 'e', 'F': 'F', 'f': 'f',
  'G': 'G', 'g': 'g', 'H': 'H', 'h': 'h', 'I': 'I', 'i': 'i',
  'J': 'J', 'j': 'j', 'K': 'K', 'k': 'k', 'L': 'L', 'l': 'l',
  'M': 'M', 'm': 'm', 'N': 'N', 'n': 'n', 'O': 'O', 'o': 'o',
  'P': 'P', 'p': 'p', 'Q': 'Q', 'q': 'q', 'R': 'R', 'r': 'r',
  'S': 'S', 's': 's', 'T': 'T', 't': 't', 'U': 'U', 'u': 'u',
  'V': 'V', 'v': 'v', 'W': 'W', 'w': 'w', 'X': 'X', 'x': 'x',
  'Y': 'Y', 'y': 'y', 'Z': 'Z', 'z': 'z',

  // Digraphs - special characters mapping
  '(': '(', // CH
  ')': ')', // ch
  '[': '[', // GH
  '\\': '\\', // gh
  ']': ']', // SH
  '{': '{', // sh
  '|': '|', // TH
  '}': '}', // th
} as const;

// Map keyboard characters to their label equivalents
const KEYBOARD_TO_LABEL = {
  '[': 'TH',
  ']': 'th',
  '{': 'SH',
  '}': 'sh',
  '(': 'CH',
  ')': 'ch',
  '\\': 'GH',
  '|': 'gh',
} as const;

export function ReferencePanel() {
  // Group characters
  const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const uppercaseLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const lowercaseLetters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const digraphKeys = ['[', ']', '{', '}', '(', ')', '\\', '|'];

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
        {/* Uppercase Letters Section */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-heading uppercase tracking-[0.15em] text-keposhka-red">
              MAYÚSCULAS
            </span>
            <div className="h-px flex-1 bg-keposhka-steel" />
            <span className="text-[10px] font-mono text-keposhka-steel">[A-Z]</span>
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {uppercaseLetters.map((key) => {
              const idx = KEPOSHKA_ALPHABET.indexOf(key);
              return (
                <div
                  key={key}
                  className="
                    bg-keposhka-steel/30 border border-keposhka-steel
                    hover:border-keposhka-red transition-colors
                    p-1.5 flex flex-col items-center gap-0.5
                  "
                >
                  <div className="font-mono text-xs text-keposhka-cream/60">
                    {key}
                  </div>
                  <div className="font-['Keposhka'] text-2xl text-keposhka-cream leading-none">
                    {KEYBOARD_TO_KEPOSHKA_MAP[key as keyof typeof KEYBOARD_TO_KEPOSHKA_MAP]}
                  </div>
                  <div className="text-[7px] font-mono text-keposhka-steel">
                    {String(idx).padStart(2, '0')}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Lowercase Letters Section */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-heading uppercase tracking-[0.15em] text-keposhka-red">
              MINÚSCULAS
            </span>
            <div className="h-px flex-1 bg-keposhka-steel" />
            <span className="text-[10px] font-mono text-keposhka-steel">[a-z]</span>
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {lowercaseLetters.map((key) => {
              const idx = KEPOSHKA_ALPHABET.indexOf(key);
              return (
                <div
                  key={key}
                  className="
                    bg-keposhka-black border border-keposhka-steel/50
                    hover:border-keposhka-red/70 transition-colors
                    p-1.5 flex flex-col items-center gap-0.5
                  "
                >
                  <div className="font-mono text-xs text-keposhka-cream/50">
                    {key}
                  </div>
                  <div className="font-['Keposhka'] text-2xl text-keposhka-cream/80 leading-none">
                    {KEYBOARD_TO_KEPOSHKA_MAP[key as keyof typeof KEYBOARD_TO_KEPOSHKA_MAP]}
                  </div>
                  <div className="text-[7px] font-mono text-keposhka-steel">
                    {String(idx).padStart(2, '0')}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Digraphs Section */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-heading uppercase tracking-[0.15em] text-keposhka-red">
              DÍGRAFOS
            </span>
            <div className="h-px flex-1 bg-keposhka-steel" />
            <span className="text-[10px] font-mono text-keposhka-steel">[2 CHARS]</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {digraphKeys.map((key) => {
              const label = KEYBOARD_TO_LABEL[key as keyof typeof KEYBOARD_TO_LABEL];
              const idx = KEPOSHKA_ALPHABET.indexOf(label);
              return (
                <div
                  key={key}
                  className="
                    bg-keposhka-red/20 border-2 border-keposhka-red
                    hover:bg-keposhka-red/40 transition-colors
                    p-3 flex flex-col items-center justify-center gap-2
                  "
                >
                  <div className="flex items-center gap-3 whitespace-nowrap">
                    <div className="font-mono text-base text-keposhka-cream font-bold min-w-[2rem]">
                      {label}
                    </div>
                    <div className="text-keposhka-cream/60 text-sm">→</div>
                    <div className="font-['Keposhka'] text-3xl text-keposhka-cream leading-none">
                      {KEYBOARD_TO_KEPOSHKA_MAP[key as keyof typeof KEYBOARD_TO_KEPOSHKA_MAP]}
                    </div>
                  </div>
                  <div className="text-[8px] font-mono text-keposhka-red">
                    ID: {String(idx).padStart(2, '0')}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] font-mono text-keposhka-steel uppercase leading-relaxed">
            → Clic derecho en caja para marcar como dígrafo (charCount=2)
          </p>
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
            {numbers.map((key) => {
              const idx = KEPOSHKA_ALPHABET.indexOf(key);
              return (
                <div
                  key={key}
                  className="
                    bg-keposhka-black border-2 border-keposhka-steel
                    hover:border-keposhka-red transition-colors
                    p-2 flex flex-col items-center gap-1
                  "
                >
                  <div className="font-mono text-sm text-keposhka-cream/60">
                    {key}
                  </div>
                  <div className="font-['Keposhka'] text-3xl text-keposhka-cream leading-none">
                    {KEYBOARD_TO_KEPOSHKA_MAP[key as keyof typeof KEYBOARD_TO_KEPOSHKA_MAP]}
                  </div>
                  <div className="text-[8px] font-mono text-keposhka-steel mt-1">
                    ID: {String(idx).padStart(2, '0')}
                  </div>
                </div>
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
