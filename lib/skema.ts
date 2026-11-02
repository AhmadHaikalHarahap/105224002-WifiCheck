import { z } from 'zod';

// Helper untuk menghitung byte UTF-8
function utf8ByteLength(str: string): number {
  return new TextEncoder().encode(str).length;
}

export const assessmentSchema = z.object({
  ssid: z
    .string({ error: 'Nama jaringan (SSID) wajib diisi.' })
    .trim()
    .min(1, 'Nama jaringan (SSID) wajib diisi.')
    .refine(
      (val) => utf8ByteLength(val) <= 32,
      'Nama jaringan tidak boleh melebihi 32 byte UTF-8.'
    ),
  securityProtocol: z.enum(['open', 'wep', 'wpa2', 'wpa3', 'unknown'], {
    error: 'Protokol keamanan yang dipilih tidak valid.',
  }),
  passwordProtection: z.enum(['enabled', 'disabled', 'unknown'], {
    error: 'Status perlindungan password tidak valid.',
  }),
  wpsEnabled: z.enum(['enabled', 'disabled', 'unknown'], {
    error: 'Status WPS tidak valid.',
  }),
  firmwareStatus: z.enum(['up-to-date', 'outdated', 'unknown'], {
    error: 'Status firmware tidak valid.',
  }),
  notes: z
    .string()
    .max(250, 'Catatan tidak boleh melebihi 250 karakter.')
    .optional()
    .default(''),
});

export type AssessmentFormData = z.infer<typeof assessmentSchema>;
