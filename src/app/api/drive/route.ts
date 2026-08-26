import { NextRequest, NextResponse } from 'next/server';
import {
  listFiles,
  searchFiles,
  createFolder,
  uploadFile,
  deleteFile,
  renameFile,
  getRootFolderId,
} from '@/lib/google-drive';
import { Readable } from 'stream';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const rootFolderId = getRootFolderId();

    if (search && search.trim().length > 0) {
      const files = await searchFiles(search.trim(), rootFolderId || undefined);
      return NextResponse.json({ files, isSearch: true });
    }

    const folderId = searchParams.get('folderId') || rootFolderId;
    if (!folderId) {
      return NextResponse.json(
        { error: 'No Drive folder configured. Set GOOGLE_DRIVE_FOLDER_ID.' },
        { status: 400 }
      );
    }

    const files = await listFiles(folderId);
    return NextResponse.json({ files });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Drive GET error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await req.json();

      if (body.action === 'create_folder') {
        if (!body.folderName) {
          return NextResponse.json({ error: 'folderName required' }, { status: 400 });
        }
        const parentId = body.parentFolderId || getRootFolderId();
        const result = await createFolder(body.folderName, parentId || undefined);
        return NextResponse.json(result);
      }

      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const folderId = (formData.get('folderId') as string) || getRootFolderId();

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }
      if (!folderId) {
        return NextResponse.json({ error: 'No Drive folder configured' }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      const result = await uploadFile(file.name, file.type, stream, folderId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Unsupported Content-Type' }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Drive POST error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === 'rename') {
      if (!body.fileId || !body.newName) {
        return NextResponse.json({ error: 'fileId and newName required' }, { status: 400 });
      }
      const result = await renameFile(body.fileId, body.newName);
      return NextResponse.json({ success: true, file: result });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Drive PATCH error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ error: 'fileId required' }, { status: 400 });
    }

    await deleteFile(fileId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Drive DELETE error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
