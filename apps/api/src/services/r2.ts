import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

// ── Allowed upload types ───────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/pdf',
]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const EXTENSION_MAP: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'application/pdf': 'pdf',
};

// ── R2 Client (S3-compatible endpoint) ────────────────────────────────────────

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

// ── Validation helper ─────────────────────────────────────────────────────────

export interface AttachmentValidationError {
  code: 'INVALID_TYPE' | 'TOO_LARGE';
  message: string;
}

export function validateAttachment(
  mimeType: string,
  sizeBytes: number,
): AttachmentValidationError | null {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return {
      code: 'INVALID_TYPE',
      message: 'Only PNG, JPG, and PDF files are accepted.',
    };
  }
  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    return {
      code: 'TOO_LARGE',
      message: 'File size must not exceed 5 MB.',
    };
  }
  return null;
}

// ── Upload function ───────────────────────────────────────────────────────────

/**
 * Uploads a support ticket attachment to Cloudflare R2.
 * Returns the public URL of the uploaded file.
 *
 * @param fileBuffer  The raw file bytes.
 * @param mimeType    The MIME type (already validated before calling this).
 * @param ticketNumber  The ticket reference used to prefix the object key.
 */
export async function uploadSupportAttachment(
  fileBuffer: Buffer,
  mimeType: string,
  ticketNumber: string,
): Promise<string | null> {
  const accessKey = process.env.R2_ACCESS_KEY_ID;
  if (!accessKey || accessKey === 'your_r2_access_key_id') {
    console.warn('[R2 Storage] R2 credentials not configured in .env — skipping file upload to cloud.');
    return null;
  }

  try {
    const ext = EXTENSION_MAP[mimeType] ?? 'bin';
    const objectKey = `support/${ticketNumber}/${randomUUID()}.${ext}`;
    const bucket = process.env.R2_BUCKET_NAME || 'canafri-support';
    const publicUrl = process.env.R2_PUBLIC_URL || '';

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: fileBuffer,
      ContentType: mimeType,
    });

    await r2Client.send(command);

    return `${publicUrl}/${objectKey}`;
  } catch (err) {
    console.error('[R2 Storage] Failed to upload attachment to R2:', err);
    return null;
  }
}
