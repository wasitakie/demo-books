import { JWT } from "google-auth-library";
import { getCatalog } from "@/lib/catalog";
import { driveFileId } from "@/lib/books";
import { normalizePrivateKey } from "@/lib/google-private-key";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  const { books } = await getCatalog(false);
  return books.filter(book => driveFileId(book.cover)).map(book => ({ bookId: book.id }));
}

const errorResponse = (status: number): never => {
  // Fail the export instead of publishing an empty or broken image.
  throw new Error(`Could not export an approved book cover (HTTP ${status}). Check Drive access and image format.`);
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookId: string }> },
) {
  let stage = "read catalog";
  try {
    const { bookId } = await params;
    // The parser strips unapproved covers. Only published, approved images can be served.
    // Never accept an arbitrary Drive ID.
    const { books } = await getCatalog(false);
    const book = books.find((item) => item.id === bookId);
    const fileId = book && driveFileId(book.cover);
    if (!fileId) return errorResponse(404);

    stage = "authenticate Drive";
    const auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim(),
      key: normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY),
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
    const token = await auth.getAccessToken();
    if (!token.token) return errorResponse(502);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token.token}`,
    };
    const resourceKey = new URL(book.cover).searchParams.get("resourcekey");
    if (resourceKey)
      headers["X-Goog-Drive-Resource-Keys"] = `${fileId}/${resourceKey}`;
    stage = "download image";
    // Download binary data outside Next's data cache (covers may exceed its 2 MB limit).
    const response = await auth.request<ArrayBuffer>({
      url: `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
      headers,
      responseType: "arraybuffer",
      timeout: 20000,
      validateStatus: () => true,
    });
    if (response.status !== 200) return errorResponse(response.status);
    const contentType =
      response.headers.get("content-type")?.split(";")[0].trim() || "";
    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/avif",
      ].includes(contentType)
    ) {
      return errorResponse(415);
    }
    // Export the approved image as a static file; Google credentials stay at build time.
    stage = "export image bytes";
    return new Response(new Uint8Array(response.data), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Could not export an approved book cover")) throw error;
    throw new Error(`Cover export failed at stage: ${stage} (${error instanceof Error ? error.name : "unknown error"}).`);
  }
}
