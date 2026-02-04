/**
 * Sorter - Auto-sorting Algorithm for Keposhka Labeler
 *
 * This module receives unsorted boxes and translated text (multiline),
 * and assigns labels based on spatial ordering (left-to-right, top-to-bottom).
 */
import type { BoundingBox } from '@/lib/types';
import { isValidChar, isDigraph } from '@/lib/validator';

/**
 * Result of the sorting and assignment process
 */
export interface SortResult {
  /** Boxes with assigned labels */
  boxes: BoundingBox[];
  /** Whether assignment is complete and valid */
  isBalanced: boolean;
  /** Total characters in text (excluding spaces and newlines) */
  textCharCount: number;
  /** Total charCount sum from all boxes */
  boxCharCount: number;
  /** Indices of unassigned characters in the text */
  unassignedTextIndices: number[];
  /** IDs of boxes without labels */
  unassignedBoxIds: string[];
}

/**
 * Parse text into individual characters (excluding spaces/newlines)
 * Does NOT auto-detect digraphs - that's determined by box charCount
 * Returns an array of { char, index } where index is the position in the original text
 */
export function parseTextToChars(text: string): Array<{ char: string; index: number }> {
  const chars: Array<{ char: string; index: number }> = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    // Skip spaces and newlines
    if (char === ' ' || char === '\n' || char === '\r') {
      continue;
    }

    chars.push({ char, index: i });
  }

  return chars;
}

/**
 * @deprecated Use parseTextToChars instead - digraphs are now determined by charCount
 */
export function parseTextToTokens(text: string): Array<{ char: string; index: number }> {
  return parseTextToChars(text);
}

/**
 * Group boxes into rows based on vertical position
 * Boxes are considered in the same row if their Y-centers are within the threshold
 *
 * @param boxes - Array of bounding boxes
 * @param thresholdMultiplier - Multiplier for row threshold (default 1.0 = 70% of avg height)
 *                              Higher values = more tolerant (fewer rows, good for arcs)
 *                              Lower values = more sensitive (more rows)
 * @returns Array of rows, each containing boxes sorted left-to-right
 */
export function groupBoxesIntoRows(boxes: BoundingBox[], thresholdMultiplier: number = 1.0): BoundingBox[][] {
  if (boxes.length === 0) return [];

  // Calculate average box height for dynamic threshold
  const avgHeight = boxes.reduce((sum, box) => sum + box.height, 0) / boxes.length;

  // Dynamic threshold: ~70% of average box height * multiplier
  // At multiplier 1.0: 70% (default, tolerant of slight inclination)
  // At multiplier 0.5: 35% (more sensitive, detects smaller Y differences as new rows)
  // At multiplier 3.0: 210% (very tolerant, good for arcs - most boxes in same row)
  const rowThreshold = avgHeight * 0.7 * thresholdMultiplier;

  // Sort boxes by Y position first (top to bottom)
  const sortedByY = [...boxes].sort((a, b) => {
    const aCenterY = a.y + a.height / 2;
    const bCenterY = b.y + b.height / 2;
    return aCenterY - bCenterY;
  });

  const rows: BoundingBox[][] = [];
  let currentRow: BoundingBox[] = [sortedByY[0]];
  let currentRowCenterY = sortedByY[0].y + sortedByY[0].height / 2;

  for (let i = 1; i < sortedByY.length; i++) {
    const box = sortedByY[i];
    const boxCenterY = box.y + box.height / 2;

    // Check if this box belongs to the current row
    if (Math.abs(boxCenterY - currentRowCenterY) <= rowThreshold) {
      currentRow.push(box);
      // Update row center Y as average of all boxes in row
      currentRowCenterY =
        currentRow.reduce((sum, b) => sum + b.y + b.height / 2, 0) / currentRow.length;
    } else {
      // Start a new row
      rows.push(currentRow);
      currentRow = [box];
      currentRowCenterY = boxCenterY;
    }
  }

  // Don't forget the last row
  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  // Sort each row left-to-right by X position
  return rows.map((row) =>
    row.sort((a, b) => {
      const aCenterX = a.x + a.width / 2;
      const bCenterX = b.x + b.width / 2;
      return aCenterX - bCenterX;
    })
  );
}

/**
 * Flatten rows into a single ordered array of boxes
 */
