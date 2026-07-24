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

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabase();

  const { data: doc } = await supabase.from('documents').select('file_path').eq('id', params.id).single();

  if (doc?.file_path) {
    await supabase.storage.from('business-documents').remove([doc.file_path]);
  }

  const { error } = await supabase.from('documents').delete().eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}