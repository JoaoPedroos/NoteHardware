// supabase/functions/enrich-product/index.ts - VERSÃO COMPLETA E SEGURA

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// Headers para permitir que seu site chame esta função (CORS)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// URL da API do Gemini
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

serve(async (req) => {
  // Responde a requisições 'OPTIONS' (necessário para o CORS funcionar)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. VERIFICAÇÃO DE SEGURANÇA: Checa se a chave da API está configurada nos segredos da Supabase
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      console.error("Erro Crítico: Segredo GEMINI_API_KEY não foi encontrado no ambiente.");
      // Lança um erro que será capturado pelo 'catch' e retornará um erro 500
      throw new Error("A configuração do servidor está incompleta.");
    }

    // 2. VALIDAÇÃO DA REQUISIÇÃO: Checa se o corpo da requisição está correto
    const { productName } = await req.json();
    if (!productName || typeof productName !== 'string') {
      // Se 'productName' estiver faltando ou não for texto, retorna um erro 400
      return new Response(JSON.stringify({ error: "O campo 'productName' é obrigatório e deve ser uma string." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400, // Bad Request
      });
    }

    // 3. CRIAÇÃO DO PROMPT: Seu prompt detalhado é inserido aqui
    const prompt = `
      Você é um especialista em hardware de notebooks e um assistente de busca de preços.
      Para o notebook de referência "${productName}", encontre de 2 a 3 configurações populares.

      Para cada configuração encontrada, forneça as especificações de hardware e, adicionalmente, encontre até 6 ofertas de preço em lojas online brasileiras populares (como Amazon BR, Magazine Luiza, Kabum!, Pichau, Fast Shop).

      A resposta para cada notebook deve ser um objeto JSON com a seguinte estrutura:
      - name (string)
      - description (string): Descrição dos notebooks
      - image_url (string): imagem dos notebooks
      - cpu_details (string): A descrição completa da CPU (ex: "Intel Core i7-12650H, 10 núcleos (6 P-core + 4 E-core), 16 threads, até 4.7 GHz").
      - cpu_brand (string): A marca, "Intel" ou "AMD".
      - cpu_intel_series (string, opcional): A série, como "Core i7".
      - cpu_intel_generation (number, opcional): A geração, como 12.
      - cpu_amd_series (string, opcional): A série, como "Ryzen 7".
      - cpu_amd_generation (number, opcional): A geração, como 6000.
      - cpu_turbo_ghz (number): A frequência máxima em GHz, apenas o número.
      - cpu_cores (number): O número total de núcleos.
      - cpu_threads (number): O número total de threads.
      - gpu_details (string)
      - gpu_brand (string)
      - gpu_series (string) : ex: RTX 4050 = RTX 40 Series outro caso RTX 3070 = RTX 30 Series
      - gpu_vram (string): A memoria da placa de video
      - tgp_detectado (number)
      - tgp_range (string)
      - ram_details (string)
      - storage_details (string)
      - screen_details (string)
      - keyboard_backlight (string: "RGB", "Branco", ou "Sem Iluminação")
      - battery_details (string)
      - offers (array de objetos): Um array contendo as ofertas encontradas. Cada objeto de oferta deve ter as chaves:
          - store_name (string): O nome da loja (ex: "Amazon BR").
          - price (number): O preço em BRL, apenas o número.
          - url (string): O link direto para a página do produto na loja.
      - charger_wattage (string): Watts do carregador do notebook

      Retorne a resposta ESTRITAMENTE como um array de objetos JSON.
    `;

    // 4. CHAMADA PARA A API DO GEMINI
    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
        }
      }),
    });

    // 5. TRATAMENTO DE ERRO DA API EXTERNA
    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error(`Erro da API do Gemini: Status ${geminiResponse.status} - ${errorBody}`);
      throw new Error("O serviço de IA retornou um erro.");
    }

    // 6. PROCESSAMENTO DA RESPOSTA DE SUCESSO
    const geminiData = await geminiResponse.json();
    if (!geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.error("Formato de resposta inesperado da API Gemini:", geminiData);
        throw new Error("A IA retornou uma resposta em um formato inválido.");
    }

    const jsonText = geminiData.candidates[0].content.parts[0].text;
    const productData = JSON.parse(jsonText);

    // 7. RETORNO DE SUCESSO PARA O CLIENTE (REACT)
    return new Response(JSON.stringify(productData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // CAPTURA CENTRALIZADA DE ERROS: Qualquer erro no bloco 'try' cairá aqui.
    console.error("Erro geral na Edge Function:", error.message);
    return new Response(JSON.stringify({ error: error.message || "Ocorreu um erro inesperado no servidor." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, // Internal Server Error
    });
  }
});