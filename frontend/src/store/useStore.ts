/**
 * Zustand Store for Keposhka Labeler
 * Phase 5: Navigation and Image List
 */
import { create } from 'zustand';
import type { BoundingBox, ImageMeta, AnnotationMetadata } from '@/lib/types';
import { assignLabels } from '@/lib/sorter';
import { validateInput } from '@/lib/validator';

export type FilterStatus = 'all' | 'done' | 'pending';

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

  // Phase 5: Filter & Search State
  filterStatus: FilterStatus;
  searchQuery: string;
  isLoadingAnnotation: boolean;

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
  updateImageStatus: (filename: string, status: 'pending' | 'done') => void;

  // Phase 5: Actions - Filter & Search
  setFilterStatus: (status: FilterStatus) => void;
  setSearchQuery: (query: string) => void;
  selectImage: (image: ImageMeta) => Promise<void>;
  selectNextImage: () => void;
  selectPreviousImage: () => void;
  loadAnnotation: (filename: string) => Promise<void>;

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

// Helper to get filtered images based on current filter and search
function getFilteredImages(
  images: ImageMeta[],
  filterStatus: FilterStatus,
  searchQuery: string
): ImageMeta[] {
  return images.filter((img) => {
    // Apply status filter
    if (filterStatus !== 'all' && img.status !== filterStatus) {
      return false;
    }
    // Apply search query
    if (searchQuery && !img.filename.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });
}

export const useStore = create<AppState>((set, get) => ({
  // Initial State
  boxes: [],
  currentImage: null,
  inputText: '',
  images: [],
  selectedBoxId: null,
  validation: initialValidation,

  // Phase 5: Filter & Search State
  filterStatus: 'all',
  searchQuery: '',
  isLoadingAnnotation: false,

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

  updateImageStatus: (filename, status) =>
    set((state) => ({
      images: state.images.map((img) =>
        img.filename === filename ? { ...img, status } : img
      ),
    })),

  // Phase 5: Filter & Search Actions
  setFilterStatus: (status) => set({ filterStatus: status }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  loadAnnotation: async (filename) => {
    set({ isLoadingAnnotation: true });
    try {
      const response = await fetch(`/api/annotations/${filename}`);
      if (response.ok) {
        const data: AnnotationMetadata = await response.json();
        // Load boxes and text from annotation
        const boxes: BoundingBox[] = data.boxes.map((box) => ({
          id: box.id,
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          charCount: box.charCount,
          label: box.label,
        }));
        const result = recalculateState(boxes, data.translatedText);
        set({
          boxes: result.boxes,
          inputText: data.translatedText,
          validation: result.validation,
          isLoadingAnnotation: false,
        });
      } else if (response.status === 404) {
        // No existing annotation, start fresh
        set({
          boxes: [],
          inputText: '',
          validation: initialValidation,
          isLoadingAnnotation: false,
        });
      } else {
        console.error('Error loading annotation:', response.statusText);
        set({ isLoadingAnnotation: false });
      }
    } catch (error) {
      console.error('Error loading annotation:', error);
      set({ isLoadingAnnotation: false });
    }
  },

  selectImage: async (image) => {
    const state = get();
    // Don't reload if same image
    if (state.currentImage?.filename === image.filename) return;

    // Reset and load new image
    set({
      currentImage: image,
      selectedBoxId: null,
    });

    // Load existing annotations if available
    await get().loadAnnotation(image.filename);
  },

  selectNextImage: () => {
    const state = get();
    const filteredImages = getFilteredImages(
      state.images,
      state.filterStatus,
      state.searchQuery
    );
    if (filteredImages.length === 0) return;

    const currentIndex = state.currentImage
      ? filteredImages.findIndex((img) => img.filename === state.currentImage!.filename)
      : -1;

    const nextIndex = currentIndex < filteredImages.length - 1 ? currentIndex + 1 : 0;
    get().selectImage(filteredImages[nextIndex]);
  },

  selectPreviousImage: () => {
    const state = get();
    const filteredImages = getFilteredImages(
      state.images,
      state.filterStatus,
      state.searchQuery
    );
    if (filteredImages.length === 0) return;

    const currentIndex = state.currentImage
      ? filteredImages.findIndex((img) => img.filename === state.currentImage!.filename)
      : 0;

    const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredImages.length - 1;
    get().selectImage(filteredImages[prevIndex]);
  },

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
