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
 * - Zoom with wheel/touchpad and +/- buttons
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

interface PanState {
  isPanning: boolean;
  startX: number;
  startY: number;
  startZoomX: number;
  startZoomY: number;
}

interface LastBoxSize {
  width: number;
  height: number;
}

interface ZoomState {
  scale: number;
  x: number;
  y: number;
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.1;

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
  const [lastBoxSize, setLastBoxSize] = useState<LastBoxSize | null>(null);
  const [nodeUpdateTrigger, setNodeUpdateTrigger] = useState(0);
  const [zoom, setZoom] = useState<ZoomState>({ scale: 1, x: 0, y: 0 });
  const [pan, setPan] = useState<PanState>({
    isPanning: false,
    startX: 0,
    startY: 0,
    startZoomX: 0,
    startZoomY: 0,
  });

  const currentImage = useStore((s) => s.currentImage);
  const boxes = useStore((s) => s.boxes);
  const selectedBoxId = useStore((s) => s.selectedBoxId);
  const addBox = useStore((s) => s.addBox);
  const updateBox = useStore((s) => s.updateBox);
  const deleteBox = useStore((s) => s.deleteBox);
  const setSelectedBoxId = useStore((s) => s.setSelectedBoxId);
  const updateCharCount = useStore((s) => s.updateCharCount);
  const boxesVisible = useStore((s) => s.boxesVisible);
  const toggleBoxesVisible = useStore((s) => s.toggleBoxesVisible);
  const setCanvasScale = useStore((s) => s.setCanvasScale);
  const rowThresholdMultiplier = useStore((s) => s.rowThresholdMultiplier);
  const setRowThresholdMultiplier = useStore((s) => s.setRowThresholdMultiplier);

  const boxRefs = useRef<Map<string, Konva.Rect>>(new Map());

  const selectedNode = useMemo(() => {
    if (!selectedBoxId) return null;
    return boxRefs.current.get(selectedBoxId) || null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBoxId, boxes.length, nodeUpdateTrigger]);

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

  const handleImageLoad = useCallback((dims: { width: number; height: number; scale: number }) => {
    setImageSize(dims);
    // Update canvas scale in store for coordinate conversions
    setCanvasScale(dims.scale);
    // Reset zoom when image changes
    setZoom({ scale: 1, x: 0, y: 0 });
  }, [setCanvasScale]);

