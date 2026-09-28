"use client";
import { useRef, useState } from "react";
import type { ShopContact } from "@/lib/contact";
import type { Book } from "@/lib/books";
import { SearchIcon, Arrow } from "./icons";
const money = new Intl.NumberFormat("th-TH");
function Inventory({ book }: { book: Book }) {
  return (
    <span className="inventory">
      <span>
        คงเหลือ {book.stock == null ? "—" : `${money.format(book.stock)} เล่ม`}
      </span>
      <span className="stock">
        {book.status || (book.available ? "พร้อมขาย" : "สินค้าหมด")}
      </span>
    </span>
  );
}
function Cover({ book }: { book: Book }) {
  const [failed, setFailed] = useState(false);
  const demoIndex = /^demo-[1-4]$/.test(book.id)
    ? Number(book.id.slice(-1)) - 1
    : -1;
  if (book.cover && !failed)
    return (
      <div className="cover">
        <img
          src={book.cover}
          onError={() => setFailed(true)}
          alt={`ปก ${book.title}`}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
    ); // eslint-disable-line @next/next/no-img-element
  if (demoIndex >= 0)
    return (
      <div
        role="img"
        aria-label={`ปก ${book.title}`}
        className="cover demo-cover"
        style={{
          backgroundImage: `url('${process.env.NEXT_PUBLIC_BASE_PATH || ""}/images/covers.png')`,
          backgroundPosition: `${(demoIndex * 100) / 3}% center`,
        }}
      />
    );
  return (
    <div className="cover missing-cover">
      <span>{book.title}</span>
      <small>{failed ? "ภาพปกไม่พร้อมแสดง" : "ยังไม่มีภาพปก"}</small>
    </div>
  );
}
export function Catalog({
  books,
  status,
  contacts = [],
}: {
  books: Book[];
  contacts?: ShopContact[];
  status: "live" | "demo" | "error";
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ทั้งหมด");
  const [selected, setSelected] = useState<Book | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const categories = [
    "ทั้งหมด",
    ...new Set(books.map((book) => book.category)),
  ];
  const normalized = query.trim().toLocaleLowerCase("th");
  const visible = books.filter(
    (book) =>
      (category === "ทั้งหมด" || category === book.category) &&
      `${book.title} ${book.author} ${book.description}`
        .toLocaleLowerCase("th")
        .includes(normalized),
  );
  return (
    <section className="catalog" id="books" aria-labelledby="catalog-heading">
      <div className="catalog-top">
        <h2 id="catalog-heading">เล่มที่อยากให้คุณได้อ่าน</h2>
        <label className="search">
          <SearchIcon />
          <span className="sr-only">ค้นหาหนังสือ</span>
          <input
            type="search"
            placeholder="ค้นหาชื่อหนังสือ ผู้เขียน หรือคำสำคัญ..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>
      <div className="filters" aria-label="หมวดหมู่หนังสือ">
        {categories.map((item) => (
          <button
            key={item}
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <p className="sr-only" role="status">
        พบหนังสือ {visible.length} เล่ม
      </p>
      {status === "error" ? (
        <div className="empty" role="alert">
          <h3>ยังโหลดชั้นหนังสือไม่ได้</h3>
          <p>กรุณาลองใหม่อีกครั้งในอีกสักครู่</p>
          <button onClick={() => location.reload()}>ลองอีกครั้ง</button>
        </div>
      ) : visible.length ? (
        <div className="book-grid">
          {visible.map((book) => (
            <button
              className="book"
              key={book.id}
              onClick={() => {
                setSelected(book);
                dialog.current?.showModal();
              }}
              aria-label={`ดูรายละเอียด ${book.title}`}
            >
              <Cover book={book} />
              <h3>{book.title}</h3>
              <p>{book.author}</p>
              <span className="price">{money.format(book.price)} บาท</span>
              <Inventory book={book} />
            </button>
          ))}
        </div>
      ) : (
        <div className="empty">
          <h3>
            {books.length ? "ยังไม่พบเล่มที่คุณตามหา" : "กำลังจัดชั้นหนังสือ"}
          </h3>
          <p>
            {books.length
              ? "ลองใช้คำค้นอื่น หรือเลือกหมวดหมู่ทั้งหมด"
              : "กลับมาเลือกหนังสือใหม่กับเราเร็ว ๆ นี้"}
          </p>
          {books.length > 0 && (
            <button
              onClick={() => {
                setQuery("");
                setCategory("ทั้งหมด");
              }}
            >
              ล้างการค้นหา
            </button>
          )}
        </div>
      )}
      {status === "demo" && (
        <p className="demo-note">
          หนังสือและราคาเป็นข้อมูลตัวอย่าง · พร้อมเชื่อมต่อ Google Sheets
          ของร้าน
        </p>
      )}
      <dialog
        ref={dialog}
        className="book-dialog"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <button
          className="close"
          aria-label="ปิดรายละเอียด"
          onClick={() => dialog.current?.close()}
        >
          ×
        </button>
        {selected && (
          <div className="detail">
            <Cover key={`${selected.id}:${selected.cover}`} book={selected} />
            <div>
              <span className="detail-category">{selected.category}</span>
              <h2>{selected.title}</h2>
              <p className="author">{selected.author}</p>
              <p>{selected.description || "ยังไม่มีคำอธิบายหนังสือ"}</p>
              <strong>{money.format(selected.price)} บาท</strong>
              <Inventory book={selected} />
              {!selected.available ? (
                <p className="availability">
                  {selected.status === "หยุดจำหน่าย"
                    ? "หยุดจำหน่าย"
                    : "ไม่พร้อมจำหน่ายในขณะนี้"}
                </p>
              ) : selected.buyUrl ? (
                <a
                  className="primary-button"
                  href={selected.buyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  สั่งซื้อหนังสือ <Arrow />
                </a>
              ) : status !== "demo" && contacts.length > 0 ? (
                <div className="order-contact">
                  <p>ติดต่อร้านเพื่อสั่งซื้อ</p>
                  <div className="contact-links">
                    {contacts.map(contact => <a key={contact.label} href={contact.href.startsWith("mailto:") ? `${contact.href}?subject=${encodeURIComponent(`สอบถามหนังสือ ${selected.title} (${selected.id})`)}` : contact.href} target={contact.href.startsWith("https:") ? "_blank" : undefined} rel="noopener noreferrer">{contact.label}</a>)}
                  </div>
                </div>
              ) : (
                <p className="availability">
                  {status === "demo"
                    ? "เล่มตัวอย่าง ยังไม่เปิดรับคำสั่งซื้อ"
                    : "ยังไม่มีช่องทางสั่งซื้อสำหรับเล่มนี้"}
                </p>
              )}
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
