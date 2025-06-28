// src/lib/supabaseClient.js

import { createClient } from '@supabase/supabase-js'

// O código agora lê as variáveis de ambiente de forma segura
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Verifica se as variáveis foram carregadas corretamente
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("As variáveis de ambiente do Supabase não foram encontradas. Verifique seu arquivo .env.local");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
