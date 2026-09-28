import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title: 'ระหว่างบรรทัด — หนังสือเล่มถัดไปของคุณ', description: 'พื้นที่เล็ก ๆ สำหรับคนรักการอ่าน ค้นพบหนังสือนิยาย พัฒนาตัวเอง และไลฟ์สไตล์ จากร้านระหว่างบรรทัด'};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="th"><body>{children}</body></html>; }
