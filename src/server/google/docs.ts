import { google, type docs_v1 } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

// --- Public types: what the agent produces ---

export type DocBlock =
  | { type: "heading1"; text: string }
  | { type: "heading2"; text: string }
  | { type: "heading3"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "numbered_list"; items: string[] }
  | { type: "checklist"; items: string[] }
  | {
      type: "table";
      headers: string[];
      rows: string[][];
    }
  | { type: "divider" };

interface CreateDocResult {
  docId: string;
  docUrl: string;
}

// --- Inline formatting ---

interface InlineRange {
  start: number;
  end: number;
  style: "bold" | "italic";
}

/** Strip **bold** and *italic* markers, return plain text + formatting ranges */
function stripInlineFormatting(text: string): {
  plain: string;
  ranges: InlineRange[];
} {
  const ranges: InlineRange[] = [];
  let plain = "";
  let i = 0;

  while (i < text.length) {
    if (text[i] === "*" && text[i + 1] === "*") {
      i += 2;
      const start = plain.length;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "*")) {
        plain += text[i];
        i++;
      }
      ranges.push({ start, end: plain.length, style: "bold" });
      if (i < text.length && text[i] === "*") i += 2;
    } else if (text[i] === "*" && text[i + 1] !== "*") {
      i += 1;
      const start = plain.length;
      while (i < text.length && text[i] !== "*") {
        plain += text[i];
        i++;
      }
      ranges.push({ start, end: plain.length, style: "italic" });
      if (i < text.length) i += 1;
    } else {
      plain += text[i];
      i++;
    }
  }

  return { plain, ranges };
}

// --- Table tracking ---

interface TablePlacement {
  rows: string[][]; // [headers, ...dataRows]
}

/** Index space of an empty table */
function emptyTableSize(rows: number, cols: number): number {
  return 3 + 2 * rows * cols + rows;
}

// --- Document builder (mechanical API layer) ---

class DocBuilder {
  requests: docs_v1.Schema$Request[] = [];
  tables: TablePlacement[] = [];
  private index = 1;

  text(content: string): this {
    const { plain, ranges } = stripInlineFormatting(content);
    const fullText = plain + "\n";
    this.requests.push({
      insertText: { location: { index: this.index }, text: fullText },
    });
    this.applyInlineRanges(this.index, ranges);
    this.index += fullText.length;
    return this;
  }

  heading(
    content: string,
    level: "HEADING_1" | "HEADING_2" | "HEADING_3"
  ): this {
    const text = content + "\n";
    const start = this.index;
    this.requests.push({
      insertText: { location: { index: start }, text },
    });
    this.requests.push({
      updateParagraphStyle: {
        range: { startIndex: start, endIndex: start + text.length },
        paragraphStyle: { namedStyleType: level },
        fields: "namedStyleType",
      },
    });
    this.index += text.length;
    return this;
  }

  private list(items: string[], preset: string): this {
    const rangeStart = this.index;
    for (const item of items) {
      this.text(item);
    }
    this.requests.push({
      createParagraphBullets: {
        range: { startIndex: rangeStart, endIndex: this.index },
        bulletPreset: preset,
      },
    });
    return this;
  }

  bullets(items: string[]): this {
    return this.list(items, "BULLET_DISC_CIRCLE_SQUARE");
  }

  numberedList(items: string[]): this {
    return this.list(items, "NUMBERED_DECIMAL_ALPHA_ROMAN");
  }

  checklist(items: string[]): this {
    return this.list(items, "BULLET_CHECKBOX");
  }

  hr(): this {
    const start = this.index;
    this.requests.push({
      insertText: { location: { index: start }, text: "\n" },
    });
    this.requests.push({
      updateParagraphStyle: {
        range: { startIndex: start, endIndex: start + 1 },
        paragraphStyle: {
          borderBottom: {
            color: {
              color: { rgbColor: { red: 0.75, green: 0.75, blue: 0.75 } },
            },
            width: { magnitude: 1, unit: "PT" },
            padding: { magnitude: 4, unit: "PT" },
            dashStyle: "SOLID",
          },
          spaceBelow: { magnitude: 8, unit: "PT" },
        },
        fields: "borderBottom,spaceBelow",
      },
    });
    this.index += 1;
    return this;
  }

  table(headers: string[], rows: string[][]): this {
    const allRows = [headers, ...rows];
    const numRows = allRows.length;
    const numCols = headers.length;
    this.tables.push({ rows: allRows });
    this.requests.push({
      insertTable: {
        rows: numRows,
        columns: numCols,
        location: { index: this.index },
      },
    });
    this.index += emptyTableSize(numRows, numCols);
    return this;
  }

