/**
 * BoxTransformer Component
 * Handles selection and transformation (resize/move) of bounding boxes
 * Phase 7: Memoized for performance
 */
import { memo, useEffect, useRef } from 'react';
import { Transformer } from 'react-konva';
import type Konva from 'konva';

interface BoxTransformerProps {
  selectedNode: Konva.Rect | null;
}

export const BoxTransformer = memo(function BoxTransformer({ selectedNode }: BoxTransformerProps) {
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (!transformerRef.current) return;

    if (selectedNode) {
      // Attach transformer to the selected node
      transformerRef.current.nodes([selectedNode]);
      transformerRef.current.getLayer()?.batchDraw();
    } else {
      // Detach transformer when nothing is selected
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedNode]);

  return (
    <Transformer
      ref={transformerRef}
      rotateEnabled={false}
      keepRatio={false}
      enabledAnchors={[
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right',
        'middle-left',
        'middle-right',
        'top-center',
        'bottom-center',
      ]}
      anchorSize={8}
      anchorCornerRadius={2}
      anchorFill="#fff"
      anchorStroke="#0ea5e9"
      anchorStrokeWidth={1}
      borderStroke="#0ea5e9"
      borderStrokeWidth={2}
      boundBoxFunc={(oldBox, newBox) => {
        // Prevent boxes from being too small
        const minSize = 10;
        if (newBox.width < minSize || newBox.height < minSize) {
          return oldBox;
        }
        return newBox;
      }}
    />
  );
});
