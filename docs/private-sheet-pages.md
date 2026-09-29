# ชีตส่วนตัวไฟล์เดียว + GitHub Pages

เวอร์ชันปัจจุบันอ่านชีตส่วนตัวตอน build ไม่ใช้ CSV สาธารณะหรือ Apps Script
ต้นทาง: https://docs.google.com/spreadsheets/d/1yQQD7nZDwaK_qRpz6jw9WlEKu2ek6VYB1HNk4aWKs7s/edit?gid=257320421

## ตั้งค่าครั้งแรก
1. เปิด Google Sheets API และ Google Drive API ใน project ของ service account
2. แชร์ชีตและโฟลเดอร์ภาพให้บัญชีใน GOOGLE_SERVICE_ACCOUNT_EMAIL เป็น Viewer โดยคง General access เป็น Restricted
3. GitHub → Settings → Secrets and variables → Actions → Secrets: ตั้ง GOOGLE_SERVICE_ACCOUNT_EMAIL และ GOOGLE_PRIVATE_KEY
4. Settings → Pages → Source: GitHub Actions
5. Push โค้ดขึ้น main แล้วรอ Deploy Pages สำเร็จ ตารางเวลาเริ่มทำงานเมื่อ workflow อยู่บน default branch
6. ตั้งช่องทางติดต่อจริงผ่าน Actions Variables: SHOP_FACEBOOK_URL, SHOP_LINE_URL, SHOP_EMAIL, SHOP_ORDER_URL ตามที่มี

Workflow ระบุ Sheet ID และ gid ข้างต้นแล้ว ไม่มีการส่ง credential ให้เบราว์เซอร์
ข้อมูลที่ผ่านตัวกรองและสำเนาภาพที่อนุมัติจะเป็นสาธารณะในไฟล์เว็บไซต์

## การใช้งาน
- แก้ข้อมูลและภาพในชีตส่วนตัวเหมือนเดิม ใช้คอลัมน์ อัปโหลดหน้าปก หรือ cover เป็นลิงก์ Drive
- คอลัมน์ อนุมัติแสดงลิงค์รูปภาพ / อนุมัติรูปภาพ / cover_approved ต้องเป็น อนุมัติ, อนุมัติแล้ว หรือ TRUE จึงดาวน์โหลดภาพ
- ไม่อนุมัติหรือค่าว่าง: ไม่มีภาพใน build ใหม่ ไม่เก็บไฟล์ปกเก่าไว้ใน generated-covers
- published=FALSE: ไม่เผยแพร่ทั้งรายการ ตามพฤติกรรมเดิมค่าว่างยังแสดงรายการ
- รายการที่ราคาไม่ถูกต้อง รหัสซ้ำ หรือกรอกไม่ครบจะถูกข้ามตามตัวอ่านเดิม
- Actions ตั้งรอบนาที 7,22,37,52 ของแต่ละชั่วโมง เวลาอาจคลาดเคลื่อน
- ต้องรอ deploy สำเร็จก่อนรีเฟรชจึงเห็นข้อมูลใหม่ ไม่ได้อ่านชีตทุกครั้งที่รีเฟรช
- อัปเดตทันทีได้ด้วย Actions → Deploy Pages → Run workflow (ยังต้องรอ build/deploy)
- หาก Sheets/auth ล้มเหลว build จะหยุด เว็บชุดเดิมยังอยู่ จึงต้องตรวจ Actions เมื่อถอนข้อมูลสำคัญ
- หากภาพบางเล่มอ่านไม่ได้ จะมีคำเตือนและแสดงกรอบชื่อหนังสือ เพื่อให้การถอนภาพเล่มอื่นยังเผยแพร่ได้
- ภาพเปลี่ยนจะใช้ชื่อไฟล์ตาม hash ใหม่ ลดปัญหาแคชภาพเก่า ภาพที่ผู้ชมเก็บไปแล้วเรียกคืนไม่ได้
- หากใช้ external HTTPS cover ที่ไม่ใช่ Drive เว็บยังอ้าง URL นั้นโดยตรง

## ตรวจและรันในเครื่อง
ตั้ง .env.local ตาม .env.example แล้วใช้ npm run dev หรือ npm run build
ทั้งสองคำสั่งเตรียมข้อมูลใหม่ก่อนเริ่มงาน
npm test และ npm run lint ใช้ตรวจโค้ด
ไฟล์พร้อมโฮสต์อยู่ใน out/ และต้องใช้ base path ให้ตรงโฮสต์
.generated/ และ public/generated-covers/ เป็นไฟล์สร้างอัตโนมัติ ถูกละเว้นจาก Git

## ผลตรวจล่าสุด
อ่านรายการจริงได้ 3 เล่ม แต่ Drive ตอบ 404 สำหรับภาพ BK-0001, BK-0002, BK-0003
ตรวจว่าไฟล์ยังอยู่ ลิงก์ถูกต้อง และแชร์โฟลเดอร์/ไฟล์ให้ service account อ่านได้
ไม่ต้องเปลี่ยน Drive เป็นสาธารณะ
