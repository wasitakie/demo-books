import { getShopContacts } from "@/lib/contact";
import Image from "next/image";
import Link from "next/link";
import { getCatalog } from "@/lib/catalog";
import { Catalog } from "@/components/catalog";
import { Arrow } from "@/components/icons";
export const dynamic = "force-dynamic";
export default async function Home() {
  const { books, status } = await getCatalog();
  const contacts = getShopContacts();
  return (
    <>
      <a className="skip-link" href="#books">
        ข้ามไปยังรายการหนังสือ
      </a>
      <header className="header">
        <Link className="brand" href="/" aria-label="ระหว่างบรรทัด หน้าแรก">
          ระหว่างบรรทัด<span>BETWEEN THE LINES</span>
        </Link>
        <nav aria-label="เมนูหลัก">
          <a href="#books">หนังสือทั้งหมด</a>
          <a href="#about">เรื่องของเรา</a>
        </nav>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <h1>
              บางเล่ม…
              <br />
              เปลี่ยนวันธรรมดา
              <br />
              ให้พิเศษขึ้น
            </h1>
            <p>พื้นที่เล็ก ๆ สำหรับคนรักการอ่าน และหนังสือเล่มถัดไปของคุณ</p>
            <a className="primary-button" href="#books">
              ค้นหาหนังสือของคุณ <Arrow />
            </a>
          </div>
          <div className="hero-image">
            <Image
              src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/images/hero.png`}
              alt="หนังสือบนโต๊ะไม้ข้างหน้าต่าง ในแสงแดดอ่อน ๆ"
              fill
              priority
              sizes="(max-width: 700px) 100vw, 57vw"
            />
          </div>
        </section>
        <Catalog books={books} status={status} contacts={contacts} />
      </main>
      <footer id="about">
        <div className="brand">
          ระหว่างบรรทัด<span>BETWEEN THE LINES</span>
        </div>
        <p>เรื่องราวดี ๆ เริ่มต้นที่หนังสือสักเล่ม</p>
        <small>
          GOOD BOOKS.
          <br />A BRIGHTER YOU.
        </small>
        {contacts.length > 0 && (
          <div className="footer-contacts">
            <span>ติดต่อร้าน</span>
            {contacts.map((contact) => (
              <a
                key={contact.label}
                href={contact.href}
                target={
                  contact.href.startsWith("https:") ? "_blank" : undefined
                }
                rel="noopener noreferrer"
              >
                {contact.label}
              </a>
            ))}
          </div>
        )}
        <div className="copyright">
          © {new Date().getFullYear()} ระหว่างบรรทัด · พื้นที่เล็ก ๆ
          สำหรับคนรักการอ่าน
        </div>
      </footer>
    </>
  );
}
