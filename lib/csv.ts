/** Parse quoted CSV fields, escaped quotes, BOM, CRLF and embedded newlines. */
export function parseCsv(text: string): string[][] {
  text = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else if (quoted || field === "") quoted = !quoted;
      else throw new Error("Invalid CSV quote");
    } else if (c === "," && !quoted) { row.push(field); field = ""; }
    else if ((c === "\n" || c === "\r") && !quoted) {
      row.push(field); if (row.some(value => value.trim())) rows.push(row);
      row = []; field = "";
      if (c === "\r" && text[i + 1] === "\n") i++;
    } else field += c;
  }
  if (quoted) throw new Error("Unclosed CSV field");
  row.push(field); if (row.some(value => value.trim())) rows.push(row);
  return rows;
}
