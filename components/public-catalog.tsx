"use client";
import { useEffect, useState } from "react";
import { parseBooks, type Book } from "@/lib/books";
import { parseCsv } from "@/lib/csv";
import type { ShopContact } from "@/lib/contact";
import { Catalog } from "./catalog";

const defaultCsvUrl = "https://docs.google.com/spreadsheets/d/14Wo6Nz65zyphYzUyePbChMaTqGqpvlw3_KvDcxE55Jc/export?format=csv&gid=1680909374";

export function PublicCatalog({ contacts, shopOrderUrl }: { contacts: ShopContact[]; shopOrderUrl: string }) {
  const [state, setState] = useState<{ status: "loading" | "live" | "error"; books: Book[] }>({ status: "loading", books: [] });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 20000);
    async function load() {
      try {
        const response = await fetch(process.env.NEXT_PUBLIC_CATALOG_CSV_URL || defaultCsvUrl, {
          cache: "no-store", credentials: "omit", signal: controller.signal,
        });
        if (!response.ok) throw new Error("CSV unavailable");
        const text = await response.text();
        if (/^\s*</.test(text)) throw new Error("Expected CSV, received HTML");
        const rows = parseCsv(text);
        if (!rows.length) throw new Error("Missing CSV headers");
        const books = parseBooks(rows, shopOrderUrl);
        if (active) setState({ status: "live", books });
      } catch {
        if (active) setState({ status: "error", books: [] });
      } finally { clearTimeout(timeout); }
    }
    void load();
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [attempt, shopOrderUrl]);
  if (state.status !== "live") return <section id="books" className="catalog">
    <div className="empty" role={state.status === "error" ? "alert" : "status"}>
      <h2>{state.status === "loading" ? "กำลังโหลดชั้นหนังสือ…" : "ยังโหลดชั้นหนังสือไม่ได้"}</h2>
      {state.status === "error" && <><p>กรุณาตรวจการเชื่อมต่ออินเทอร์เน็ต แล้วลองอีกครั้ง</p><button onClick={() => {
        setState({ status: "loading", books: [] }); setAttempt(value => value + 1);
      }}>ลองอีกครั้ง</button></>}
    </div>
  </section>;
  return <Catalog books={state.books} status="live" contacts={contacts} />;
}
