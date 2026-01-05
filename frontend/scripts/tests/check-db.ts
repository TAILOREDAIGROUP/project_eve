
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://srncvofpzagbntqrhdbu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNybmN2b2ZwemFnYm50cXJoZGJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNjMzMzYsImV4cCI6MjA4MjkzOTMzNn0.XrTPVZp3sd9X6Er-HT86aNtWXFshsEsD9fF-OYFxvd8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOldTables() {
  console.log('--- LATEST 5 MESSAGES ---');
  const { data: msg, error: msgErr } = await supabase.from('messages').select('*').limit(5);
  if (msgErr) console.error(msgErr);
  else msg?.forEach(m => console.log(m));

  console.log('\n--- LATEST 5 USER_MEMORY ---');
  const { data: um, error: umErr } = await supabase.from('user_memory').select('*').limit(5);
  if (umErr) console.error(umErr);
  else um?.forEach(m => console.log(m));
}

checkOldTables().catch(console.error);
