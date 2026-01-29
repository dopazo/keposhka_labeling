/**
 * StageBoard - Main Canvas Component for Keposhka Labeler
 * Implements Phase 2: Canvas Interactivo + Phase 4: UI de Etiquetado
 *
 * Features:
 * - Image loading with auto-fit
 * - Drawing bounding boxes (mouseDown → mouseMove → mouseUp)
 * - Box selection (click to select)
 * - Box transformation (resize/move via Transformer)
 * - Box deletion (Delete/Backspace keys)
 * - Deselection (Esc key or click on empty area)
 * - Right-click context menu for digraph marking (Phase 4)
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Group, Text } from 'react-konva';
import type Konva from 'konva';
import { useStore } from '@/store/useStore';
import { UrlImage } from './UrlImage';
import { BoxTransformer } from './BoxTransformer';
import { BoxContextMenu } from '../BoxContextMenu';

// Context menu state
interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  boxId: string | null;
}

// Drawing state for creating new boxes
interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export function StageBoard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0, scale: 1 });
  const [drawing, setDrawing] = useState<DrawingState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    boxId: null,
  });

  // Store hooks
  const currentImage = useStore((s) => s.currentImage);
  const boxes = useStore((s) => s.boxes);
  const selectedBoxId = useStore((s) => s.selectedBoxId);
  const addBox = useStore((s) => s.addBox);
  const updateBox = useStore((s) => s.updateBox);
  const deleteBox = useStore((s) => s.deleteBox);
  const setSelectedBoxId = useStore((s) => s.setSelectedBoxId);
  const updateCharCount = useStore((s) => s.updateCharCount);

  // Keep a map of box refs for transformer
  const boxRefs = useRef<Map<string, Konva.Rect>>(new Map());

  // Derive selected node from selectedBoxId (computed during render)
  const selectedNode = useMemo(() => {
    if (!selectedBoxId) return null;
    return boxRefs.current.get(selectedBoxId) || null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBoxId, boxes.length]);

  // Measure container size
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      setContainerSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  // Handle keyboard events for deletion and deselection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if canvas has focus (not typing in textarea)
      const activeElement = document.activeElement;
      if (activeElement?.tagName === 'TEXTAREA' || activeElement?.tagName === 'INPUT') {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedBoxId) {
          deleteBox(selectedBoxId);
        }
      } else if (e.key === 'Escape') {
        setSelectedBoxId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBoxId, deleteBox, setSelectedBoxId]);

  // Handle image load
  const handleImageLoad = useCallback((dims: { width: number; height: number; scale: number }) => {
    setImageSize(dims);
  }, []);

  // Generate unique ID
  const generateId = () => crypto.randomUUID();

  // Mouse handlers for drawing boxes
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Only start drawing if clicking on empty area (not on a box)
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background-image';

    if (!clickedOnEmpty) return;

    // Deselect current selection when clicking on empty
    setSelectedBoxId(null);

    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Ensure drawing within image bounds
    if (pos.x < 0 || pos.y < 0 || pos.x > imageSize.width || pos.y > imageSize.height) {
      return;
    }

    setDrawing({
      isDrawing: true,
      startX: pos.x,
      startY: pos.y,
      currentX: pos.x,
      currentY: pos.y,
    });
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!drawing.isDrawing) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Clamp to image bounds
    const clampedX = Math.max(0, Math.min(pos.x, imageSize.width));
    const clampedY = Math.max(0, Math.min(pos.y, imageSize.height));

    setDrawing((prev) => ({
      ...prev,
      currentX: clampedX,
      currentY: clampedY,
    }));
  };

  const handleMouseUp = () => {
    if (!drawing.isDrawing) return;

    // Calculate box dimensions
    const x = Math.min(drawing.startX, drawing.currentX);
    const y = Math.min(drawing.startY, drawing.currentY);
    const width = Math.abs(drawing.currentX - drawing.startX);
    const height = Math.abs(drawing.currentY - drawing.startY);

    // Only create box if it has minimum size
    if (width > 5 && height > 5) {
      const newBox = {
        id: generateId(),
        x,
        y,
        width,
        height,
        charCount: 1,
        isNew: true,
      };

      addBox(newBox);
      setSelectedBoxId(newBox.id);
    }

    setDrawing({
      isDrawing: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    });
  };

  // Handle box click for selection
  const handleBoxClick = (boxId: string) => {
    setSelectedBoxId(boxId);
  };

  // Handle right-click for context menu
  const handleBoxContextMenu = (
    boxId: string,
    e: Konva.KonvaEventObject<PointerEvent>
  ) => {
    e.evt.preventDefault();

    // Get stage position to calculate absolute position
    const stage = stageRef.current;
    if (!stage) return;

    const container = containerRef.current;
    if (!container) return;

    // Get the pointer position relative to the page
    const containerRect = container.getBoundingClientRect();
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    // Calculate absolute position for the context menu
    const menuX = containerRect.left + pointerPosition.x;
    const menuY = containerRect.top + pointerPosition.y;

    setContextMenu({
      isOpen: true,
      x: menuX,
      y: menuY,
      boxId,
    });

    // Also select the box
    setSelectedBoxId(boxId);
  };

  // Handle context menu close
  const handleContextMenuClose = () => {
    setContextMenu({
      isOpen: false,
      x: 0,
      y: 0,
      boxId: null,
    });
  };

  // Handle char count selection from context menu
  const handleCharCountSelect = (charCount: number) => {
    if (contextMenu.boxId) {
      updateCharCount(contextMenu.boxId, charCount);
    }
  };

  // Handle box drag end
  const handleBoxDragEnd = (boxId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    updateBox(boxId, {
      x: node.x(),
      y: node.y(),
    });
  };

  // Handle box transform end (resize)
  const handleBoxTransformEnd = (boxId: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target as Konva.Rect;

    // Get the actual new dimensions after scaling
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale to 1 and apply it to width/height
    node.scaleX(1);
    node.scaleY(1);

    updateBox(boxId, {
      x: node.x(),
      y: node.y(),
      width: Math.max(10, node.width() * scaleX),
      height: Math.max(10, node.height() * scaleY),
    });
  };

  // Get preview box dimensions while drawing
  const getPreviewBox = () => {
    if (!drawing.isDrawing) return null;

    return {
      x: Math.min(drawing.startX, drawing.currentX),
      y: Math.min(drawing.startY, drawing.currentY),
      width: Math.abs(drawing.currentX - drawing.startX),
      height: Math.abs(drawing.currentY - drawing.startY),
    };
  };

  const previewBox = getPreviewBox();
  const imageUrl = currentImage ? `/images/${currentImage.filename}` : null;

  // Placeholder when no image is selected
  if (!currentImage) {
    return (
      <div
        ref={containerRef}
        className="h-full w-full flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        }}
      >
        <div className="text-center">
          <div className="mb-6 text-7xl opacity-30">
            <span className="inline-block animate-pulse">📷</span>
          </div>
          <h3 className="text-xl font-light text-white/60 mb-2 tracking-wide">
            Selecciona una imagen
          </h3>
          <p className="text-sm text-white/30">
            Usa la lista de la izquierda para comenzar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      }}
      tabIndex={0}
    >
      {containerSize.width > 0 && containerSize.height > 0 && (
        <Stage
          ref={stageRef}
          width={containerSize.width}
          height={containerSize.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: drawing.isDrawing ? 'crosshair' : 'default' }}
        >
          <Layer>
            {/* Center the image in the stage */}
            <Group
              x={(containerSize.width - imageSize.width) / 2}
              y={(containerSize.height - imageSize.height) / 2}
            >
              {/* Background Image */}
              {imageUrl && (
                <UrlImage
                  src={imageUrl}
                  containerWidth={containerSize.width - 40}
                  containerHeight={containerSize.height - 40}
                  onLoad={handleImageLoad}
                />
              )}

              {/* Existing Bounding Boxes */}
              {boxes.map((box) => {
                const isSelected = box.id === selectedBoxId;
                const hasLabel = !!box.label;

                return (
                  <Group key={box.id}>
                    {/* Box Rectangle */}
                    <Rect
                      ref={(node) => {
                        if (node) {
                          boxRefs.current.set(box.id, node);
                        } else {
                          boxRefs.current.delete(box.id);
                        }
                      }}
                      x={box.x}
                      y={box.y}
                      width={box.width}
                      height={box.height}
                      stroke={hasLabel ? '#22c55e' : '#ef4444'}
                      strokeWidth={isSelected ? 3 : 2}
                      dash={hasLabel ? undefined : [8, 4]}
                      fill={isSelected ? 'rgba(14, 165, 233, 0.15)' : 'rgba(255, 255, 255, 0.05)'}
                      cornerRadius={2}
                      draggable
                      onClick={() => handleBoxClick(box.id)}
                      onTap={() => handleBoxClick(box.id)}
                      onContextMenu={(e) => handleBoxContextMenu(box.id, e)}
                      onDragEnd={(e) => handleBoxDragEnd(box.id, e)}
                      onTransformEnd={(e) => handleBoxTransformEnd(box.id, e)}
                      shadowColor={isSelected ? '#0ea5e9' : undefined}
                      shadowBlur={isSelected ? 10 : 0}
                      shadowOpacity={isSelected ? 0.5 : 0}
                    />

                    {/* Label below box */}
                    {box.label && (
                      <Text
                        x={box.x}
                        y={box.y + box.height + 4}
                        text={box.label}
                        fontSize={14}
                        fontFamily="monospace"
                        fontStyle="bold"
                        fill="#22c55e"
                        shadowColor="#000"
                        shadowBlur={2}
                        shadowOpacity={0.5}
                      />
                    )}

                    {/* CharCount badge */}
                    {box.charCount > 1 && (
                      <>
                        <Rect
                          x={box.x + box.width - 18}
                          y={box.y - 8}
                          width={20}
                          height={16}
                          fill="#6366f1"
                          cornerRadius={8}
                        />
                        <Text
                          x={box.x + box.width - 14}
                          y={box.y - 5}
                          text={String(box.charCount)}
                          fontSize={10}
                          fontFamily="monospace"
                          fontStyle="bold"
                          fill="#fff"
                        />
                      </>
                    )}
                  </Group>
                );
              })}

              {/* Preview Box while drawing */}
              {previewBox && previewBox.width > 0 && previewBox.height > 0 && (
                <Rect
                  x={previewBox.x}
                  y={previewBox.y}
                  width={previewBox.width}
                  height={previewBox.height}
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dash={[6, 3]}
                  fill="rgba(14, 165, 233, 0.2)"
                  cornerRadius={2}
                  listening={false}
                />
              )}

              {/* Transformer for selected box */}
              <BoxTransformer selectedNode={selectedNode} />
            </Group>
          </Layer>
        </Stage>
      )}

      {/* Instructions overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 text-xs text-white/70 flex gap-4">
          <span>
            <kbd className="bg-white/20 px-1.5 py-0.5 rounded text-white/90">Click + Drag</kbd>
            {' '}Dibujar caja
          </span>
          <span>
            <kbd className="bg-white/20 px-1.5 py-0.5 rounded text-white/90">Del</kbd>
            {' '}Eliminar
          </span>
          <span>
            <kbd className="bg-white/20 px-1.5 py-0.5 rounded text-white/90">Esc</kbd>
            {' '}Deseleccionar
          </span>
          <span>
            <kbd className="bg-white/20 px-1.5 py-0.5 rounded text-white/90">Clic Derecho</kbd>
            {' '}Dígrafo
          </span>
        </div>
      </div>

      {/* Context Menu for setting charCount */}
      {contextMenu.isOpen && contextMenu.boxId && (
        <BoxContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          currentCharCount={
            boxes.find((b) => b.id === contextMenu.boxId)?.charCount ?? 1
          }
          onSelect={handleCharCountSelect}
          onClose={handleContextMenuClose}
        />
      )}
    </div>
  );
}
