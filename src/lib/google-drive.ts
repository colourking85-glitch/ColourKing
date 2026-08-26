import { google, drive_v3 } from 'googleapis';

let _client: drive_v3.Drive | null = null;

function getClient(): drive_v3.Drive | null {
  if (_client) return _client;

  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) return null;

  const oauth2 = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'https://developers.google.com/oauthplayground'
  );
  oauth2.setCredentials({ refresh_token: refreshToken });
  _client = google.drive({ version: 'v3', auth: oauth2 });
  return _client;
}

export function getDriveClient(): drive_v3.Drive | null {
  return getClient();
}

export function getRootFolderId(): string | null {
  return process.env.GOOGLE_DRIVE_FOLDER_ID || null;
}

export async function listFiles(folderId: string) {
  const client = getClient();
  if (!client) throw new Error('Google Drive not configured');

  const response = await client.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink, createdTime, size)',
    orderBy: 'folder,name',
    pageSize: 100,
  });
  return response.data.files || [];
}

export async function searchFiles(query: string, rootFolderId?: string) {
  const client = getClient();
  if (!client) throw new Error('Google Drive not configured');

  let q = `name contains '${query.replace(/'/g, "\\'")}' and trashed=false`;
  if (rootFolderId) q += ` and '${rootFolderId}' in parents`;

  const response = await client.files.list({
    q,
    fields: 'files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink, createdTime, size, parents)',
    orderBy: 'modifiedTime desc',
    pageSize: 50,
  });
  return response.data.files || [];
}

export async function createFolder(folderName: string, parentFolderId?: string) {
  const client = getClient();
  if (!client) throw new Error('Google Drive not configured');

  const file = await client.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : undefined,
    },
    fields: 'id, name',
  });
  return file.data;
}

export async function uploadFile(
  fileName: string,
  mimeType: string,
  body: NodeJS.ReadableStream,
  folderId: string
) {
  const client = getClient();
  if (!client) throw new Error('Google Drive not configured');

  const file = await client.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType, body },
    fields: 'id, name, webViewLink, webContentLink',
  });

  if (file.data.id) {
    try {
      await client.permissions.create({
        fileId: file.data.id,
        requestBody: { role: 'reader', type: 'anyone' },
      });
    } catch {
      // non-fatal
    }
  }

  return file.data;
}

export async function deleteFile(fileId: string) {
  const client = getClient();
  if (!client) throw new Error('Google Drive not configured');

  await client.files.delete({ fileId });
  return true;
}

export async function renameFile(fileId: string, newName: string) {
  const client = getClient();
  if (!client) throw new Error('Google Drive not configured');

  const res = await client.files.update({
    fileId,
    requestBody: { name: newName },
    fields: 'id, name',
  });
  return res.data;
}
