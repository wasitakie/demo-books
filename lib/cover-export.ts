import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import type { Book } from './books.ts';
import { driveFileId } from './books.ts';

const extensions: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'image/gif': 'gif', 'image/avif': 'avif',
};
export async function exportCovers(
  books: Book[],
  download: (fileId: string, resourceKey: string | null) => Promise<{ bytes: Buffer; mime: string }>,
  directory: string,
  basePath = '',
) {
  const staging = directory + '-staging';
  await fs.rm(staging, { recursive: true, force: true });
  await fs.mkdir(staging, { recursive: true });
  const output: Book[] = [];
  const unavailable: string[] = [];
  for (const original of books) {
    const book = { ...original };
    const fileId = driveFileId(book.cover);
    if (fileId) {
      const resourceKey = new URL(book.cover).searchParams.get('resourcekey');
      book.cover = '';
      try {
        const { bytes, mime } = await download(fileId, resourceKey);
        if (!extensions[mime] || !bytes.length || bytes.length > 10 * 1024 * 1024) {
          throw new Error('Unsupported cover');
        }
        const name = createHash('sha256').update(bytes).digest('hex') + '.' + extensions[mime];
        await fs.writeFile(path.join(staging, name), bytes);
        book.cover = basePath + '/generated-covers/' + name;
      } catch { unavailable.push(book.id); }
    }
    output.push(book);
  }
  await fs.rm(directory, { recursive: true, force: true });
  await fs.rename(staging, directory);
  return { books: output, unavailable };
}
