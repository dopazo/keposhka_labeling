/**
 * Zustand Store for Keposhka Labeler
 */
import { create } from 'zustand';
import type { BoundingBox, ImageMeta } from '@/lib/types';

interface AppState {
  // State
  boxes: BoundingBox[];
  currentImage: ImageMeta | null;
  inputText: string;
  images: ImageMeta[];
  selectedBoxId: string | null;

  // Actions - Boxes
  addBox: (box: BoundingBox) => void;
  updateBox: (id: string, updates: Partial<BoundingBox>) => void;
  deleteBox: (id: string) => void;
  setBoxes: (boxes: BoundingBox[]) => void;
  updateCharCount: (id: string, charCount: number) => void;

  // Actions - Text & Image
  setInputText: (text: string) => void;
  setCurrentImage: (image: ImageMeta | null) => void;
  setImages: (images: ImageMeta[]) => void;

  // Actions - Selection
  setSelectedBoxId: (id: string | null) => void;

  // Actions - Reset
  reset: () => void;
}

export const useStore = create<AppState>((set) => ({
  // Initial State
  boxes: [],
  currentImage: null,
  inputText: '',
  images: [],
  selectedBoxId: null,

  // Box Actions
  addBox: (box) =>
    set((state) => ({
      boxes: [...state.boxes, box],
    })),

  updateBox: (id, updates) =>
    set((state) => ({
      boxes: state.boxes.map((box) =>
        box.id === id ? { ...box, ...updates } : box
      ),
    })),

  deleteBox: (id) =>
    set((state) => ({
      boxes: state.boxes.filter((box) => box.id !== id),
      selectedBoxId: state.selectedBoxId === id ? null : state.selectedBoxId,
    })),

  setBoxes: (boxes) => set({ boxes }),

  updateCharCount: (id, charCount) =>
    set((state) => ({
      boxes: state.boxes.map((box) =>
        box.id === id ? { ...box, charCount } : box
      ),
    })),

  // Text & Image Actions
  setInputText: (text) => set({ inputText: text }),

  setCurrentImage: (image) => set({ currentImage: image }),

  setImages: (images) => set({ images }),

  // Selection Actions
  setSelectedBoxId: (id) => set({ selectedBoxId: id }),

  // Reset
  reset: () =>
    set({
      boxes: [],
      inputText: '',
      selectedBoxId: null,
    }),
}));
