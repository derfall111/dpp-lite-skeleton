import fs from 'fs';
import path from 'path';

const driver = process.env.STORAGE_DRIVER ?? 'local';
const uploadDir = process.env.UPLOAD_DIR ?? './uploads';

export async function saveBufferToStorage(filename: string, buffer: Buffer): Promise<string> {
  if (driver === 'local') {
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fullPath = path.join(uploadDir, `${Date.now()}_${safeName}`);
    await fs.promises.writeFile(fullPath, buffer);
    return fullPath; // for MVP, we store local path; replace with S3 URL later
  }
  // TODO: implement S3
  throw new Error('Unsupported STORAGE_DRIVER for now');
}
