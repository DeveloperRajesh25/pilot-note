import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const PDF_TYPES = ['application/pdf'];
const ALLOWED_TYPES = [...IMAGE_TYPES, ...PDF_TYPES];

// PDFs of diagrams/charts can run larger than typical question images.
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;   // 5 MB
const MAX_PDF_BYTES   = 15 * 1024 * 1024;  // 15 MB

const BUCKET = 'rtr-question-attachments';

export async function POST(request: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return check.error;

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Allowed: jpg, png, gif, webp, pdf' }, { status: 400 });
  }
  const isPdf = PDF_TYPES.includes(file.type);
  const limit = isPdf ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;
  if (file.size > limit) {
    return NextResponse.json({ error: `File too large. Maximum size is ${limit / (1024 * 1024)} MB` }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? (isPdf ? 'pdf' : 'jpg');
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const db = createAdminClient();
  const { error } = await db.storage
    .from(BUCKET)
    .upload(fileName, buffer, { contentType: file.type, upsert: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = db.storage.from(BUCKET).getPublicUrl(fileName);

  return NextResponse.json({ url: publicUrl, kind: isPdf ? 'pdf' : 'image' });
}
