/**
 * Zod schemas for Keposhka Labeler
 * Phase 7: Validation schemas for save payload
 */
import { z } from 'zod';

/**
 * Schema for a single box in the save payload
 */
export const SaveBoxSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1, 'La etiqueta no puede estar vacía'),
  char_count: z.number().int().min(1).max(3),
  x: z.number().nonnegative('Coordenada X debe ser >= 0'),
  y: z.number().nonnegative('Coordenada Y debe ser >= 0'),
  w: z.number().positive('Ancho debe ser > 0'),
  h: z.number().positive('Alto debe ser > 0'),
});

/**
 * Schema for a single box in draft payload (label can be empty)
 */
export const DraftBoxSchema = z.object({
  id: z.string().uuid(),
  label: z.string(), // Can be empty for drafts
  char_count: z.number().int().min(1).max(3),
  x: z.number().nonnegative('Coordenada X debe ser >= 0'),
  y: z.number().nonnegative('Coordenada Y debe ser >= 0'),
  w: z.number().positive('Ancho debe ser > 0'),
  h: z.number().positive('Alto debe ser > 0'),
});

/**
 * Schema for the save annotation payload
 */
export const SavePayloadSchema = z.object({
  filename: z.string().min(1, 'Nombre de archivo requerido'),
  image_width: z.number().positive('Ancho de imagen debe ser > 0'),
  image_height: z.number().positive('Alto de imagen debe ser > 0'),
  translated_text: z.string(),
  boxes: z.array(SaveBoxSchema).min(1, 'Debe haber al menos una caja'),
  status: z.enum(['pending', 'done']).default('done'),
});

/**
 * Schema for draft save payload (allows empty labels and no boxes)
 */
export const DraftPayloadSchema = z.object({
  filename: z.string().min(1, 'Nombre de archivo requerido'),
  image_width: z.number().positive('Ancho de imagen debe ser > 0'),
  image_height: z.number().positive('Alto de imagen debe ser > 0'),
  translated_text: z.string(),
  boxes: z.array(DraftBoxSchema),
  status: z.literal('pending'),
});

/**
 * Validate the save payload and return a result
 */
export function validateSavePayload(payload: unknown): {
  success: boolean;
  data?: z.infer<typeof SavePayloadSchema>;
  error?: string;
} {
  const result = SavePayloadSchema.safeParse(payload);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Extract first error message
  const firstError = result.error.errors[0];
  const errorPath = firstError.path.join('.');
  const errorMessage = errorPath
    ? `${errorPath}: ${firstError.message}`
    : firstError.message;

  return { success: false, error: errorMessage };
}

/**
 * Validate the draft payload and return a result
 */
export function validateDraftPayload(payload: unknown): {
  success: boolean;
  data?: z.infer<typeof DraftPayloadSchema>;
  error?: string;
} {
  const result = DraftPayloadSchema.safeParse(payload);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Extract first error message
  const firstError = result.error.errors[0];
  const errorPath = firstError.path.join('.');
  const errorMessage = errorPath
    ? `${errorPath}: ${firstError.message}`
    : firstError.message;

  return { success: false, error: errorMessage };
}

export type SavePayload = z.infer<typeof SavePayloadSchema>;
export type SaveBox = z.infer<typeof SaveBoxSchema>;
export type DraftPayload = z.infer<typeof DraftPayloadSchema>;
export type DraftBox = z.infer<typeof DraftBoxSchema>;
