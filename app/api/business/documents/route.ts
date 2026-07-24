import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (url, options = {}) => fetch(url, { ...options, cache: 'no-store' }),
      },
    }
  );
}

export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ documents: data || [] });
}

export async function POST(request: Request) {
  const supabase = getSupabase();

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const category = formData.get('category') as string;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `documents/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from('business-documents')
    .upload(filePath, buffer, {
      contentType: file.type,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from('business-documents')
    .getPublicUrl(filePath);

  const { data, error } = await supabase
    .from('documents')
    .insert([
      {
        name: file.name,
        category: category || 'other',
        file_path: filePath,
        file_url: urlData.publicUrl,
        file_size: file.size,
      },
    ])
    .select();

  if (error) {
    console.error('Documents insert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ document: data?.[0] }, { status: 201 });
}