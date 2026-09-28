# Design spec
Reference: design-concept.png (1536 × 1024). Cream #f5f1e8, forest #244c3c, muted #69736a. Serif-like Thai headings, readable Thai body. Header 76px; 64px desktop gutters. Split hero 43.5/56.5; arched top-left image without overlay. Four open product columns, no card borders. Buttons 10px corners, 16px body, heading 56px desktop/36px mobile. Shared search/category controls. Product details use a native dialog for keyboard and focus support.

Copy lock: ระหว่างบรรทัด / BETWEEN THE LINES; หนังสือทั้งหมด; เรื่องของเรา; บางเล่ม… เปลี่ยนวันธรรมดา ให้พิเศษขึ้น; พื้นที่เล็ก ๆ สำหรับคนรักการอ่าน และหนังสือเล่มถัดไปของคุณ; ค้นหาหนังสือของคุณ; เล่มที่อยากให้คุณได้อ่าน. Categories ทั้งหมด / นิยาย / พัฒนาตัวเอง / ไลฟ์สไตล์. Footer เรื่องราวดี ๆ เริ่มต้นที่หนังสือสักเล่ม.

Intentional deviations: omit invented social/contact/privacy links without real destinations; show truthful demo-data label below catalog when Sheets is not configured. Demo covers and titles are fictional. Add accessible product dialog to support details and configurable purchase links. Mobile stacks hero and uses two product columns.

## Generated asset provenance
Built-in ImageGen; three prompts: (1) complete Thai bookstore landing-page concept with cream/forest palette, split hero and four-book catalog; (2) recreate the concept's standalone sunny walnut-table photograph with books, vase and mug; (3) recreate the four fictional cover products as equal-width quadrants for CSS sprite display. Production files: `public/images/hero.png`, `public/images/covers.png`. The image generator's concept lettering is approximated with the locally bundled Noto Serif Thai font.
