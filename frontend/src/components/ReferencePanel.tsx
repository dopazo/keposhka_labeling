/**
 * Reference Panel Component - DRAAG REGIME EDITION
 * Brutalist aesthetic - Shows Keposhka alphabet reference
 */

import { KEPOSHKA_ALPHABET, DIGRAPHS } from '@/lib/validator';

export function ReferencePanel() {
  // Group alphabet into sections for display
  const numbers = KEPOSHKA_ALPHABET.slice(0, 10);
  const letters = KEPOSHKA_ALPHABET.slice(10).filter(char => !DIGRAPHS.includes(char));
  const digraphs = DIGRAPHS;

  return (
    <div className="h-full w-full bg-keposhka-concrete border-l-4 border-keposhka-black flex flex-col noise-overlay">
      {/* REGIME HEADER */}
      <div className="panel-header relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-keposhka-black flex items-center justify-center border border-keposhka-cream/20">
              <span className="font-display text-keposhka-cream text-sm">Aa</span>
            </div>
            <div>
              <h2 className="text-lg tracking-[0.2em] leading-none">REFERENCIA</h2>
              <p className="text-[10px] tracking-[0.2em] text-keposhka-cream/60 mt-0.5">
                ALFABETO KEPOSHKA
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Numbers Section */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-heading uppercase tracking-[0.15em] text-keposhka-red">
              NÚMEROS
            </span>
            <div className="h-px flex-1 bg-keposhka-steel" />
            <span className="text-[10px] font-mono text-keposhka-steel">[0-9]</span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {numbers.map((char, idx) => (
              <div
                key={char}
                className="
                  aspect-square flex flex-col items-center justify-center
                  bg-keposhka-black border-2 border-keposhka-steel
                  hover:border-keposhka-red transition-colors
                  group
                "
              >
                <span className="font-mono text-lg text-keposhka-cream group-hover:text-keposhka-red transition-colors">
                  {char}
                </span>
                <span className="text-[8px] font-mono text-keposhka-steel">
                  {String(idx).padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Digraphs Section - Important */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-heading uppercase tracking-[0.15em] text-keposhka-red">
              DÍGRAFOS
            </span>
            <div className="h-px flex-1 bg-keposhka-steel" />
            <span className="text-[10px] font-mono text-keposhka-steel">[2 CHARS]</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {digraphs.map((char) => {
              const idx = KEPOSHKA_ALPHABET.indexOf(char);
              return (
                <div
                  key={char}
                  className="
                    py-2 flex flex-col items-center justify-center
                    bg-keposhka-red/20 border-2 border-keposhka-red
                    hover:bg-keposhka-red/40 transition-colors
                    group
                  "
                >
                  <span className="font-mono text-base text-keposhka-cream font-bold">
                    {char}
                  </span>
                  <span className="text-[8px] font-mono text-keposhka-red">
                    {String(idx).padStart(2, '0')}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] font-mono text-keposhka-steel uppercase">
            ◆ Clic derecho en caja → marcar como dígrafo
          </p>
        </section>

        {/* Letters Section */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-heading uppercase tracking-[0.15em] text-keposhka-red">
              LETRAS
            </span>
            <div className="h-px flex-1 bg-keposhka-steel" />
            <span className="text-[10px] font-mono text-keposhka-steel">[A-Z]</span>
          </div>
          <div className="grid grid-cols-6 gap-1">
            {letters.map((char) => {
              const idx = KEPOSHKA_ALPHABET.indexOf(char);
              const isUppercase = char === char.toUpperCase() && char !== char.toLowerCase();
              return (
                <div
                  key={`${char}-${idx}`}
                  className={`
                    aspect-square flex flex-col items-center justify-center
                    border-2 transition-colors group
                    ${isUppercase
                      ? 'bg-keposhka-steel/30 border-keposhka-steel hover:border-keposhka-red'
                      : 'bg-keposhka-black border-keposhka-steel/50 hover:border-keposhka-red/70'
                    }
                  `}
                >
                  <span className={`
                    font-mono text-sm transition-colors
                    ${isUppercase
                      ? 'text-keposhka-cream group-hover:text-keposhka-red'
                      : 'text-keposhka-cream/70 group-hover:text-keposhka-red/80'
                    }
                  `}>
                    {char}
                  </span>
                  <span className="text-[7px] font-mono text-keposhka-steel">
                    {String(idx).padStart(2, '0')}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Image placeholder - for when alphabet image is available */}
        <section className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-heading uppercase tracking-[0.15em] text-keposhka-steel">
              IMAGEN DE REFERENCIA
            </span>
            <div className="h-px flex-1 bg-keposhka-steel" />
          </div>
          <div className="
            aspect-video bg-keposhka-black/50 border-2 border-dashed border-keposhka-steel
            flex flex-col items-center justify-center
          ">
            <div className="text-3xl text-keposhka-steel/30 mb-2">☐</div>
            <span className="text-[10px] font-mono text-keposhka-steel uppercase">
              /reference/alphabet.png
            </span>
            <span className="text-[9px] font-mono text-keposhka-steel/50 mt-1">
              [PENDIENTE]
            </span>
          </div>
        </section>
      </div>

      {/* FOOTER - Classification stamp */}
      <div className="p-3 border-t-2 border-keposhka-steel bg-keposhka-black/50">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase">
          <span className="text-keposhka-steel">
            CLASIFICACIÓN: PÚBLICO
          </span>
          <span className="text-keposhka-red flex items-center gap-1">
            <span className="font-display">◆</span>
            DRAAG CULTURAL DEPT.
          </span>
        </div>
      </div>
    </div>
  );
}
