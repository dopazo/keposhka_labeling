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

// Mixed-case digraphs (e.g., "Th") that map to uppercase digraphs
export const MIXED_CASE_DIGRAPHS: readonly string[] = ['Ch', 'Gh', 'Sh', 'Th'];

// All valid digraphs including mixed-case variants
const ALL_DIGRAPHS = new Set([...DIGRAPHS, ...MIXED_CASE_DIGRAPHS]);

// Create a Set for faster lookup
const VALID_CHARS = new Set(KEPOSHKA_ALPHABET);

/**
 * Normalize a digraph to its canonical form
 * Mixed-case digraphs (Th, Ch, etc.) are normalized to uppercase (TH, CH, etc.)
 */
export function normalizeDigraph(label: string): string {
  if (MIXED_CASE_DIGRAPHS.includes(label)) {
    return label.toUpperCase();
  }
  return label;
}

/**
 * Convert label to YOLO class ID
 * Mixed-case digraphs (Th, Ch, etc.) are normalized to uppercase before lookup
 */
export function labelToClassId(label: string): number {
  const normalized = normalizeDigraph(label);
  return KEPOSHKA_ALPHABET.indexOf(normalized);
}

/**
 * Convert YOLO class ID to label
 */
export function classIdToLabel(classId: number): string {
  return KEPOSHKA_ALPHABET[classId];
}

/**
 * Check if a character is valid in Keposhka alphabet
 * Accepts mixed-case digraphs (Th, Ch, etc.)
 */
export function isValidChar(char: string): boolean {
  if (VALID_CHARS.has(char)) return true;
  // Also accept mixed-case digraphs
  if (MIXED_CASE_DIGRAPHS.includes(char)) return true;
  return false;
}

/**
 * Check if a string is a digraph (including mixed-case variants)
 */
export function isDigraph(str: string): boolean {
  return ALL_DIGRAPHS.has(str);
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
