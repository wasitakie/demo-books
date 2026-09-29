import fs from 'node:fs/promises';
import path from 'node:path';
import { loadEnvFile } from 'node:process';
import { JWT } from 'google-auth-library';
import { parseBooks } from '../lib/books.ts';
import { normalizePrivateKey } from '../lib/google-private-key.ts';
import { exportCovers } from '../lib/cover-export.ts';

try { loadEnvFile('.env.local'); } catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const sheetId = process.env.GOOGLE_SHEET_ID || '1yQQD7nZDwaK_qRpz6jw9WlEKu2ek6VYB1HNk4aWKs7s';
const gid = process.env.GOOGLE_SHEET_GID || '257320421';
const generated = path.resolve('.generated');
const covers = path.resolve('public/generated-covers');

async function main() {
  await fs.mkdir(generated, { recursive: true });
  await fs.rm(path.join(generated, 'catalog.json'), { force: true });
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const key = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY);
  if (!email || !key) throw new Error('Missing credentials');
  if (!/^[\w-]+$/.test(sheetId) || !/^\d+$/.test(gid)) throw new Error('Invalid Sheet ID or gid');
  const auth = new JWT({ email, key, scopes: [
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/drive.readonly',
  ] });
  const token = await auth.getAccessToken();
  if (!token.token) throw new Error('Google authentication failed');
  const headers = { Authorization: 'Bearer ' + token.token };
  async function json(url) {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error('Sheets request failed');
    return response.json();
  }
  const root = 'https://sheets.googleapis.com/v4/spreadsheets/' + sheetId;
  const metadata = await json(root + '?fields=sheets.properties(sheetId,title)');
  const tab = metadata.sheets?.find(s => String(s.properties?.sheetId) === gid)?.properties;
  if (!tab) throw new Error('Sheet tab not found');
  const cells = (process.env.GOOGLE_SHEET_RANGE || 'A1:Z1000').split('!').pop();
  const range = "'" + tab.title.replaceAll("'", "''") + "'!" + cells;
  const data = await json(root + '/values/' + encodeURIComponent(range) + '?valueRenderOption=UNFORMATTED_VALUE');
  const books = parseBooks(data.values || [], process.env.SHOP_ORDER_URL);
  const result = await exportCovers(books, async (fileId, resourceKey) => {
    const response = await auth.request({
      url: 'https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media&supportsAllDrives=true',
      headers: resourceKey ? { 'X-Goog-Drive-Resource-Keys': fileId + '/' + resourceKey } : {},
      responseType: 'arraybuffer', timeout: 20000, maxContentLength: 10 * 1024 * 1024,
      validateStatus: () => true,
    });
    if (response.status !== 200) {
      console.warn('Drive cover download HTTP ' + response.status);
      throw new Error('Image request failed');
    }
    return {
      bytes: Buffer.from(response.data),
      mime: response.headers.get('content-type')?.split(';')[0].trim() || '',
    };
  }, covers, process.env.NEXT_PUBLIC_BASE_PATH || '');
  for (const id of result.unavailable) console.warn('Cover unavailable for ' + id + '; check Drive file access.');

  await fs.writeFile(path.join(generated, 'catalog.json'), JSON.stringify({
    books: result.books, status: 'live', syncedAt: new Date().toISOString(),
  }));
  console.log('Catalog prepared: ' + books.length + ' books, ' + result.unavailable.length + ' unavailable images.');
}
main().catch(() => {
  // Google error objects may contain credentials or request headers.
  console.error('Catalog preparation failed. Check Sheet ID/gid, credentials, API access and required columns. Deployment stopped.');
  process.exitCode = 1;
});
