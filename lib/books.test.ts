import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseBooks, safeUrl } from './books.ts';
const headers = ['id','title','author','category','price','cover','description','buy_url','available','published'];
test('reads the live Sheet approval column and denies unapproved images', () => {
  const books = parseBooks([[...headers, 'อนุมัติแสดงลิงค์รูปภาพ'],
    ['BK-0001', 'Approved', '', '', 100, 'https://drive.google.com/open?id=allowed', '', '', true, true, 'อนุมัติ'],
    ['BK-0002', 'Not approved', '', '', 100, 'https://drive.google.com/open?id=blocked', '', '', true, true, 'ไม่อนุมัติ'],
  ]);
  assert.equal(books[0].cover, 'https://drive.google.com/thumbnail?id=allowed&sz=w1600');
  assert.equal(books[1].cover, '');
  assert.ok(!JSON.stringify(books).includes('blocked'));
});
test('requires explicit image approval and removes revoked or pending source URLs', () => {
  const source = 'https://drive.google.com/open?id=private-file';
  for (const approval of [undefined, '', false, 'รออนุมัติ', 'ไม่อนุมัติ', 'FALSE', 'yes']) {
    const books = parseBooks([[...headers, 'อนุมัติรูปภาพ'], ['1', 'Book', 'Author', 'Books', 100, source, '', '', true, true, approval]]);
    assert.equal(books[0].cover, '');
    assert.ok(!JSON.stringify(books).includes('private-file'));
  }
  for (const approval of [true, 'TRUE', 'อนุมัติแล้ว']) {
    const books = parseBooks([[...headers, 'อนุมัติรูปภาพ'], ['1', 'Book', 'Author', 'Books', 100, source, '', '', true, true, approval]]);
    assert.equal(books[0].cover, 'https://drive.google.com/thumbnail?id=private-file&sz=w1600');
  }
  assert.equal(parseBooks([headers, ['1', 'Book', 'Author', 'Books', 100, source]])[0].cover, '');
  assert.deepEqual(parseBooks([[...headers, 'cover_approved'], ['1', 'Book', 'Author', 'Books', 100, source, '', '', true, false, true]]), []);
});
test('parses Sheets rows, Thai text, stock, numbers and safe URLs', () => {
  const books = parseBooks([headers, ['1','หนังสือ','ผู้เขียน','นิยาย',295,'https://example.com/cover.jpg','อ่าน, แล้วสุข','https://example.com/buy',false,true]]);
  assert.equal(books[0].price,295); assert.equal(books[0].available,false); assert.equal(books[0].description,'อ่าน, แล้วสุข');
});
test('ignores unpublished, duplicate and invalid records', () => {
  const rows = [headers,['1','a','b','c','200'],['1','duplicate','b','c','100'],['2','hidden','b','c',100,'','','',true,false],['3','invalid','b','c','bad'],['4','empty price','b','c',''],['5','negative','b','c',-5]];
  assert.equal(parseBooks(rows).length,1);
});
test('rejects executable and insecure URLs', () => { assert.equal(safeUrl('javascript:alert(1)'), ''); assert.equal(safeUrl('http://example.com'), ''); assert.equal(safeUrl('https://example.com/'), 'https://example.com/'); });
test('detects wrong schema and accepts empty sheets', () => { assert.throws(() => parseBooks([['name']])); assert.deepEqual(parseBooks([]), []); });
test('finds headers below a title row when reading from A1', () => {
  const books = parseBooks([['ทะเบียนหนังสือ'], headers, ['1', 'Book', 'Author', 'Novel', 250]]);
  assert.equal(books.length, 1);
  assert.equal(books[0].title, 'Book');
});
test('reads Form headers, decimal prices, stock and dropdown status', () => {
  const formHeaders = ['รหัสหนังสือ', 'ชื่อหนังสือ', 'ชื่อผู้แต่ง', 'หมวดหมู่', 'ราคา (บาท)', 'Stock (จำนวนคงเหลือ)', 'Status (สถานะ)'];
  const books = parseBooks([formHeaders,
    ['A', 'หนังสือ', 'ผู้แต่ง', 'นิยาย', '1,250.50', 12, 'พร้อมขาย'],
    ['B', 'หมด', 'ผู้แต่ง', 'นิยาย', 0, 0, 'สินค้าหมด'],
    ['C', 'จอง', 'ผู้แต่ง', 'นิยาย', 100, 0, 'พรีออเดอร์'],
    ['D', 'เลิกขาย', 'ผู้แต่ง', 'นิยาย', 100, 5, 'หยุดจำหน่าย'],
  ]);
  assert.equal(books[0].price, 1250.5);
  assert.equal(books[0].stock, 12);
  assert.equal(books[0].status, 'พร้อมขาย');
  assert.equal(books[1].available, false);
  assert.equal(books[2].available, true);
  assert.equal(books[3].available, false);
});
test('keeps missing or invalid stock unknown and blocks zero-stock purchases', () => {
  const books = parseBooks([[...headers, 'stock', 'status'],
    ['A', 'a', '', '', 100],
    ['B', 'b', '', '', 100, '', '', '', true, true, -1],
    ['C', 'c', '', '', 100, '', '', '', true, true, 1.5],
    ['D', 'd', '', '', 100, '', '', '', true, true, 0, 'พร้อมขาย'],
  ]);
  assert.deepEqual(books.map(book => book.stock), [null, null, null, 0]);
  assert.equal(books[3].available, false);
});
test('uses valid per-book order links before a safe shop fallback and supports Thai headers', () => {
  const rows = [['id', 'title', 'author', 'category', 'price', 'ลิงก์สั่งซื้อ'],
    ['A', 'Book A', '', '', 100, 'https://example.com/book'],
    ['B', 'Book B', '', '', 100, ''],
    ['C', 'Book C', '', '', 100, 'javascript:alert(1)']];
  assert.deepEqual(parseBooks(rows, 'https://example.com/shop').map(b => b.buyUrl),
    ['https://example.com/book', 'https://example.com/shop', 'https://example.com/shop']);
  assert.equal(parseBooks(rows, 'javascript:alert(1)')[1].buyUrl, '');
});
