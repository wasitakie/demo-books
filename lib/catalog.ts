import 'server-only';
import { JWT } from 'google-auth-library';
import { driveFileId, parseBooks, type Book } from './books';
import { demoBooks } from './demo';
import { normalizePrivateKey } from './google-private-key';

export async function getCatalog(publicCovers = true): Promise<{books: Book[]; status: 'live' | 'demo' | 'error'}> {
  const id = process.env.GOOGLE_SHEET_ID?.trim();
  if (!id) return {books: demoBooks, status: 'demo'};
  let failure = 'Invalid GOOGLE_SHEET_ID. Use the spreadsheet ID, not the full URL.';
  try {
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error('Invalid spreadsheet ID');
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
    const key = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY);
    failure = 'Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY.';
    if (!email || !key) throw new Error('Missing server credentials');
    failure = 'Google authentication failed. Check the service account email and private key.';
    const auth = new JWT({email, key, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']});
    const token = await auth.getAccessToken();
    if (!token.token) throw new Error('Missing Google access token');
    let requestedRange = process.env.GOOGLE_SHEET_RANGE?.trim() || 'Books!A1:Z1000';
    const gid = process.env.GOOGLE_SHEET_GID?.trim();
    if (gid) {
      failure = 'Invalid GOOGLE_SHEET_GID. Use the numeric gid from the spreadsheet URL.';
      if (!/^\d+$/.test(gid)) throw new Error('Invalid sheet gid');
      failure = 'Could not read spreadsheet tabs. Check network access and spreadsheet permissions.';
      const metadata = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}?fields=sheets.properties(sheetId,title)`, {headers: {Authorization: `Bearer ${token.token}`}, cache: 'force-cache', signal: AbortSignal.timeout(10000)});
      if (!metadata.ok) {
        failure = `Google Sheets metadata returned HTTP ${metadata.status}. Check spreadsheet access.`;
        throw new Error('Spreadsheet metadata rejected');
      }
      const spreadsheet = await metadata.json() as {sheets?: {properties?: {sheetId: number; title: string}}[]};
      const tab = spreadsheet.sheets?.find(sheet => String(sheet.properties?.sheetId) === gid)?.properties;
      failure = `No tab matches GOOGLE_SHEET_GID=${gid}. Check the gid in the spreadsheet URL.`;
      if (!tab) throw new Error('Tab not found');
      // With gid configured, the range is cells only; use the current tab name.
      const cells = requestedRange.slice(requestedRange.lastIndexOf('!') + 1);
      requestedRange = `'${tab.title.replace(/'/g, "''")}'!${cells}`;
    }
    const range = encodeURIComponent(requestedRange);
    failure = 'Google Sheets request failed or timed out. Check network access and try again.';
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${range}?valueRenderOption=UNFORMATTED_VALUE`, {headers: {Authorization: `Bearer ${token.token}`}, cache: 'force-cache', signal: AbortSignal.timeout(10000)});
    if (!response.ok) {
      failure = response.status === 400
        ? 'Google Sheets rejected the range. Check GOOGLE_SHEET_RANGE and GOOGLE_SHEET_GID; the range must include the header row.'
        : `Google Sheets returned HTTP ${response.status}. Check the Sheets API, spreadsheet ID, range, and service account sharing permissions.`;
      throw new Error('Google Sheets request rejected');
    }
    failure = 'Invalid Google Sheets data. Check the Books tab and required column headers.';
    const data = await response.json();
    const books = parseBooks(data.values || [], process.env.SHOP_ORDER_URL).map(book => publicCovers && driveFileId(book.cover)
      ? {...book, cover: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/covers/${encodeURIComponent(book.id)}`}
      : book);
    return {books, status: 'live'};
  } catch {
    // Do not attach raw authentication errors: they may contain credentials or headers.
    throw new Error(`Book catalog could not be loaded. ${failure}`);
  }
}