  // Zoom functions
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => {
      const newScale = Math.min(prev.scale + ZOOM_STEP, MAX_ZOOM);
      // Zoom toward center
      const centerX = containerSize.width / 2;
      const centerY = containerSize.height / 2;
      const newX = centerX - (centerX - prev.x) * (newScale / prev.scale);
      const newY = centerY - (centerY - prev.y) * (newScale / prev.scale);
      return { scale: newScale, x: newX, y: newY };
    });
  }, [containerSize]);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const newScale = Math.max(prev.scale - ZOOM_STEP, MIN_ZOOM);
      const centerX = containerSize.width / 2;
      const centerY = containerSize.height / 2;
      const newX = centerX - (centerX - prev.x) * (newScale / prev.scale);
      const newY = centerY - (centerY - prev.y) * (newScale / prev.scale);
      return { scale: newScale, x: newX, y: newY };
    });
  }, [containerSize]);

  const handleZoomReset = useCallback(() => {
    setZoom({ scale: 1, x: 0, y: 0 });
  }, []);

  // Wheel zoom handler
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const scaleBy = 1.08;
      const oldScale = zoom.scale;
      const newScale = e.evt.deltaY < 0
        ? Math.min(oldScale * scaleBy, MAX_ZOOM)
        : Math.max(oldScale / scaleBy, MIN_ZOOM);

      // Zoom toward pointer position
      const mousePointTo = {
        x: (pointer.x - zoom.x) / oldScale,
        y: (pointer.y - zoom.y) / oldScale,
      };

      const newX = pointer.x - mousePointTo.x * newScale;
      const newY = pointer.y - mousePointTo.y * newScale;

      setZoom({ scale: newScale, x: newX, y: newY });
    },
    [zoom]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (activeElement?.tagName === 'TEXTAREA' || activeElement?.tagName === 'INPUT' || (activeElement as HTMLElement)?.isContentEditable) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedBoxId) {
          deleteBox(selectedBoxId);
        }
      } else if (e.key === 'Escape') {
        setSelectedBoxId(null);
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleZoomReset();
      } else if (e.key === 'v' || e.key === 'V') {
        toggleBoxesVisible();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBoxId, deleteBox, setSelectedBoxId, handleZoomIn, handleZoomOut, handleZoomReset, toggleBoxesVisible]);

  const generateId = () => crypto.randomUUID();

  // Calculate the Group offset for coordinate transformation
  const groupOffsetX = (containerSize.width - imageSize.width) / 2;
  const groupOffsetY = (containerSize.height - imageSize.height) / 2;

  // Transform screen coordinates to canvas coordinates (accounting for zoom)
  const screenToCanvasCoords = useCallback(
    (screenX: number, screenY: number) => {
      // First, transform from screen to stage coordinates (reverse zoom transform)
      const stageX = (screenX - zoom.x) / zoom.scale;
      const stageY = (screenY - zoom.y) / zoom.scale;
      // Then, transform from stage to canvas coordinates (reverse group offset)
      const canvasX = stageX - groupOffsetX;
      const canvasY = stageY - groupOffsetY;
      return { x: canvasX, y: canvasY };
    },
    [zoom, groupOffsetX, groupOffsetY]
  );

  // Convert canvas coordinates to original image coordinates
  // Canvas coords are scaled, divide by scale to get original
  const canvasToOriginal = useCallback(
    (canvasX: number, canvasY: number, canvasW: number, canvasH: number) => {
      const scale = imageSize.scale || 1;
      return {
        x: canvasX / scale,
        y: canvasY / scale,
        width: canvasW / scale,
        height: canvasH / scale,
      };
    },
    [imageSize.scale]
  );

  // Convert original image coordinates to canvas coordinates
  // Multiply by scale to get canvas coords
  const originalToCanvas = useCallback(
    (origX: number, origY: number, origW: number, origH: number) => {
      const scale = imageSize.scale || 1;
      return {
        x: origX * scale,
        y: origY * scale,
        width: origW * scale,
        height: origH * scale,
      };
    },
    [imageSize.scale]
  );

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background-image';
    if (!clickedOnEmpty) return;
    setSelectedBoxId(null);

    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Ctrl+click: start panning
    if (e.evt.ctrlKey) {
      setPan({
        isPanning: true,
        startX: pos.x,
        startY: pos.y,
        startZoomX: zoom.x,
        startZoomY: zoom.y,
      });
      return;
    }

    // Don't allow drawing when boxes are hidden
    if (!boxesVisible) return;

    // Adjust coordinates to be relative to the centered Group (with zoom)
    const { x: adjustedX, y: adjustedY } = screenToCanvasCoords(pos.x, pos.y);

    if (adjustedX < 0 || adjustedY < 0 || adjustedX > imageSize.width || adjustedY > imageSize.height) return;

    setDrawing({
      isDrawing: true,
      startX: adjustedX,
      startY: adjustedY,
      currentX: adjustedX,
      currentY: adjustedY,
    });
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Handle panning
    if (pan.isPanning) {
      const dx = pos.x - pan.startX;
      const dy = pos.y - pan.startY;
      setZoom((prev) => ({
        ...prev,
        x: pan.startZoomX + dx,
        y: pan.startZoomY + dy,
      }));
      return;
    }

    if (!drawing.isDrawing) return;

    // Adjust coordinates to be relative to the centered Group (with zoom)
    const { x: adjustedX, y: adjustedY } = screenToCanvasCoords(pos.x, pos.y);

    const clampedX = Math.max(0, Math.min(adjustedX, imageSize.width));
    const clampedY = Math.max(0, Math.min(adjustedY, imageSize.height));

    setDrawing((prev) => ({
      ...prev,
      currentX: clampedX,
      currentY: clampedY,
    }));
  };

  const handleMouseUp = () => {
    // End panning
    if (pan.isPanning) {
      setPan({
        isPanning: false,
        startX: 0,
        startY: 0,
        startZoomX: 0,
        startZoomY: 0,
      });
      return;
    }

    if (!drawing.isDrawing) return;

    const dragWidth = Math.abs(drawing.currentX - drawing.startX);
    const dragHeight = Math.abs(drawing.currentY - drawing.startY);
    const isDrag = dragWidth > 5 || dragHeight > 5;

    if (isDrag) {
      // Normal drag: create box from drag coordinates (canvas space)
      const canvasX = Math.min(drawing.startX, drawing.currentX);
      const canvasY = Math.min(drawing.startY, drawing.currentY);
      const canvasWidth = Math.abs(drawing.currentX - drawing.startX);
      const canvasHeight = Math.abs(drawing.currentY - drawing.startY);

      if (canvasWidth > 5 && canvasHeight > 5) {
        // Convert from canvas coordinates to original image coordinates
        const originalCoords = canvasToOriginal(canvasX, canvasY, canvasWidth, canvasHeight);

        const newBox = {
          id: generateId(),
          x: originalCoords.x,
          y: originalCoords.y,
          width: originalCoords.width,
          height: originalCoords.height,
          charCount: 1,
          isNew: true,
        };
        addBox(newBox);
        setSelectedBoxId(newBox.id);
        // Save dimensions in original coords for quick-click
        setLastBoxSize({ width: originalCoords.width, height: originalCoords.height });
        // Force re-evaluation of selectedNode after ref is registered
        requestAnimationFrame(() => setNodeUpdateTrigger((n) => n + 1));
      }
    } else if (lastBoxSize) {
      // Quick click: create box with last dimensions (in original coords), centered on click point
      const canvasClickX = drawing.startX;
      const canvasClickY = drawing.startY;

      // Convert click point to original coords
      const scale = imageSize.scale || 1;
      const origClickX = canvasClickX / scale;
      const origClickY = canvasClickY / scale;

      // Center the box on the click point (all in original coords)
      let origX = origClickX - lastBoxSize.width / 2;
      let origY = origClickY - lastBoxSize.height / 2;

      // Clamp to image bounds (using original image dimensions from currentImage)
      const origImgWidth = currentImage?.width || imageSize.width / scale;
      const origImgHeight = currentImage?.height || imageSize.height / scale;
      origX = Math.max(0, Math.min(origX, origImgWidth - lastBoxSize.width));
      origY = Math.max(0, Math.min(origY, origImgHeight - lastBoxSize.height));

      const newBox = {
        id: generateId(),
        x: origX,
        y: origY,
        width: lastBoxSize.width,
        height: lastBoxSize.height,
        charCount: 1,
        isNew: true,
      };
      addBox(newBox);
      setSelectedBoxId(newBox.id);
      // Force re-evaluation of selectedNode after ref is registered
      requestAnimationFrame(() => setNodeUpdateTrigger((n) => n + 1));
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
    // Node position is in canvas coords, convert to original
    const scale = imageSize.scale || 1;
    updateBox(boxId, {
      x: node.x() / scale,
      y: node.y() / scale,
    });
  };

  const handleBoxTransformEnd = (boxId: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target as Konva.Rect;
    const nodeScaleX = node.scaleX();
    const nodeScaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);

    // Node dimensions are in canvas coords after transform
    const canvasWidth = Math.max(10, node.width() * nodeScaleX);
    const canvasHeight = Math.max(10, node.height() * nodeScaleY);
    const canvasX = node.x();
    const canvasY = node.y();

    // Convert to original coordinates
    const scale = imageSize.scale || 1;
    const origWidth = canvasWidth / scale;
    const origHeight = canvasHeight / scale;
    const origX = canvasX / scale;
    const origY = canvasY / scale;

    updateBox(boxId, {
      x: origX,
      y: origY,
      width: origWidth,
      height: origHeight,
    });

    // Update lastBoxSize in original coords
    setLastBoxSize({ width: origWidth, height: origHeight });
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
          <div className="mb-6">
            <div className="w-24 h-1 mx-auto bg-keposhka-red mb-4" />
            <h3 className="text-2xl font-display uppercase tracking-[0.3em] text-keposhka-cream mb-2">
              SELECT FILE
            </h3>
            <div className="w-24 h-1 mx-auto bg-keposhka-red" />
          </div>

          <p className="text-sm font-mono text-keposhka-steel uppercase">
            Use the left panel to start
          </p>
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
          scaleX={zoom.scale}
          scaleY={zoom.scale}
          x={zoom.x}
          y={zoom.y}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: pan.isPanning ? 'grabbing' : drawing.isDrawing ? 'crosshair' : 'default' }}
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
              {boxesVisible && boxes.map((box) => {
                const isSelected = box.id === selectedBoxId;
                const hasLabel = !!box.label;

                // Convert from original image coordinates to canvas coordinates
                const canvasCoords = originalToCanvas(box.x, box.y, box.width, box.height);
                const cx = canvasCoords.x;
                const cy = canvasCoords.y;
                const cw = canvasCoords.width;
                const ch = canvasCoords.height;

                // Scale stroke and dash with dampened zoom for consistent visual appearance
                const zoomFactor = Math.sqrt(zoom.scale);
                const boxStrokeWidth = (isSelected ? 2 : 1) / zoomFactor;
                const boxDash = hasLabel ? undefined : [6 / zoomFactor, 4 / zoomFactor];
                const boxShadowBlur = isSelected ? 15 / zoomFactor : 0;

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
                      x={cx}
                      y={cy}
                      width={cw}
                      height={ch}
                      stroke={hasLabel ? COLORS.greenLight : COLORS.red}
                      strokeWidth={boxStrokeWidth}
                      dash={boxDash}
                      fill={isSelected ? 'rgba(137, 24, 26, 0.2)' : 'rgba(245, 240, 230, 0.05)'}
                      cornerRadius={0}
                      draggable
                      onClick={() => handleBoxClick(box.id)}
                      onTap={() => handleBoxClick(box.id)}
                      onContextMenu={(e) => handleBoxContextMenu(box.id, e)}
                      onDragEnd={(e) => handleBoxDragEnd(box.id, e)}
                      onTransformEnd={(e) => handleBoxTransformEnd(box.id, e)}
                      shadowColor={isSelected ? COLORS.red : undefined}
                      shadowBlur={boxShadowBlur}
                      shadowOpacity={isSelected ? 0.6 : 0}
                    />

                    {/* Label below box - Industrial style */}
                    {box.label && (() => {
                      // Scale label with dampened zoom - grows slightly but not proportionally
                      // Using square root gives a gentler curve: at 2x zoom, labels are ~1.4x size
                      const zoomFactor = Math.sqrt(zoom.scale);
                      const labelFontSize = 12 / zoomFactor;
                      const labelPadding = 4 / zoomFactor;
                      const labelHeight = 18 / zoomFactor;
                      const labelCharWidth = 10 / zoomFactor;
                      const labelGap = 2 / zoomFactor;
                      const labelStroke = 1 / zoomFactor;
                      return (
                        <>
                          {/* Label background */}
                          <Rect
                            x={cx}
                            y={cy + ch + labelGap}
                            width={box.label.length * labelCharWidth + labelPadding * 2}
                            height={labelHeight}
                            fill={COLORS.black}
                            stroke={COLORS.greenLight}
                            strokeWidth={labelStroke}
                          />
                          <Text
                            x={cx + labelPadding}
                            y={cy + ch + labelGap + labelPadding * 0.75}
                            text={box.label}
                            fontSize={labelFontSize}
                            fontFamily="JetBrains Mono, monospace"
                            fontStyle="bold"
                            fill={COLORS.greenLight}
                          />
                        </>
                      );
                    })()}

                    {/* CharCount badge - Regime style */}
                    {box.charCount > 1 && (() => {
                      // Scale badge with dampened zoom - grows slightly but not proportionally
                      const zoomFactor = Math.sqrt(zoom.scale);
                      const badgeWidth = 22 / zoomFactor;
                      const badgeHeight = 18 / zoomFactor;
                      const badgeOffsetX = 20 / zoomFactor;
                      const badgeOffsetY = 10 / zoomFactor;
                      const badgeFontSize = 11 / zoomFactor;
                      const badgeTextOffsetX = 14 / zoomFactor;
                      const badgeTextOffsetY = 7 / zoomFactor;
                      const badgeStroke = 2 / zoomFactor;
                      return (
                        <>
                          <Rect
                            x={cx + cw - badgeOffsetX}
                            y={cy - badgeOffsetY}
                            width={badgeWidth}
                            height={badgeHeight}
                            fill={COLORS.red}
                            stroke={COLORS.black}
                            strokeWidth={badgeStroke}
                          />
                          <Text
                            x={cx + cw - badgeTextOffsetX}
                            y={cy - badgeTextOffsetY}
                            text={String(box.charCount)}
                            fontSize={badgeFontSize}
                            fontFamily="JetBrains Mono, monospace"
                            fontStyle="bold"
                            fill={COLORS.white}
                          />
                        </>
                      );
                    })()}
                  </Group>
                );
              })}

              {/* Preview Box while drawing - Red dashed */}
              {previewBox && previewBox.width > 0 && previewBox.height > 0 && (() => {
                const zoomFactor = Math.sqrt(zoom.scale);
                return (
                  <Rect
                    x={previewBox.x}
                    y={previewBox.y}
                    width={previewBox.width}
                    height={previewBox.height}
                    stroke={COLORS.red}
                    strokeWidth={2 / zoomFactor}
                    dash={[8 / zoomFactor, 4 / zoomFactor]}
                    fill="rgba(137, 24, 26, 0.15)"
                    cornerRadius={0}
                    listening={false}
                  />
                );
              })()}

              {boxesVisible && <BoxTransformer selectedNode={selectedNode} />}
            </Group>
          </Layer>
        </Stage>
      )}

      {/* Instructions overlay - Brutalist industrial */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none w-max">
        <div className="bg-keposhka-black/90 border-2 border-keposhka-steel px-8 py-2 flex gap-3 w-max">
          <span className="text-[11px] font-mono text-keposhka-cream uppercase whitespace-nowrap">
            <kbd className="px-1.5 py-0.5 bg-keposhka-steel border border-keposhka-red text-keposhka-red mr-1">
              DRAG
            </kbd>
            Draw
          </span>
          <span className="text-[11px] font-mono text-keposhka-cream uppercase whitespace-nowrap">
            <kbd className="px-1.5 py-0.5 bg-keposhka-steel border border-keposhka-red text-keposhka-red mr-1">
              CLICK
            </kbd>
            Repeat
          </span>
          <span className="text-[11px] font-mono text-keposhka-cream uppercase whitespace-nowrap">
            <kbd className="px-1.5 py-0.5 bg-keposhka-steel border border-keposhka-red text-keposhka-red mr-1">
              DEL
            </kbd>
            Delete
          </span>
          <span className="text-[11px] font-mono text-keposhka-cream uppercase whitespace-nowrap">
            <kbd className="px-1.5 py-0.5 bg-keposhka-steel border border-keposhka-red text-keposhka-red mr-1">
              ESC
            </kbd>
            Deselect
          </span>
          <span className="text-[11px] font-mono text-keposhka-cream uppercase whitespace-nowrap">
            <kbd className="px-1.5 py-0.5 bg-keposhka-steel border border-keposhka-red text-keposhka-red mr-1">
              R-CLICK
            </kbd>
            Digraph
          </span>
          <span className="text-[11px] font-mono text-keposhka-cream uppercase whitespace-nowrap">
            <kbd className="px-1.5 py-0.5 bg-keposhka-steel border border-keposhka-red text-keposhka-red mr-1">
              CTRL+DRAG
            </kbd>
            Move
          </span>
        </div>
      </div>

      {/* Top-left file indicator and line sensitivity */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <div className="bg-keposhka-black/90 border-2 border-keposhka-red px-3 py-1.5 flex items-center gap-2">
          <span className="text-xs font-mono text-keposhka-cream uppercase tracking-wider">
            {currentImage.filename}
          </span>
          <span className={`text-xs font-bold ${currentImage.status === 'done' ? 'text-green-500' : 'text-keposhka-steel'}`}>
            [{currentImage.status === 'done' ? 'DONE' : 'PENDING'}]
          </span>
        </div>

        {/* Line sensitivity slider */}
        <div className="bg-keposhka-black/90 border-2 border-keposhka-steel px-3 py-2 w-44">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-keposhka-cream/70 uppercase">
              Tolerance
            </span>
            <button
              onClick={() => setRowThresholdMultiplier(1.0)}
              className={`text-[10px] font-mono px-1 transition-colors ${
                rowThresholdMultiplier === 1.0
                  ? 'text-keposhka-cream'
                  : 'text-keposhka-red hover:text-keposhka-cream cursor-pointer'
              }`}
              title="Reset to 1.0x"
            >
              {rowThresholdMultiplier.toFixed(1)}x
            </button>
          </div>
          <input
            type="range"
            min="0.3"
            max="5"
            step="0.1"
            value={rowThresholdMultiplier}
            onChange={(e) => setRowThresholdMultiplier(parseFloat(e.target.value))}
            className="w-full h-2 bg-keposhka-steel rounded-none appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:bg-keposhka-red
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-keposhka-black
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-moz-range-thumb]:w-3
              [&::-moz-range-thumb]:h-4
              [&::-moz-range-thumb]:bg-keposhka-red
              [&::-moz-range-thumb]:border-2
              [&::-moz-range-thumb]:border-keposhka-black
              [&::-moz-range-thumb]:cursor-pointer
              [&::-moz-range-thumb]:rounded-none
            "
            title="Adjust sensitivity for line detection. High values = more tolerant (ideal for arc text)"
          />
          <div className="flex justify-between text-[8px] font-mono text-keposhka-cream/50 mt-0.5">
            <span>SENSITIVE</span>
            <span>TOLERANT</span>
          </div>
        </div>
      </div>

      {/* Box count indicator and visibility toggle */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <div className="bg-keposhka-black/90 border-2 border-keposhka-steel px-3 py-1.5 pointer-events-none">
          <span className="text-xs font-mono text-keposhka-cream/70 uppercase">
            BOXES: <span className="text-keposhka-cream font-bold">{boxes.length}</span>
          </span>
        </div>
        <button
          onClick={toggleBoxesVisible}
          className={`
            h-8 px-3 font-mono text-xs uppercase tracking-wide
            border-2 transition-all duration-100
            flex items-center justify-center gap-2
            ${boxesVisible
              ? 'bg-keposhka-black/90 border-keposhka-green text-keposhka-green hover:bg-keposhka-green/20'
              : 'bg-keposhka-black/90 border-keposhka-red text-keposhka-red hover:bg-keposhka-red/20'
            }
          `}
          title={boxesVisible ? 'Hide boxes (V)' : 'Show boxes (V)'}
        >
          <span>{boxesVisible ? '◩' : '◱'}</span>
          <span>{boxesVisible ? 'VISIBLE' : 'HIDDEN'}</span>
        </button>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1">
        <button
          onClick={handleZoomOut}
          disabled={zoom.scale <= MIN_ZOOM}
          className="w-8 h-8 bg-keposhka-black/90 border-2 border-keposhka-steel text-keposhka-cream font-mono font-bold text-lg hover:border-keposhka-red hover:text-keposhka-red transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Zoom out"
        >
          −
        </button>
        <button
          onClick={handleZoomReset}
          className="h-8 px-2 bg-keposhka-black/90 border-2 border-keposhka-steel text-keposhka-cream font-mono text-xs hover:border-keposhka-red hover:text-keposhka-red transition-colors"
          title="Reset zoom"
        >
          {Math.round(zoom.scale * 100)}%
        </button>
        <button
          onClick={handleZoomIn}
          disabled={zoom.scale >= MAX_ZOOM}
          className="w-8 h-8 bg-keposhka-black/90 border-2 border-keposhka-steel text-keposhka-cream font-mono font-bold text-lg hover:border-keposhka-red hover:text-keposhka-red transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Zoom in"
        >
          +
        </button>
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
