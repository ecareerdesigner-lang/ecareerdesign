import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: (url, options = {}) => fetch(url, { ...options, cache: 'no-store' }),
      },
    }
  );

  const employees = await supabase.from('employees').select('*');
  const tasks = await supabase.from('tasks').select('*');
  const expenses = await supabase.from('expenses').select('*');
  const revenue = await supabase.from('revenue').select('*');
  const timeEntries = await supabase.from('time_entries').select('*');

  return NextResponse.json({
    employees: employees.data || [],
    tasks: tasks.data || [],
    expenses: expenses.data || [],
    revenue: revenue.data || [],
    timeEntries: timeEntries.data || [],
  });
}