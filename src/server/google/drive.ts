import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

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
