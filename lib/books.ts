export type Book = {
  id: string;
  title: string;
  author: string;
  category: string;
  price: number;
  cover: string;
  description: string;
  buyUrl: string;
  available: boolean;
  stock?: number | null;
  status?: string;
  published?: string;
};

export function safeUrl(value: string): string {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

export function coverUrl(value: string): string {
  const safe = safeUrl(value);
  if (!safe) return "";
  const url = new URL(safe);
  if (url.hostname !== "drive.google.com") return safe;
  const id =
    url.pathname.match(/^\/file\/d\/([a-zA-Z0-9_-]+)(?:\/|$)/)?.[1] ||
    url.searchParams.get("id");
  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) return "";
  const image = new URL("https://drive.google.com/thumbnail");
  image.searchParams.set("id", id);
  image.searchParams.set("sz", "w1600");
  const resourceKey = url.searchParams.get("resourcekey");
  if (resourceKey) image.searchParams.set("resourcekey", resourceKey);
  return image.href;
}

export function driveFileId(value: string): string | null {
  const safe = safeUrl(value);
  if (!safe) return null;
  const url = new URL(safe);
  if (url.hostname !== "drive.google.com") return null;
  const id =
    url.pathname.match(/^\/file\/d\/([a-zA-Z0-9_-]+)(?:\/|$)/)?.[1] ||
    url.searchParams.get("id");
  return id && /^[a-zA-Z0-9_-]+$/.test(id) ? id : null;
}

export function parseBooks(rows: unknown[][], shopOrderUrl = ""): Book[] {
  if (!rows.length) return [];
  const aliases: Record<string, string> = {
    รหัสหนังสือ: "id",
    ชื่อหนังสือ: "title",
    ชื่อผู้แต่ง: "author",
    หมวดหมู่: "category",
    "ราคา (บาท)": "price",
    ราคา: "price",
    "stock (จำนวนคงเหลือ)": "stock",
    จำนวนคงเหลือ: "stock",
    "status (สถานะ)": "status",
    สถานะ: "status",
    รูปหน้าปกหนังสือ: "cover",
    อัปโหลดหน้าปก: "cover",
    "เรื่องย่อ / รายละเอียด": "description",
    ลิงก์สั่งซื้อ: "buy_url",
    ช่องทางสั่งซื้อ: "buy_url",
    อนุมัติรูปภาพ: "cover_approved",
    อนุมัติแสดงลิงค์รูปภาพ: "cover_approved",
    "published (แสดงสถานะหนังสือ)": "published",
  };
  const normalizeHeaders = (row: unknown[]) =>
    row.map(String).map((s) => {
      const key = s.trim().toLowerCase();
      return aliases[key] || key;
    });
  const required = ["id", "title", "author", "category", "price"];
  // Form responses use row 1; imported catalogs may have a title above headers.
  const headerIndex = rows.slice(0, 10).findIndex((row) => {
    const candidate = normalizeHeaders(row);
    return required.every((key) => candidate.includes(key));
  });
  if (headerIndex < 0) throw new Error("Missing required book columns");
  const headers = normalizeHeaders(rows[headerIndex]);
  const ids = new Set<string>();
  return rows.slice(headerIndex + 1).flatMap((row) => {
    const entry = Object.fromEntries(
      headers.map((key, i) => [key, String(row[i] ?? "").trim()]),
    );
    if (!entry.id || !entry.title || entry.published?.toLowerCase() === "false")
      return [];
    const price = Number(entry.price.replace(/,/g, ""));
    if (
      !entry.price ||
      !Number.isFinite(price) ||
      price < 0 ||
      ids.has(entry.id)
    )
      return [];
    const stockValue = Number((entry.stock || "").replace(/,/g, ""));
    const stock =
      entry.stock && Number.isSafeInteger(stockValue) && stockValue >= 0
        ? stockValue
        : null;
    const status =
      entry.status ||
      (entry.available?.toLowerCase() === "false" || stock === 0
        ? "สินค้าหมด"
        : "พร้อมขาย");
    const unavailable = [
      "สินค้าหมด",
      "หยุดจำหน่าย",
      "out of stock",
      "discontinued",
    ].includes(status.toLowerCase());
    const preorder = ["พรีออเดอร์", "preorder", "pre-order"].includes(
      status.toLowerCase(),
    );
    const available =
      entry.available?.toLowerCase() !== "false" &&
      !unavailable &&
      (stock !== 0 || preorder);
    ids.add(entry.id);
    // Missing, pending, or revoked approval must never expose a cover to the page or image API.
    const coverApproved = ["true", "อนุมัติแล้ว", "อนุมัติ"].includes(
      entry.cover_approved?.toLowerCase(),
    );
    return [
      {
        id: entry.id,
        title: entry.title,
        author: entry.author,
        category: entry.category || "อื่น ๆ",
        price,
        cover: coverApproved ? coverUrl(entry.cover) : "",
        description: entry.description || "",
        buyUrl: safeUrl(entry.buy_url) || safeUrl(shopOrderUrl),
        available,
        stock,
        status,
        published: entry.published,
      },
    ];
  });
}
