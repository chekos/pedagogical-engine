import { google, type docs_v1 } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

interface CreateDocResult {
  docId: string;
  docUrl: string;
}

/** Convert markdown content to Google Docs batchUpdate requests */
function markdownToDocRequests(
  markdown: string
): docs_v1.Schema$Request[] {
  const requests: docs_v1.Schema$Request[] = [];
  const lines = markdown.split("\n");
  let index = 1; // Docs start at index 1

  for (const line of lines) {
    // Headings
    const h1Match = line.match(/^# (.+)$/);
    const h2Match = line.match(/^## (.+)$/);
    const h3Match = line.match(/^### (.+)$/);

    if (h1Match || h2Match || h3Match) {
      const text = (h1Match || h2Match || h3Match)![1] + "\n";
      const level = h1Match ? "HEADING_1" : h2Match ? "HEADING_2" : "HEADING_3";

      requests.push({
        insertText: { location: { index }, text },
      });
      requests.push({
        updateParagraphStyle: {
          range: { startIndex: index, endIndex: index + text.length },
          paragraphStyle: { namedStyleType: level },
          fields: "namedStyleType",
        },
      });
      index += text.length;
      continue;
    }

    // Unordered list items
    const bulletMatch = line.match(/^[-*] (.+)$/);
    if (bulletMatch) {
      const text = bulletMatch[1] + "\n";
      requests.push({
        insertText: { location: { index }, text },
      });
      requests.push({
        createParagraphBullets: {
          range: { startIndex: index, endIndex: index + text.length },
          bulletPreset: "BULLET_DISC_CIRCLE_SQUARE",
        },
      });
      index += text.length;
      continue;
    }

    // Bold text within a line — insert text then apply bold ranges
    const boldRegex = /\*\*(.+?)\*\*/g;
    if (boldRegex.test(line)) {
      // Reset regex
      boldRegex.lastIndex = 0;
      const plainLine = line.replace(/\*\*(.+?)\*\*/g, "$1") + "\n";
      requests.push({
        insertText: { location: { index }, text: plainLine },
      });

      // Find bold ranges in the plain text
      let plainIdx = 0;
      let mdIdx = 0;
      const boldRanges: Array<{ start: number; end: number }> = [];
      const chars = line;
      while (mdIdx < chars.length) {
        if (chars[mdIdx] === "*" && chars[mdIdx + 1] === "*") {
          mdIdx += 2;
          const start = plainIdx;
          while (mdIdx < chars.length && !(chars[mdIdx] === "*" && chars[mdIdx + 1] === "*")) {
            plainIdx++;
            mdIdx++;
          }
          boldRanges.push({ start, end: plainIdx });
          if (chars[mdIdx] === "*") mdIdx += 2;
        } else {
          plainIdx++;
          mdIdx++;
        }
      }

      for (const range of boldRanges) {
        requests.push({
          updateTextStyle: {
            range: {
              startIndex: index + range.start,
              endIndex: index + range.end,
            },
            textStyle: { bold: true },
            fields: "bold",
          },
        });
      }

      index += plainLine.length;
      continue;
    }

    // Empty lines and plain paragraphs
    const text = line + "\n";
    if (line.trim() !== "") {
      requests.push({
        insertText: { location: { index }, text },
      });
      index += text.length;
    } else {
      requests.push({
        insertText: { location: { index }, text: "\n" },
      });
      index += 1;
    }
  }

  return requests;
}

/** Create a new Google Doc from markdown content */
export async function createDoc(
  auth: OAuth2Client,
  title: string,
  markdownContent: string
): Promise<CreateDocResult> {
  const docs = google.docs({ version: "v1", auth });

  // Create empty doc
  const createRes = await docs.documents.create({
    requestBody: { title },
  });

  const docId = createRes.data.documentId!;

  // Convert markdown to Docs API requests and apply
  const requests = markdownToDocRequests(markdownContent);
  if (requests.length > 0) {
    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: { requests },
    });
  }

  return {
    docId,
    docUrl: `https://docs.google.com/document/d/${docId}/edit`,
  };
}
