/** Normalize escaped newlines from environment variables without altering PEM content. */
export function normalizePrivateKey(value: string | undefined): string {
  return (value ?? '').replace(/\\n/g, '\n').trim();
}
