import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { exportCovers } from './cover-export.ts';
import { parseBooks } from './books.ts';

test('cover export removes revoked files, strips private links, and versions changed images', async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'cover-export-'));
  const destination = path.join(temp, 'generated-covers');
  const headers = ['id','title','author','category','price','cover','cover_approved','published'];
  const row = ['A','Book','','',100,'https://drive.google.com/open?id=private-id',true,true];
  try {
    const books = parseBooks([headers,row]);
    const first = await exportCovers(books, async () => ({bytes: Buffer.from('first'),mime:'image/png'}), destination, '/demo-books');
    assert.ok(first.books[0].cover.startsWith('/demo-books/generated-covers/'));
    assert.ok(!JSON.stringify(first).includes('private-id'));
    const second = await exportCovers(books, async () => ({bytes: Buffer.from('second'),mime:'image/png'}), destination);
    assert.notEqual(path.basename(first.books[0].cover), path.basename(second.books[0].cover));
    assert.equal((await fs.readdir(destination)).length, 1);
    const revoked = parseBooks([headers,[...row.slice(0,6),false,true]]);
    const clean = await exportCovers(revoked, async () => { throw Error('must not fetch'); }, destination);
    assert.equal(clean.books[0].cover,'');
    assert.deepEqual(await fs.readdir(destination), []);
    const failed = await exportCovers(books, async () => { throw Error('404'); }, destination);
    assert.equal(failed.books[0].cover,'');
    assert.deepEqual(failed.unavailable,['A']);
    assert.ok(!JSON.stringify(failed).includes('private-id'));
  } finally { await fs.rm(temp,{recursive:true,force:true}); }
});
