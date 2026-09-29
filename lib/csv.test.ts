import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv } from "./csv.ts";
import { parseBooks } from "./books.ts";
test("CSV handles BOM, quoted commas, escaped quotes, multiline fields and CRLF", () => {
  assert.deepEqual(parseCsv('\uFEFFa,b,c\r\n"หนึ่ง,สอง","เขียน ""คำ""","บรรทัดแรก\nบรรทัดสอง"\r\n'),
    [["a","b","c"],["หนึ่ง,สอง",'เขียน "คำ"',"บรรทัดแรก\nบรรทัดสอง"]]);
  assert.throws(() => parseCsv('a,"unfinished'));
});
test("public CSV respects image approval, visibility and sold-out status", () => {
  const csv = 'id,title,author,category,price,stock,status,cover,cover_approved,published\nA,หนึ่ง,คน,นิยาย,250,2,พร้อมขาย,https://example.com/a.jpg,อนุมัติ,TRUE\nB,สอง,คน,นิยาย,200,0,สินค้าหมด,https://example.com/private.jpg,ไม่อนุมัติ,TRUE\nC,ซ่อน,คน,นิยาย,100,1,พร้อมขาย,,,FALSE';
  const books = parseBooks(parseCsv(csv));
  assert.equal(books.length, 2);
  assert.equal(books[0].cover, "https://example.com/a.jpg");
  assert.equal(books[1].cover, "");
  assert.equal(books[1].available, false);
  assert.equal(parseBooks(parseCsv(csv.split("\n")[0])).length, 0);
});
