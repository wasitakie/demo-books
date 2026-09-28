// วางใน Google Apps Script แล้วเรียก setupBookForm ด้วยบัญชีที่แก้ไขฟอร์มได้
function setupBookForm() {
  const form = FormApp.openById('1wxDcG7ATQtu-rkYzppA5cx3m_Ku4IPr6DRPuequD4r8');
  const questions = [
    ['รหัสหนังสือ', 'text', true, 'เช่น BK-0001 ใช้รหัสไม่ซ้ำกับหนังสือเล่มอื่น'],
    ['ชื่อหนังสือ', 'text', true, ''],
    ['ชื่อผู้แต่ง', 'text', true, 'หากไม่ทราบให้ระบุ ไม่ทราบ'],
    ['หมวดหมู่', 'list', true, '', ['นิยาย', 'การศึกษา', 'ธุรกิจ', 'พัฒนาตนเอง', 'เด็กและเยาวชน', 'อื่น ๆ']],
    ['ISBN', 'text', false, 'กรอกตามหนังสือ รวมเลขศูนย์ด้านหน้าได้'],
    ['สำนักพิมพ์', 'text', false, ''],
    ['ปีที่พิมพ์ (พ.ศ.)', 'text', false, 'กรอก พ.ศ. 4 หลัก เช่น 2569'],
    ['ราคา (บาท)', 'text', true, 'ราคาต่อเล่ม เช่น 250 หรือ 250.50 ไม่ใส่เครื่องหมายคอมมาหรือสัญลักษณ์สกุลเงิน'],
    ['Stock (จำนวนคงเหลือ)', 'text', true, 'จำนวนเล่มคงเหลือ เป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป'],
    ['Status (สถานะ)', 'list', true, 'เลือกสถานะปัจจุบันของหนังสือ', ['พร้อมขาย', 'สินค้าหมด', 'พรีออเดอร์', 'หยุดจำหน่าย']],
    ['เรื่องย่อ / รายละเอียด', 'paragraph', false, ''],
    ['ตำแหน่งจัดเก็บ', 'text', false, 'เช่น ชั้น A ช่อง 2'],
    ['หมายเหตุ', 'paragraph', false, '']
  ];
  // คงคำถามเดิมไว้ และข้ามชื่อที่มีอยู่แล้ว เพื่อให้รันซ้ำได้
  const existing = new Set(form.getItems().map(item => item.getTitle()));
  form.setTitle('ทะเบียนหนังสือและรูปหน้าปก')
    .setDescription('บันทึกข้อมูลหนังสือ 1 เล่มต่อ 1 คำตอบ พร้อมแนบรูปหน้าปก หากต้องการแก้ไข ให้ใช้ลิงก์แก้ไขคำตอบเดิมเพื่อไม่ให้ข้อมูลซ้ำ')
    .setAllowResponseEdits(true)
    .setLimitOneResponsePerUser(false)
    .setConfirmationMessage('บันทึกข้อมูลเรียบร้อย กรุณาเก็บลิงก์แก้ไขคำตอบไว้สำหรับปรับปรุงข้อมูลหนังสือเล่มนี้');
  questions.forEach(([title, kind, required, help, choices]) => {
    if (existing.has(title)) return;
    let item;
    if (kind === 'list') {
      item = form.addListItem().setChoiceValues(choices);
    } else if (kind === 'paragraph') {
      item = form.addParagraphTextItem();
    } else {
      item = form.addTextItem();
      if (title === 'ปีที่พิมพ์ (พ.ศ.)') {
        item.setValidation(FormApp.createTextValidation()
          .requireTextMatchesPattern('^[0-9]{4}$')
          .setHelpText('กรุณากรอกปี พ.ศ. เป็นตัวเลข 4 หลัก').build());
      } else if (title === 'ราคา (บาท)') {
        item.setValidation(FormApp.createTextValidation()
          .requireTextMatchesPattern('^[0-9]+([.][0-9]{1,2})?$')
          .setHelpText('กรอกราคาตั้งแต่ 0 ขึ้นไป ทศนิยมไม่เกิน 2 ตำแหน่ง เช่น 250.50').build());
      } else if (title === 'Stock (จำนวนคงเหลือ)') {
        item.setValidation(FormApp.createTextValidation()
          .requireTextMatchesPattern('^[0-9]+$')
          .setHelpText('กรอกจำนวนเต็มตั้งแต่ 0 ขึ้นไป เช่น 0 หรือ 12').build());
      }
    }
    item.setTitle(title).setRequired(required);
    if (help) item.setHelpText(help);
  });
  let sheetId = null;
  try {
    sheetId = form.getDestinationId();
  } catch (error) {
    // Google throws when no destination exists; do not hide other failures.
    if (!String(error.message || error).includes('The form currently has no response destination')) {
      throw error;
    }
  }
  if (!sheetId) {
    const props = PropertiesService.getScriptProperties();
    const key = 'BOOK_RESPONSE_SHEET_' + form.getId();
    sheetId = props.getProperty(key);
    if (!sheetId) {
      sheetId = SpreadsheetApp.create('ทะเบียนหนังสือ').getId();
      props.setProperty(key, sheetId);
    }
    form.setDestination(FormApp.DestinationType.SPREADSHEET, sheetId);
  }
  console.log('ฟอร์ม: ' + form.getEditUrl());
  console.log('ตาราง: https://docs.google.com/spreadsheets/d/' + sheetId + '/edit');
  console.log('ขั้นตอนที่เหลือ: เพิ่มคำถาม รูปหน้าปกหนังสือ ชนิดอัปโหลดไฟล์ รับเฉพาะรูปภาพ 1 ไฟล์ ขนาดสูงสุด 10 MB และเปิดจำเป็น');
}
