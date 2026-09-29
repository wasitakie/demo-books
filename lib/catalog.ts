import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Book } from './books';

export async function getCatalog(): Promise<{ books: Book[]; status: 'live' }> {
  const content = await readFile(path.join(process.cwd(), '.generated/catalog.json'), 'utf8');
  const snapshot = JSON.parse(content);
  return { books: snapshot.books, status: 'live' };
}
