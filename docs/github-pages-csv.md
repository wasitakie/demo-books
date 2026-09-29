> คู่มือนี้เป็นเวอร์ชันเก่า ปัจจุบันใช้ [ชีตส่วนตัว](private-sheet-pages.md)

# GitHub Pages + Public CSV (current setup)
เว็บอ่าน CSV ในเบราว์เซอร์ทุกครั้งที่เปิด/รีเฟรช ไม่ต้อง build ใหม่เมื่อเปลี่ยนรายการหนังสือ และไม่อ่าน Google credentials
ลิงก์เริ่มต้นใช้ spreadsheet 14Wo6Nz65zyphYzUyePbChMaTqGqpvlw3_KvDcxE55Jc แท็บ gid=1680909374
ตอนตรวจมีข้อมูล SAMPLE 2 แถว ให้แก้เป็นข้อมูลจริงก่อนเผยแพร่

## เปิดใช้ Pages
1. GitHub repository Settings → Pages → Source: GitHub Actions
2. Push โค้ดขึ้น main หรือ Actions → Deploy Pages → Run workflow
3. รอ job สำเร็จแล้วเปิด URL ที่ deployment แสดง
4. base path มาจาก actions/configure-pages โดยอัตโนมัติ
5. หากต้องการเปลี่ยนชีต ตั้ง Settings → Secrets and variables → Actions → Variables: NEXT_PUBLIC_CATALOG_CSV_URL เป็น URL CSV สาธารณะ แล้ว deploy ใหม่
6. ช่องทางติดต่อใช้ Variables: SHOP_FACEBOOK_URL, SHOP_LINE_URL, SHOP_EMAIL, SHOP_ORDER_URL ตามที่มีจริง
ไม่ต้องใส่ GOOGLE_PRIVATE_KEY หรือข้อมูล service account สำหรับเวอร์ชันนี้

## อัปเดตข้อมูล
แก้ชีตสาธารณะแล้วรีเฟรชเว็บ Google อาจมีแคชและใช้เวลาสักครู่ ไม่ใช่การอัปเดตอัตโนมัติในหน้าที่เปิดค้างไว้
หากโหลดไม่ได้จะมีข้อความและปุ่มลองอีกครั้ง ไม่แสดงข้อมูลเดโมแทน
CSV รองรับ comma, quote และคำอธิบายหลายบรรทัด
อนุมัติ + URL ภาพสาธารณะจึงแสดงภาพ; ไม่อนุมัติไม่แสดงภาพ
ต้องลบ URL ภาพที่ไม่อนุมัติออกจากชีตเผยแพร่เอง เพราะข้อมูล CSV ทุกช่องอ่านได้สาธารณะ
published=FALSE ซ่อนบนหน้าเว็บเท่านั้น; รายการลับต้องไม่อยู่ในชีตสาธารณะ
ภาพ Drive ส่วนตัวใช้ไม่ได้กับ Pages รุ่นนี้ ให้ใช้ URL ภาพที่เปิดได้จริงโดยไม่ล็อกอิน
ภาพที่เคยส่งถึงผู้ชมแล้วเรียกคืนไม่ได้

## ตรวจและ build
pnpm test
pnpm lint
pnpm build
ไฟล์พร้อมโฮสต์อยู่ใน out/; อ่านคู่มือนี้แทนส่วนเก่าของ README ที่อธิบาย server-side Sheets/Drive
