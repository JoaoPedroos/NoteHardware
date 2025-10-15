// supabase/functions/enrich-product/index.ts - VERSÃO REFINADA

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// Headers CORS permanecem os mesmos
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// A URL da API está correta
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

serve(async (req) => {
  // Tratamento da requisição OPTIONS (preflight) está perfeito
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Validação de segurança e ambiente
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      // É uma boa prática logar o erro no servidor para depuração
      console.error("Segredo GEMINI_API_KEY não encontrado.");
      throw new Error("Configuração do servidor incompleta."); // Mensagem mais genérica para o cliente
    }

    // 2. Validação da entrada do cliente
    const { productName } = await req.json();
    if (!productName || typeof productName !== 'string') {
      throw new Error("Faltando ou inválido 'productName' no corpo da requisição.");
    }

    // 3. Construção do Prompt (O seu prompt está excelente, mantido como está)
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

    // 4. Chamada para a API do Gemini
    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // Usar o modo JSON é a melhor prática aqui!
        generationConfig: {
            responseMimeType: "application/json",
        }
      }),
    });

    // 5. Tratamento de erro da API
    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error(`Erro da API Google AI: ${errorBody}`);
      throw new Error("Falha ao comunicar com o serviço de IA.");
    }

    // 6. Processamento da Resposta
    const geminiData = await geminiResponse.json();
    
    // Verificação de segurança para garantir que a resposta veio como esperado
    if (!geminiData.candidates || !geminiData.candidates[0]?.content?.parts[0]?.text) {
        throw new Error("Resposta da IA recebida em um formato inesperado.");
    }

    // Com `responseMimeType: "application/json"`, o texto já deve ser um JSON válido.
    // A extração manual com `indexOf` e `lastIndexOf` se torna um plano B, não a regra.
    const jsonText = geminiData.candidates[0].content.parts[0].text;
    const productData = JSON.parse(jsonText);

    // 7. Retorno de sucesso
    return new Response(JSON.stringify(productData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // Centraliza todo o tratamento de erro aqui
    console.error("Erro na Edge Function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      // Usa um código de erro mais apropriado se o erro for do lado do servidor
      status: error instanceof TypeError ? 400 : 500,
    });
  }
});