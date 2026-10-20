/**
 * Type definitions for Keposhka Labeler
 */

export interface BoundingBox {
  id: string;          // UUID unique for tracking in React (key)
  x: number;           // X coordinate in pixels
  y: number;           // Y coordinate in pixels
  width: number;       // Width in pixels
  height: number;      // Height in pixels
  charCount: number;   // Number of characters this box consumes (1 for simple letter, 2 for digraph, etc.)
  label?: string;      // Assigned label (eg: "A", "Ch", "5") calculated automatically
  isNew?: boolean;     // Flag to highlight newly created boxes
}

export interface ImageMeta {
  filename: string;
  width: number;
  height: number;
  status: 'pending' | 'done'; // Status to show in sidebar list
  has_text: boolean;          // A translation is already saved (e.g. draft with text but no boxes)
}

export interface AnnotationMetadata {
  filename: string;
  translatedText: string;        // Complete translated text (multiline)
  imageWidth: number;
  imageHeight: number;
  boxes: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    charCount: number;
    label: string;
  }>;
}
