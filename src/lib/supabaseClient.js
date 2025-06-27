import { createClient } from '@supabase/supabase-js'

// Substitua com a URL e a chave anon do seu projeto Supabase
const supabaseUrl = 'https://jtihxmjbaqwijwewswys.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0aWh4bWpiYXF3aWp3ZXdzd3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MTQ1ODcsImV4cCI6MjA2NjM5MDU4N30.dk3YIZCvY69NajDLhA37pl47rmu1UQVwld2G21FfyzE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);