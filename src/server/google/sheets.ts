import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

interface ReadSheetResult {
  headers: string[];
  rows: string[][];
}

interface CreateSheetResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

/** Read data from a Google Sheet */
export async function readSheet(
  auth: OAuth2Client,
  spreadsheetId: string,
  range?: string
): Promise<ReadSheetResult> {
  const sheets = google.sheets({ version: "v4", auth });

  const effectiveRange = range || "A:ZZ";
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: effectiveRange,
  });

  const values = res.data.values || [];
  if (values.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = values[0].map(String);
  const rows = values.slice(1).map((row) => row.map(String));

  return { headers, rows };
}

/** Create a new Google Sheet with headers and data */
export async function createSheet(
  auth: OAuth2Client,
  title: string,
  headers: string[],
  rows: string[][]
): Promise<CreateSheetResult> {
  const sheets = google.sheets({ version: "v4", auth });

  // Create the spreadsheet
  const createRes = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title },
      sheets: [{ properties: { title: "Sheet1" } }],
    },
  });

  const spreadsheetId = createRes.data.spreadsheetId!;

  // Write data
  const values = [headers, ...rows];
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "Sheet1!A1",
    valueInputOption: "RAW",
    requestBody: { values },
  });

  // Bold the header row
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: {
              sheetId: 0,
              startRowIndex: 0,
              endRowIndex: 1,
            },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true },
                backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
              },
            },
            fields: "userEnteredFormat(textFormat,backgroundColor)",
          },
        },
        {
          autoResizeDimensions: {
            dimensions: {
              sheetId: 0,
              dimension: "COLUMNS",
              startIndex: 0,
              endIndex: headers.length,
            },
          },
        },
      ],
    },
  });

  return {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}