export function flattenRows(rows: BoundingBox[][]): BoundingBox[] {
  return rows.flat();
}

/**
 * Check if a character is valid in Keposhka alphabet (single char or digraph)
 * Uses the validator's isValidChar which handles mixed-case digraphs
 */
function isValidKeposhkaChar(char: string): boolean {
  return isValidChar(char);
}

/**
 * Main sorting and assignment function
 *
 * charCount determines how many literal characters from text each box consumes.
 * For example: text "the" with box charCount=2 takes "th" (a valid digraph).
 * This allows the user to control whether "th" is treated as a digraph or as separate t+h.
 *
 * @param boxes - Array of bounding boxes with charCount
 * @param text - Translated text (may be multiline)
 * @param thresholdMultiplier - Multiplier for row detection threshold (default 1.0)
 * @returns SortResult with assigned labels and validation info
 */
export function assignLabels(boxes: BoundingBox[], text: string, thresholdMultiplier: number = 1.0): SortResult {
  // Parse text into individual characters (not auto-detecting digraphs)
  const textChars = parseTextToChars(text);

  // Calculate total expected characters from boxes
  const boxCharCount = boxes.reduce((sum, box) => sum + box.charCount, 0);
  const textCharCount = textChars.length;

  // Group and order boxes spatially
  const rows = groupBoxesIntoRows(boxes, thresholdMultiplier);
  const orderedBoxes = flattenRows(rows);

  // Assign labels to boxes
  const resultBoxes: BoundingBox[] = [];
  const unassignedTextIndices: number[] = [];
  const unassignedBoxIds: string[] = [];

  let charIndex = 0;

  for (const box of orderedBoxes) {
    // Collect N literal characters for this box based on charCount
    const collectedChars: string[] = [];
    const collectedIndices: number[] = [];

    for (let c = 0; c < box.charCount && charIndex < textChars.length; c++) {
      const textChar = textChars[charIndex];
      collectedChars.push(textChar.char);
      collectedIndices.push(textChar.index);
      charIndex++;
    }

    // Combine collected characters into label
    const label = collectedChars.join('');

    // Validate the combined label is a valid Keposhka character
    if (collectedChars.length === box.charCount && isValidKeposhkaChar(label)) {
      // Successfully assigned - label is valid (single char or digraph)
      resultBoxes.push({
        ...box,
        label,
      });
    } else if (collectedChars.length === box.charCount) {
      // Got enough chars but invalid Keposhka character
      // Still assign for display but mark as unassigned
      resultBoxes.push({
        ...box,
        label,
      });
      unassignedBoxIds.push(box.id);
      // Mark all collected indices as unassigned
      unassignedTextIndices.push(...collectedIndices);
    } else if (collectedChars.length > 0) {
      // Partial assignment - not enough characters available
      resultBoxes.push({
        ...box,
        label,
      });
      unassignedBoxIds.push(box.id);
    } else {
      // No characters available for this box
      resultBoxes.push({
        ...box,
        label: undefined,
      });
      unassignedBoxIds.push(box.id);
    }
  }

  // Mark remaining text characters as unassigned
  while (charIndex < textChars.length) {
    unassignedTextIndices.push(textChars[charIndex].index);
    charIndex++;
  }

  // Check if assignment is balanced
  // It's balanced when total literal chars equals box charCount sum and all labels are valid
  const isBalanced =
    textCharCount === boxCharCount &&
    unassignedBoxIds.length === 0 &&
    unassignedTextIndices.length === 0;

  // Create a map for easy lookup by ID
  const resultMap = new Map(resultBoxes.map((b) => [b.id, b]));

  // Return boxes in their original order (preserving the original array order)
  const finalBoxes = boxes.map((originalBox) => resultMap.get(originalBox.id) || originalBox);

  return {
    boxes: finalBoxes,
    isBalanced,
    textCharCount,
    boxCharCount,
    unassignedTextIndices,
    unassignedBoxIds,
  };
}

/**
 * Convenience function to recalculate box labels
 * Call this whenever boxes or text changes
 */
export function recalculateLabels(
  boxes: BoundingBox[],
  text: string
): { boxes: BoundingBox[]; isBalanced: boolean } {
  const result = assignLabels(boxes, text);
  return {
    boxes: result.boxes,
    isBalanced: result.isBalanced,
  };
}

