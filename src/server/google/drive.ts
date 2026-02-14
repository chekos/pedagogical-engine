import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import fs from "fs";
import path from "path";
import { AGENT_WORKSPACE } from "../tools/shared.js";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  url: string;
  modifiedTime: string;
}

interface ListFilesResult {
  files: DriveFile[];
}

/** List files from Google Drive */
export async function listFiles(
  auth: OAuth2Client,
  query?: string,
  mimeType?: string,
  maxResults = 20
): Promise<ListFilesResult> {
  const drive = google.drive({ version: "v3", auth });

  const qParts: string[] = ["trashed = false"];
  if (query) qParts.push(`name contains '${query.replace(/'/g, "\\'")}'`);
  if (mimeType) qParts.push(`mimeType = '${mimeType}'`);

  const res = await drive.files.list({
    q: qParts.join(" and "),
    pageSize: maxResults,
    fields: "files(id, name, mimeType, webViewLink, modifiedTime)",
    orderBy: "modifiedTime desc",
  });

  const files: DriveFile[] = (res.data.files || []).map((f) => ({
    id: f.id!,
    name: f.name!,
    mimeType: f.mimeType!,
    url: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
    modifiedTime: f.modifiedTime || "",
  }));

  return { files };
}

/** Mime type mappings for Office → Google conversion */
const OFFICE_MIME_TYPES: Record<string, string> = {
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".xlsx":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".pdf": "application/pdf",
};

const GOOGLE_MIME_TYPES: Record<string, string> = {
  ".docx": "application/vnd.google-apps.document",
  ".pptx": "application/vnd.google-apps.presentation",
  ".xlsx": "application/vnd.google-apps.spreadsheet",
};

interface UploadResult {
  fileId: string;
  fileName: string;
  mimeType: string;
  url: string;
}

/**
 * Upload a file to Google Drive, optionally converting Office formats
 * to native Google Docs/Slides/Sheets.
 */
export async function uploadFile(
  auth: OAuth2Client,
  filePath: string,
  name: string,
  convertToGoogle = true
): Promise<UploadResult> {
  // Agent runs with cwd: agent-workspace/, so resolve relative paths against it
  const resolvedPath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(AGENT_WORKSPACE, filePath);

  const drive = google.drive({ version: "v3", auth });
  const ext = resolvedPath.slice(resolvedPath.lastIndexOf(".")).toLowerCase();
  const mimeType = OFFICE_MIME_TYPES[ext];

  const requestBody: { name: string; mimeType?: string } = { name };
  // Setting mimeType to a Google type triggers conversion on upload
  if (convertToGoogle && GOOGLE_MIME_TYPES[ext]) {
    requestBody.mimeType = GOOGLE_MIME_TYPES[ext];
  }

  const res = await drive.files.create({
    requestBody,
    media: {
      mimeType: mimeType || "application/octet-stream",
      body: fs.createReadStream(resolvedPath),
    },
    fields: "id, name, mimeType, webViewLink",
  });

  return {
    fileId: res.data.id!,
    fileName: res.data.name!,
    mimeType: res.data.mimeType!,
    url:
      res.data.webViewLink ||
      `https://drive.google.com/file/d/${res.data.id}/view`,
  };
}

interface ReadSheetResult {
  headers: string[];
  rows: string[][];
}

/** Read data from a Google Sheet by spreadsheet ID */
export async function readSheet(
  auth: OAuth2Client,
  spreadsheetId: string,
  range?: string
): Promise<ReadSheetResult> {
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: range || "A:ZZ",
  });

  const values = res.data.values || [];
  if (values.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = values[0].map(String);
  const rows = values.slice(1).map((row) => row.map(String));

  return { headers, rows };
}

/** Share a file with specific users */
export async function shareFile(
  auth: OAuth2Client,
  fileId: string,
  email: string,
  role: "reader" | "writer" | "commenter" = "reader"
): Promise<void> {
  const drive = google.drive({ version: "v3", auth });

  await drive.permissions.create({
    fileId,
    requestBody: {
      type: "user",
      role,
      emailAddress: email,
    },
    sendNotificationEmail: true,
  });
}
