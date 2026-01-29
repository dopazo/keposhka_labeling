/**
 * Sorter - Auto-sorting Algorithm for Keposhka Labeler
 *
 * This module receives unsorted boxes and translated text (multiline),
 * and assigns labels based on spatial ordering (left-to-right, top-to-bottom).
 */
import type { BoundingBox } from '@/lib/types';
import { isDigraph, KEPOSHKA_ALPHABET } from '@/lib/validator';

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
 * Parse text into tokens, respecting digraphs
 * Each token represents one character that should be assigned to a box
 * Returns an array of { char, index } where index is the position in the original text
 */
export function parseTextToTokens(text: string): Array<{ char: string; index: number }> {
  const tokens: Array<{ char: string; index: number }> = [];
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    // Skip spaces and newlines
    if (char === ' ' || char === '\n' || char === '\r') {
      i++;
      continue;
    }

    // Check for digraphs (2-char sequences)
    if (i < text.length - 1) {
      const twoChar = text.slice(i, i + 2);
      if (isDigraph(twoChar)) {
        tokens.push({ char: twoChar, index: i });
        i += 2;
        continue;
      }
    }

    // Single character
    tokens.push({ char, index: i });
    i++;
  }

  return tokens;
}

/**
 * Group boxes into rows based on vertical position
 * Boxes are considered in the same row if their Y-centers are within the threshold
 *
 * @param boxes - Array of bounding boxes
 * @returns Array of rows, each containing boxes sorted left-to-right
 */
export function groupBoxesIntoRows(boxes: BoundingBox[]): BoundingBox[][] {
  if (boxes.length === 0) return [];

  // Calculate average box height for dynamic threshold
  const avgHeight = boxes.reduce((sum, box) => sum + box.height, 0) / boxes.length;

  // Dynamic threshold: ~30% of average box height
  const rowThreshold = avgHeight * 0.3;

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
 */
function isValidKeposhkaChar(char: string): boolean {
  return KEPOSHKA_ALPHABET.includes(char);
}

/**
 * Main sorting and assignment function
 *
 * @param boxes - Array of bounding boxes with charCount
 * @param text - Translated text (may be multiline)
 * @returns SortResult with assigned labels and validation info
 */
export function assignLabels(boxes: BoundingBox[], text: string): SortResult {
  // Parse text into tokens
  const tokens = parseTextToTokens(text);

  // Calculate total expected characters from boxes
  const boxCharCount = boxes.reduce((sum, box) => sum + box.charCount, 0);
  const textCharCount = tokens.length;

  // Group and order boxes spatially
  const rows = groupBoxesIntoRows(boxes);
  const orderedBoxes = flattenRows(rows);

  // Assign labels to boxes
  const resultBoxes: BoundingBox[] = [];
  const unassignedTextIndices: number[] = [];
  const unassignedBoxIds: string[] = [];

  let tokenIndex = 0;

  for (const box of orderedBoxes) {
    // Collect characters for this box based on charCount
    const chars: string[] = [];

    for (let c = 0; c < box.charCount && tokenIndex < tokens.length; c++) {
      const token = tokens[tokenIndex];

      // Only assign if the character is valid in Keposhka alphabet
      if (isValidKeposhkaChar(token.char)) {
        chars.push(token.char);
        tokenIndex++;
      } else {
        // Invalid character - skip and mark as unassigned
        unassignedTextIndices.push(token.index);
        tokenIndex++;
        c--; // Don't count invalid characters
      }
    }

    if (chars.length === box.charCount) {
      // Successfully assigned all characters
      resultBoxes.push({
        ...box,
        label: chars.join(''),
      });
    } else if (chars.length > 0) {
      // Partial assignment
      resultBoxes.push({
        ...box,
        label: chars.join(''),
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

  // Mark remaining tokens as unassigned
  while (tokenIndex < tokens.length) {
    unassignedTextIndices.push(tokens[tokenIndex].index);
    tokenIndex++;
  }

  // Check if assignment is balanced
  // It's balanced when we have the right number of valid characters
  const validTokenCount = tokens.filter((t) => isValidKeposhkaChar(t.char)).length;
  const isBalanced =
    validTokenCount === boxCharCount &&
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
