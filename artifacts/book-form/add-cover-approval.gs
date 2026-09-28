// รันด้วยบัญชีที่มีสิทธิ์แก้ไขฟอร์ม เพิ่มเฉพาะคำถามอนุมัติรูปภาพ
// ผู้ตอบฟอร์มทุกคนจะตอบคำถามนี้ได้ จึงควรใช้ฟอร์มนี้เฉพาะผู้ดูแลที่มีสิทธิ์อนุมัติ
function addCoverApprovalQuestion() {
  const form = FormApp.openById('1wxDcG7ATQtu-rkYzppA5cx3m_Ku4IPr6DRPuequD4r8');
  const title = 'อนุมัติรูปภาพ';
  const existing = form.getItems().filter(item => item.getTitle().trim() === title);
  if (existing.length) {
    console.log('มีคำถามนี้แล้ว จึงไม่สร้างซ้ำ: ' + form.getEditUrl());
    return;
  }
  form.addListItem()
    .setTitle(title)
    .setChoiceValues(['FALSE', 'TRUE', 'อนุมัติแล้ว'])
    .setRequired(false)
    .setHelpText('สำหรับผู้ดูแล: TRUE หรือ อนุมัติแล้ว = อนุมัติให้แสดงภาพบนเว็บ; FALSE หรือเว้นว่าง = ไม่แสดงภาพ');
  console.log('เพิ่มคำถามแล้ว: ' + form.getEditUrl());
  console.log('ตรวจแท็บคำตอบใน Google Sheet: คอลัมน์ชื่อ อนุมัติรูปภาพ ต้องอยู่ในช่วง GOOGLE_SHEET_RANGE และไม่มีหัวคอลัมน์ชื่อนี้ซ้ำ');
}
