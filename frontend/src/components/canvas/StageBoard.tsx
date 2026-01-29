/**
 * StageBoard - Main Canvas Component - DRAAG REGIME EDITION
 * Brutalist aesthetic for the main labeling canvas
 *
 * Features:
 * - Image loading with auto-fit
 * - Drawing bounding boxes (mouseDown → mouseMove → mouseUp)
 * - Box selection (click to select)
 * - Box transformation (resize/move via Transformer)
 * - Box deletion (Delete/Backspace keys)
 * - Deselection (Esc key or click on empty area)
 * - Right-click context menu for digraph marking
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Group, Text } from 'react-konva';
import type Konva from 'konva';
import { useStore } from '@/store/useStore';
import { UrlImage } from './UrlImage';
import { BoxTransformer } from './BoxTransformer';
import { BoxContextMenu } from '../BoxContextMenu';

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  boxId: string | null;
}

interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

// Keposhka regime colors
const COLORS = {
  red: '#89181A',
  redLight: '#A51E21',
  black: '#000000',
  white: '#FFFFFF',
  cream: '#F5F0E6',
  steel: '#2A2A2A',
  green: '#2D5016',
  greenLight: '#4A7C23',
  amber: '#8B6914',
};

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

  const currentImage = useStore((s) => s.currentImage);
  const boxes = useStore((s) => s.boxes);
  const selectedBoxId = useStore((s) => s.selectedBoxId);
  const addBox = useStore((s) => s.addBox);
  const updateBox = useStore((s) => s.updateBox);
  const deleteBox = useStore((s) => s.deleteBox);
  const setSelectedBoxId = useStore((s) => s.setSelectedBoxId);
  const updateCharCount = useStore((s) => s.updateCharCount);

  const boxRefs = useRef<Map<string, Konva.Rect>>(new Map());

  const selectedNode = useMemo(() => {
    if (!selectedBoxId) return null;
    return boxRefs.current.get(selectedBoxId) || null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBoxId, boxes.length]);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  const handleImageLoad = useCallback((dims: { width: number; height: number; scale: number }) => {
    setImageSize(dims);
  }, []);

  const generateId = () => crypto.randomUUID();

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background-image';
    if (!clickedOnEmpty) return;
    setSelectedBoxId(null);

    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    if (pos.x < 0 || pos.y < 0 || pos.x > imageSize.width || pos.y > imageSize.height) return;

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

    const x = Math.min(drawing.startX, drawing.currentX);
    const y = Math.min(drawing.startY, drawing.currentY);
    const width = Math.abs(drawing.currentX - drawing.startX);
    const height = Math.abs(drawing.currentY - drawing.startY);

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

  const handleBoxClick = (boxId: string) => {
    setSelectedBoxId(boxId);
  };

  const handleBoxContextMenu = (boxId: string, e: Konva.KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    const menuX = containerRect.left + pointerPosition.x;
    const menuY = containerRect.top + pointerPosition.y;

    setContextMenu({ isOpen: true, x: menuX, y: menuY, boxId });
    setSelectedBoxId(boxId);
  };

  const handleContextMenuClose = () => {
    setContextMenu({ isOpen: false, x: 0, y: 0, boxId: null });
  };

  const handleCharCountSelect = (charCount: number) => {
    if (contextMenu.boxId) {
      updateCharCount(contextMenu.boxId, charCount);
    }
  };

  const handleBoxDragEnd = (boxId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    updateBox(boxId, { x: node.x(), y: node.y() });
  };

  const handleBoxTransformEnd = (boxId: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target as Konva.Rect;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);

    updateBox(boxId, {
      x: node.x(),
      y: node.y(),
      width: Math.max(10, node.width() * scaleX),
      height: Math.max(10, node.height() * scaleY),
    });
  };

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

  // Placeholder when no image selected
  if (!currentImage) {
    return (
      <div
        ref={containerRef}
        className="h-full w-full flex items-center justify-center relative overflow-hidden"
        style={{
          background: `
            linear-gradient(135deg, ${COLORS.black} 0%, ${COLORS.steel} 50%, ${COLORS.black} 100%)
          `,
        }}
      >
        {/* Diagonal stripes background */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 20px,
              ${COLORS.red} 20px,
              ${COLORS.red} 22px
            )`,
          }}
        />

        {/* Scanlines effect */}
        <div
          className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              ${COLORS.black} 2px,
              ${COLORS.black} 4px
            )`,
          }}
        />

        <div className="text-center relative z-10">
          {/* Regime emblem */}
          <div className="mb-6 relative">
            <div className="w-24 h-24 mx-auto border-4 border-keposhka-red bg-keposhka-black/50 flex items-center justify-center">
              <span className="text-5xl text-keposhka-red font-display">K</span>
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-keposhka-red px-3 py-1">
              <span className="text-[10px] font-mono text-keposhka-white uppercase tracking-wider">
                ZONA DE TRABAJO
              </span>
            </div>
          </div>

          <h3 className="text-2xl font-display uppercase tracking-[0.3em] text-keposhka-cream mb-2">
            SELECCIONA ARCHIVO
          </h3>
          <p className="text-sm font-mono text-keposhka-steel uppercase">
            Usa el panel izquierdo para comenzar
          </p>

          {/* Decorative lines */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="w-16 h-px bg-keposhka-red" />
            <span className="text-keposhka-red text-xs">◆</span>
            <div className="w-16 h-px bg-keposhka-red" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden relative"
      style={{
        background: `linear-gradient(135deg, ${COLORS.black} 0%, ${COLORS.steel} 50%, ${COLORS.black} 100%)`,
      }}
      tabIndex={0}
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          background: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 30px,
            ${COLORS.red} 30px,
            ${COLORS.red} 31px
          )`,
        }}
      />

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
            <Group
              x={(containerSize.width - imageSize.width) / 2}
              y={(containerSize.height - imageSize.height) / 2}
            >
              {imageUrl && (
                <UrlImage
                  src={imageUrl}
                  containerWidth={containerSize.width - 40}
                  containerHeight={containerSize.height - 40}
                  onLoad={handleImageLoad}
                />
              )}

              {/* Bounding Boxes - Brutalist style */}
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
                      stroke={hasLabel ? COLORS.greenLight : COLORS.red}
                      strokeWidth={isSelected ? 3 : 2}
                      dash={hasLabel ? undefined : [6, 4]}
                      fill={isSelected ? 'rgba(137, 24, 26, 0.2)' : 'rgba(245, 240, 230, 0.05)'}
                      cornerRadius={0}
                      draggable
                      onClick={() => handleBoxClick(box.id)}
                      onTap={() => handleBoxClick(box.id)}
                      onContextMenu={(e) => handleBoxContextMenu(box.id, e)}
                      onDragEnd={(e) => handleBoxDragEnd(box.id, e)}
                      onTransformEnd={(e) => handleBoxTransformEnd(box.id, e)}
                      shadowColor={isSelected ? COLORS.red : undefined}
                      shadowBlur={isSelected ? 15 : 0}
                      shadowOpacity={isSelected ? 0.6 : 0}
                    />

                    {/* Label below box - Industrial style */}
                    {box.label && (
                      <>
                        {/* Label background */}
                        <Rect
                          x={box.x}
                          y={box.y + box.height + 2}
                          width={box.label.length * 10 + 8}
                          height={18}
                          fill={COLORS.black}
                          stroke={COLORS.greenLight}
                          strokeWidth={1}
                        />
                        <Text
                          x={box.x + 4}
                          y={box.y + box.height + 5}
                          text={box.label}
                          fontSize={12}
                          fontFamily="JetBrains Mono, monospace"
                          fontStyle="bold"
                          fill={COLORS.greenLight}
                        />
                      </>
                    )}

                    {/* CharCount badge - Regime style */}
                    {box.charCount > 1 && (
                      <>
                        <Rect
                          x={box.x + box.width - 20}
                          y={box.y - 10}
                          width={22}
                          height={18}
                          fill={COLORS.red}
                          stroke={COLORS.black}
                          strokeWidth={2}
                        />
                        <Text
                          x={box.x + box.width - 14}
                          y={box.y - 7}
                          text={String(box.charCount)}
                          fontSize={11}
                          fontFamily="JetBrains Mono, monospace"
                          fontStyle="bold"
                          fill={COLORS.white}
                        />
                      </>
                    )}
                  </Group>
                );
              })}

              {/* Preview Box while drawing - Red dashed */}
              {previewBox && previewBox.width > 0 && previewBox.height > 0 && (
                <Rect
                  x={previewBox.x}
                  y={previewBox.y}
                  width={previewBox.width}
                  height={previewBox.height}
                  stroke={COLORS.red}
                  strokeWidth={2}
                  dash={[8, 4]}
                  fill="rgba(137, 24, 26, 0.15)"
                  cornerRadius={0}
                  listening={false}
                />
              )}

              <BoxTransformer selectedNode={selectedNode} />
            </Group>
          </Layer>
        </Stage>
      )}

      {/* Instructions overlay - Brutalist industrial */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="bg-keposhka-black/90 border-2 border-keposhka-steel px-4 py-2 flex gap-6">
          <span className="text-[11px] font-mono text-keposhka-cream uppercase">
            <kbd className="px-1.5 py-0.5 bg-keposhka-steel border border-keposhka-red text-keposhka-red mr-1">
              DRAG
            </kbd>
            Dibujar
          </span>
          <span className="text-[11px] font-mono text-keposhka-cream uppercase">
            <kbd className="px-1.5 py-0.5 bg-keposhka-steel border border-keposhka-red text-keposhka-red mr-1">
              DEL
            </kbd>
            Eliminar
          </span>
          <span className="text-[11px] font-mono text-keposhka-cream uppercase">
            <kbd className="px-1.5 py-0.5 bg-keposhka-steel border border-keposhka-red text-keposhka-red mr-1">
              ESC
            </kbd>
            Deseleccionar
          </span>
          <span className="text-[11px] font-mono text-keposhka-cream uppercase">
            <kbd className="px-1.5 py-0.5 bg-keposhka-steel border border-keposhka-red text-keposhka-red mr-1">
              R-CLICK
            </kbd>
            Dígrafo
          </span>
        </div>
      </div>

      {/* Top-left file indicator */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="bg-keposhka-black/90 border-2 border-keposhka-red px-3 py-1.5 flex items-center gap-2">
          <span className="text-keposhka-red font-display">◆</span>
          <span className="text-xs font-mono text-keposhka-cream uppercase tracking-wider">
            {currentImage.filename}
          </span>
          <span className={`text-xs font-bold ${currentImage.status === 'done' ? 'text-green-500' : 'text-keposhka-steel'}`}>
            [{currentImage.status === 'done' ? 'COMPLETO' : 'PENDIENTE'}]
          </span>
        </div>
      </div>

      {/* Box count indicator */}
      <div className="absolute top-4 right-4 pointer-events-none">
        <div className="bg-keposhka-black/90 border-2 border-keposhka-steel px-3 py-1.5">
          <span className="text-xs font-mono text-keposhka-steel uppercase">
            SECTORES: <span className="text-keposhka-cream font-bold">{boxes.length}</span>
          </span>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.isOpen && contextMenu.boxId && (
        <BoxContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          currentCharCount={boxes.find((b) => b.id === contextMenu.boxId)?.charCount ?? 1}
          onSelect={handleCharCountSelect}
          onClose={handleContextMenuClose}
        />
      )}
    </div>
  );
}
