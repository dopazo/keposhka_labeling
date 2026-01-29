/**
 * UrlImage Component
 * Loads and displays the background image in Konva canvas with auto-fit
 * Phase 7: Memoized for performance
 */
import { memo, useEffect, useRef, useState } from 'react';
import { Image as KonvaImage } from 'react-konva';
import type Konva from 'konva';

interface UrlImageProps {
  src: string;
  containerWidth: number;
  containerHeight: number;
  onLoad?: (dimensions: { width: number; height: number; scale: number }) => void;
}

export const UrlImage = memo(function UrlImage({ src, containerWidth, containerHeight, onLoad }: UrlImageProps) {
  const imageRef = useRef<Konva.Image>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, scale: 1 });

  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Calculate scale to fit image in container (maintaining aspect ratio)
      const scaleX = containerWidth / img.width;
      const scaleY = containerHeight / img.height;
      const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;

      setImage(img);
      setDimensions({
        width: scaledWidth,
        height: scaledHeight,
        scale
      });

      onLoad?.({
        width: scaledWidth,
        height: scaledHeight,
        scale
      });
    };

    img.onerror = () => {
      console.error('Failed to load image:', src);
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, containerWidth, containerHeight, onLoad]);

  if (!image) {
    return null;
  }

  return (
    <KonvaImage
      ref={imageRef}
      image={image}
      width={dimensions.width}
      height={dimensions.height}
      listening={false} // Don't capture events on the image
    />
  );
});
