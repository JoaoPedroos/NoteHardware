// src/lib/supabaseClient.js

import { createClient } from '@supabase/supabase-js'

// O código agora lê as variáveis de ambiente de forma segura
const supabaseUrl = "https://jtihxmjbaqwijwewswys.supabase.co";
const supabaseAnonKey = "Mk6k0hMsDcWU6dJKzD7Kx7pA";

// Verifica se as variáveis foram carregadas corretamente
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("As variáveis de ambiente do Supabase não foram encontradas. Verifique seu arquivo .env.local");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
