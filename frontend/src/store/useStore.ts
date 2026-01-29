/**
 * Zustand Store for Keposhka Labeler
 */
import { create } from 'zustand';
import type { BoundingBox, ImageMeta } from '@/lib/types';
import { assignLabels } from '@/lib/sorter';
import { validateInput } from '@/lib/validator';

interface ValidationState {
  isBalanced: boolean;
  textCharCount: number;
  boxCharCount: number;
  unassignedTextIndices: number[];
  unassignedBoxIds: string[];
  invalidCharIndices: number[];
}

interface AppState {
  // State
  boxes: BoundingBox[];
  currentImage: ImageMeta | null;
  inputText: string;
  images: ImageMeta[];
  selectedBoxId: string | null;
  validation: ValidationState;

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

  // Actions - Recalculate
  recalculate: () => void;
}

// Helper function to recalculate labels and validation
function recalculateState(boxes: BoundingBox[], text: string): {
  boxes: BoundingBox[];
  validation: ValidationState;
} {
  const sortResult = assignLabels(boxes, text);
  const inputValidation = validateInput(text);

  return {
    boxes: sortResult.boxes,
    validation: {
      isBalanced: sortResult.isBalanced && inputValidation.isValid,
      textCharCount: sortResult.textCharCount,
      boxCharCount: sortResult.boxCharCount,
      unassignedTextIndices: sortResult.unassignedTextIndices,
      unassignedBoxIds: sortResult.unassignedBoxIds,
      invalidCharIndices: inputValidation.invalidChars.map((c) => c.index),
    },
  };
}

const initialValidation: ValidationState = {
  isBalanced: true,
  textCharCount: 0,
  boxCharCount: 0,
  unassignedTextIndices: [],
  unassignedBoxIds: [],
  invalidCharIndices: [],
};

export const useStore = create<AppState>((set) => ({
  // Initial State
  boxes: [],
  currentImage: null,
  inputText: '',
  images: [],
  selectedBoxId: null,
  validation: initialValidation,

  // Box Actions - All trigger recalculation
  addBox: (box) =>
    set((state) => {
      const newBoxes = [...state.boxes, box];
      const result = recalculateState(newBoxes, state.inputText);
      return {
        boxes: result.boxes,
        validation: result.validation,
      };
    }),

  updateBox: (id, updates) =>
    set((state) => {
      const newBoxes = state.boxes.map((box) =>
        box.id === id ? { ...box, ...updates } : box
      );
      const result = recalculateState(newBoxes, state.inputText);
      return {
        boxes: result.boxes,
        validation: result.validation,
      };
    }),

  deleteBox: (id) =>
    set((state) => {
      const newBoxes = state.boxes.filter((box) => box.id !== id);
      const result = recalculateState(newBoxes, state.inputText);
      return {
        boxes: result.boxes,
        validation: result.validation,
        selectedBoxId: state.selectedBoxId === id ? null : state.selectedBoxId,
      };
    }),

  setBoxes: (boxes) =>
    set((state) => {
      const result = recalculateState(boxes, state.inputText);
      return {
        boxes: result.boxes,
        validation: result.validation,
      };
    }),

  updateCharCount: (id, charCount) =>
    set((state) => {
      const newBoxes = state.boxes.map((box) =>
        box.id === id ? { ...box, charCount } : box
      );
      const result = recalculateState(newBoxes, state.inputText);
      return {
        boxes: result.boxes,
        validation: result.validation,
      };
    }),

  // Text Actions - Triggers recalculation
  setInputText: (text) =>
    set((state) => {
      const result = recalculateState(state.boxes, text);
      return {
        inputText: text,
        boxes: result.boxes,
        validation: result.validation,
      };
    }),

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
      validation: initialValidation,
    }),

  // Manual recalculation (if needed)
  recalculate: () =>
    set((state) => {
      const result = recalculateState(state.boxes, state.inputText);
      return {
        boxes: result.boxes,
        validation: result.validation,
      };
    }),
}));