/**
 * Predict the optimal charCount for a new box based on its position
 * and whether the next characters in the text form a digraph.
 *
 * @param existingBoxes - Currently existing boxes
 * @param newBox - The new box being added (without charCount/label)
 * @param text - The translated text
 * @param thresholdMultiplier - Multiplier for row detection threshold (default 1.0)
 * @returns 2 if the next characters form a digraph, 1 otherwise
 */
export function predictCharCountForNewBox(
  existingBoxes: BoundingBox[],
  newBox: Omit<BoundingBox, 'charCount' | 'label'>,
  text: string,
  thresholdMultiplier: number = 1.0
): number {
  // Parse text into individual characters
  const textChars = parseTextToChars(text);

  // If no text, default to 1
  if (textChars.length === 0) {
    return 1;
  }

  // Create a temporary box with charCount=1 to determine its position
  const tempBox: BoundingBox = { ...newBox, charCount: 1 } as BoundingBox;
  const allBoxes = [...existingBoxes, tempBox];

  // Group and order boxes spatially
  const rows = groupBoxesIntoRows(allBoxes, thresholdMultiplier);
  const orderedBoxes = flattenRows(rows);

  // Find the position of the new box in the sorted order
  const newBoxIndex = orderedBoxes.findIndex((b) => b.id === newBox.id);

  // Calculate how many characters are consumed by boxes before this one
  let charsConsumed = 0;
  for (let i = 0; i < newBoxIndex; i++) {
    charsConsumed += orderedBoxes[i].charCount;
  }

  // Check if there are enough characters for a potential digraph
  const nextIndex = charsConsumed;
  if (nextIndex >= textChars.length) {
    return 1; // No more characters available
  }

  // Check if the next two characters form a digraph
  if (nextIndex < textChars.length - 1) {
    const twoChars = textChars[nextIndex].char + textChars[nextIndex + 1].char;
    if (isDigraph(twoChars)) {
      return 2;
    }
  }

  return 1;
}

/**
 * Re-predict charCount for all boxes with charCount=1 based on updated text.
 * This is called when text is inserted (e.g., from reference panel) to detect
 * digraphs that should be assigned to existing boxes.
 *
 * Only updates boxes that have charCount=1 (default/single char) - boxes that
 * were manually set to 2 or 3 are preserved.
 *
 * @param boxes - Current boxes
 * @param text - The translated text
 * @param thresholdMultiplier - Multiplier for row detection threshold
 * @returns Updated boxes with predicted charCounts
 */
export function repredictDigraphsForBoxes(
  boxes: BoundingBox[],
  text: string,
  thresholdMultiplier: number = 1.0
): BoundingBox[] {
  if (boxes.length === 0) return boxes;

  // Parse text into individual characters
  const textChars = parseTextToChars(text);

  if (textChars.length === 0) return boxes;

  // Group and order boxes spatially
  const rows = groupBoxesIntoRows(boxes, thresholdMultiplier);
  const orderedBoxes = flattenRows(rows);

  // Map to track updated charCounts by box ID
  const updatedCharCounts = new Map<string, number>();

  // Walk through ordered boxes and predict charCount for each
  let charIndex = 0;
  for (const box of orderedBoxes) {
    // Only re-predict for boxes with charCount=1 (not manually set to 2+)
    if (box.charCount === 1) {
      // Check if the next two characters form a digraph
      if (charIndex < textChars.length - 1) {
        const twoChars = textChars[charIndex].char + textChars[charIndex + 1].char;
        if (isDigraph(twoChars)) {
          updatedCharCounts.set(box.id, 2);
          charIndex += 2;
          continue;
        }
      }
      // Not a digraph, consume 1 char
      charIndex += 1;
    } else {
      // Box has charCount > 1 (manually set), preserve it
      charIndex += box.charCount;
    }
  }

  // If no updates needed, return original boxes
  if (updatedCharCounts.size === 0) return boxes;

  // Apply updates to boxes (preserving original order)
  return boxes.map((box) => {
    const newCharCount = updatedCharCounts.get(box.id);
    if (newCharCount !== undefined) {
      return { ...box, charCount: newCharCount };
    }
    return box;
  });
}
