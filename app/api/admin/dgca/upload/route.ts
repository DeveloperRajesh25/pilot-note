import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const BUCKET = 'dgca-uploads';

// Shared image uploader for DGCA question diagrams and Pariksha topper photos.
// `folder` query param keeps uploads tidy (defaults to "misc").
export async function POST(request: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return check.error;

  const folderParam = request.nextUrl.searchParams.get('folder') ?? 'misc';
  const folder = folderParam.replace(/[^a-z0-9-]/gi, '').slice(0, 32) || 'misc';

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (!IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Allowed: jpg, png, gif, webp' }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: 'File too large. Maximum size is 5 MB' }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const db = createAdminClient();
  const { error } = await db.storage.from(BUCKET).upload(fileName, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = db.storage.from(BUCKET).getPublicUrl(fileName);
  return NextResponse.json({ url: publicUrl });
}
