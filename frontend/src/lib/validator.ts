/**
 * Keposhka Alphabet Validation and Mapping
 */

// Keposhka alphabet ordered (70 characters, index = YOLO class)
export const KEPOSHKA_ALPHABET: readonly string[] = [
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',  // 0-9
  'A', 'a', 'B', 'b', 'C', 'c', 'CH', 'ch',          // 10-17
  'D', 'd', 'E', 'e', 'F', 'f', 'G', 'g', 'GH', 'gh', // 18-27
  'H', 'h', 'I', 'i', 'J', 'j', 'K', 'k', 'L', 'l',  // 28-37
  'M', 'm', 'N', 'n', 'O', 'o', 'P', 'p', 'Q', 'q',  // 38-47
  'R', 'r', 'S', 's', 'SH', 'sh', 'T', 't', 'TH', 'th', // 48-57
  'U', 'u', 'V', 'v', 'W', 'w', 'X', 'x', 'Y', 'y',  // 58-67
  'Z', 'z'                                            // 68-69
];

export const DIGRAPHS: readonly string[] = ['CH', 'ch', 'GH', 'gh', 'SH', 'sh', 'TH', 'th'];

// Create a Set for faster lookup
const VALID_CHARS = new Set(KEPOSHKA_ALPHABET);

/**
 * Convert label to YOLO class ID
 */
export function labelToClassId(label: string): number {
  return KEPOSHKA_ALPHABET.indexOf(label);
}

/**
 * Convert YOLO class ID to label
 */
export function classIdToLabel(classId: number): string {
  return KEPOSHKA_ALPHABET[classId];
}

/**
 * Check if a character is valid in Keposhka alphabet
 */
export function isValidChar(char: string): boolean {
  return VALID_CHARS.has(char);
}

/**
 * Check if a string is a digraph
 */
export function isDigraph(str: string): boolean {
  return DIGRAPHS.includes(str as any);
}

/**
 * Validate input text and return invalid characters
 */
export function validateInput(text: string): {
  isValid: boolean;
  invalidChars: Array<{ char: string; index: number }>;
} {
  const invalidChars: Array<{ char: string; index: number }> = [];
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    // Skip spaces and newlines (they're valid but not part of alphabet)
    if (char === ' ' || char === '\n' || char === '\r') {
      i++;
      continue;
    }

    // Check for digraphs (2-char sequences)
    if (i < text.length - 1) {
      const twoChar = text.slice(i, i + 2);
      if (isDigraph(twoChar)) {
        i += 2;
        continue;
      }
    }

    // Check single character
    if (!isValidChar(char)) {
      invalidChars.push({ char, index: i });
    }

    i++;
  }

  return {
    isValid: invalidChars.length === 0,
    invalidChars
  };
}
