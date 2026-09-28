import { JWT } from "google-auth-library";
import { getCatalog } from "@/lib/catalog";
import { driveFileId } from "@/lib/books";
import { normalizePrivateKey } from "@/lib/google-private-key";

export const runtime = "nodejs";

const errorResponse = (status: number) =>
  new Response(null, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookId: string }> },
) {
  try {
    const { bookId } = await params;
    // The parser strips unapproved covers. Only published, approved images can be served.
    // Never accept an arbitrary Drive ID.
    const { books } = await getCatalog(false);
    const book = books.find((item) => item.id === bookId);
    const fileId = book && driveFileId(book.cover);
    if (!fileId) return errorResponse(404);

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
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
      {
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      },
    );
    if (!response.ok) return errorResponse(response.status === 404 ? 404 : 502);
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
      await response.body?.cancel();
      return errorResponse(415);
    }
    // Stream to the visitor without saving a local image or exposing Google credentials.
    return new Response(response.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return errorResponse(502);
  }
}