  emptyLine(): this {
    this.requests.push({
      insertText: { location: { index: this.index }, text: "\n" },
    });
    this.index += 1;
    return this;
  }

  private applyInlineRanges(baseIndex: number, ranges: InlineRange[]): void {
    for (const range of ranges) {
      this.requests.push({
        updateTextStyle: {
          range: {
            startIndex: baseIndex + range.start,
            endIndex: baseIndex + range.end,
          },
          textStyle:
            range.style === "bold" ? { bold: true } : { italic: true },
          fields: range.style,
        },
      });
    }
  }
}

// --- Build document from blocks ---

function buildFromBlocks(blocks: DocBlock[], builder: DocBuilder): void {
  for (const block of blocks) {
    switch (block.type) {
      case "heading1":
        builder.heading(block.text, "HEADING_1");
        break;
      case "heading2":
        builder.heading(block.text, "HEADING_2");
        break;
      case "heading3":
        builder.heading(block.text, "HEADING_3");
        break;
      case "paragraph":
        builder.text(block.text);
        break;
      case "bullets":
        builder.bullets(block.items);
        break;
      case "numbered_list":
        builder.numberedList(block.items);
        break;
      case "checklist":
        builder.checklist(block.items);
        break;
      case "table":
        builder.table(block.headers, block.rows);
        break;
      case "divider":
        builder.hr();
        break;
    }
  }
}

// --- Populate table cells (second API pass) ---

async function populateTableCells(
  docs: ReturnType<typeof google.docs>,
  docId: string,
  tables: TablePlacement[]
): Promise<void> {
  if (tables.length === 0) return;

  const doc = await docs.documents.get({ documentId: docId });
  const body = doc.data.body?.content || [];
  const tableElements = body.filter((el) => el.table);

  const requests: docs_v1.Schema$Request[] = [];

  for (let t = 0; t < Math.min(tables.length, tableElements.length); t++) {
    const tableData = tables[t];
    const tableEl = tableElements[t];
    const tableRows = tableEl.table!.tableRows!;
    const numCols = tableData.rows[0]?.length || 1;

    // Insert cell content in REVERSE order so earlier indexes stay stable
    for (let r = tableData.rows.length - 1; r >= 0; r--) {
      for (let c = (tableData.rows[r]?.length || 0) - 1; c >= 0; c--) {
        const rawText = tableData.rows[r][c];
        if (!rawText) continue;

        const cell = tableRows[r]?.tableCells?.[c];
        if (!cell?.content?.[0]) continue;
        const cellIdx = cell.content[0].startIndex!;

        const { plain, ranges } = stripInlineFormatting(rawText);
        requests.push({
          insertText: { location: { index: cellIdx }, text: plain },
        });

        for (const range of ranges) {
          requests.push({
            updateTextStyle: {
              range: {
                startIndex: cellIdx + range.start,
                endIndex: cellIdx + range.end,
              },
              textStyle:
                range.style === "bold" ? { bold: true } : { italic: true },
              fields: range.style,
            },
          });
        }
      }
    }

    // Header row background
    requests.push({
      updateTableCellStyle: {
        tableRange: {
          tableCellLocation: {
            tableStartLocation: { index: tableEl.startIndex! },
            rowIndex: 0,
            columnIndex: 0,
          },
          rowSpan: 1,
          columnSpan: numCols,
        },
        tableCellStyle: {
          backgroundColor: {
            color: { rgbColor: { red: 0.93, green: 0.93, blue: 0.95 } },
          },
        },
        fields: "backgroundColor",
      },
    });
  }

  if (requests.length > 0) {
    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: { requests },
    });
  }
}

/** Create a Google Doc from structured content blocks */
export async function createDoc(
  auth: OAuth2Client,
  title: string,
  blocks: DocBlock[]
): Promise<CreateDocResult> {
  const docs = google.docs({ version: "v1", auth });

  const createRes = await docs.documents.create({
    requestBody: { title },
  });
  const docId = createRes.data.documentId!;

  // Phase 1: Insert all content (tables as empty structures)
  const builder = new DocBuilder();
  buildFromBlocks(blocks, builder);

  if (builder.requests.length > 0) {
    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: { requests: builder.requests },
    });
  }

  // Phase 2: Populate table cells
  await populateTableCells(docs, docId, builder.tables);

  return {
    docId,
    docUrl: `https://docs.google.com/document/d/${docId}/edit`,
  };
}
