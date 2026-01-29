/**
 * Reference Panel Component
 * Shows the Keposhka alphabet reference image
 */

export function ReferencePanel() {
  return (
    <div className="h-full w-full bg-gray-50 border-l border-gray-200 flex items-center justify-center">
      <div className="text-center p-8">
        <div className="mb-4 text-6xl opacity-20">📖</div>
        <h3 className="text-lg font-semibold text-gray-600 mb-2">
          Panel de Referencia
        </h3>
        <p className="text-sm text-gray-500">
          Imagen del alfabeto Keposhka
        </p>
        <p className="text-xs text-gray-400 mt-1">
          (Pendiente)
        </p>
        {/*
          When alphabet image is available:
          <img
            src="/reference/alphabet.png"
            alt="Keposhka Alphabet"
            className="max-w-full h-auto"
          />
        */}
      </div>
    </div>
  );
}
