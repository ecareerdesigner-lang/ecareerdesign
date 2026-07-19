const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qfpsqbzbrnkfqmrtksqy.supabase.co',
  'sb_publishable_h0wXfdcKkxFIJFRlyOZ90Q_YuKFAiyN'
);

async function test() {
  const { data, error } = await supabase.from('employees').select('*');
  console.log('Data:', data);
  console.log('Error:', error);
}

test();