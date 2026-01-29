/**
 * Editor Panel Component
 * Left sidebar with file list and text input
 */

import { useStore } from '@/store/useStore';

export function EditorPanel() {
  const { inputText, setInputText, images, currentImage, setCurrentImage } = useStore();

  const handleImageSelect = (image: typeof images[0]) => {
    setCurrentImage(image);
    // TODO: Load existing annotations if available
  };

  return (
    <div className="h-full w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Keposhka Labeler</h2>
      </div>

      {/* Image List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="mb-2 px-2">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Imágenes</h3>
          {/* TODO: Add filter buttons (All/Done/Pending) */}
          {/* TODO: Add search input */}
        </div>

        <div className="space-y-1">
          {images.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-8">
              No hay imágenes
            </div>
          ) : (
            images.map((image) => (
              <button
                key={image.filename}
                onClick={() => handleImageSelect(image)}
                className={`
                  w-full text-left px-3 py-2 rounded-md text-sm
                  transition-colors
                  ${
                    currentImage?.filename === image.filename
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-100 text-gray-900'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate flex-1">{image.filename}</span>
                  <span className="ml-2">
                    {image.status === 'done' ? '✓' : '○'}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Text Input Area */}
      <div className="p-4 border-t border-gray-200">
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Traducción
        </label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Escriba la traducción..."
          className="
            w-full h-32 px-3 py-2 text-sm text-gray-900
            bg-white border border-gray-300 rounded-md
            focus:outline-none focus:ring-2 focus:ring-blue-500
            resize-none
          "
        />
        <div className="mt-2 text-xs text-gray-500">
          Enter: nueva línea | Shift+Enter: Guardar
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button
          className="
            w-full px-4 py-2 text-sm font-medium
            bg-blue-600 text-white
            rounded-md hover:bg-blue-700
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          disabled
        >
          Completar
        </button>
        <button
          className="
            w-full px-4 py-2 text-sm font-medium
            bg-gray-200 text-gray-900
            rounded-md hover:bg-gray-300
          "
        >
          Dejar Pendiente
        </button>
      </div>
    </div>
  );
}
