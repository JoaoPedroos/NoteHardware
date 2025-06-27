// supabase/functions/enrich-product/index.ts - VERSÃO COM PROMPT SUPER DETALHADO

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// ... (código do corsHeaders e da URL da API, igual ao anterior) ...
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';


serve(async (req) => {
  // ... (código do OPTIONS e try/catch inicial) ...
  if (req.method === 'OPTIONS') { return new Response('ok', { headers: corsHeaders }) }
  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) throw new Error("Segredo GEMINI_API_KEY não encontrado.");

    const { productName } = await req.json();
    if (!productName) throw new Error("Faltando 'productName' no corpo da requisição.");

    const prompt = `
      Você é um assistente especialista em hardware. Para o notebook "${productName}", encontre de 2 a 4 configurações populares.
      Para cada uma, retorne um objeto JSON com as seguintes chaves e tipos de dados:
      - name (string): O nome completo do modelo.
      - imageUrl (string): URL de uma imagem.
      - price (number): Um preço médio em BRL, apenas o número.
      - description (string): Uma descrição curta.
      - product_url (string): URL da página oficial do produto.
      - cpu_details (string): Descrição da CPU.
      - cpu_brand (string): "Intel" ou "AMD".
      - cpu_intel_series (string, opcional): Ex: "Core i7".
      - cpu_intel_generation (number, opcional): Ex: 13.
      - cpu_amd_series (string, opcional): Ex: "Ryzen 9".
      - cpu_amd_generation (number, opcional): Ex: 7000.
      - cpu_base_ghz (number): Frequência base em GHz.
      - cpu_turbo_ghz (number): Frequência turbo em GHz.
      - cpu_cores (number): Número de núcleos.
      - cpu_threads (number): Número de threads.
      - gpu_details (string): Descrição da GPU.
      - gpu_brand (string): "NVIDIA", "AMD", ou "Intel".
      - gpu_series (string): Ex: "RTX 4070".
      - gpu_vram_gb (number): VRAM em GB.
      - tgp_detectado (number): TGP em Watts.
      - tgp_range (string): Ex: "90W - 140W".
      - ram_details (string): Descrição da RAM.
      - ram_size_gb (number): Tamanho em GB.
      - storage_details (string): Descrição do armazenamento.
      - storage_gb (number): Tamanho em GB.
      - screen_details (string): Descrição da tela.
      - screen_size_inches (number): Tamanho em polegadas.
      - screen_hz (number): Taxa de atualização em Hz.
      - screen_nits (number): Brilho em nits.
      - screen_panel_type (string): "IPS", "OLED", etc.
      - keyboard_details (string): Descrição do teclado.
      - keyboard_type_feature (string): "RGB", "Branco", ou "Sem Iluminação".
      - battery_details (string): Descrição da bateria.
      - charger_wattage (number): Potência do carregador em Watts.

      Retorne a resposta ESTRITAMENTE como um array de objetos JSON.
    `;
    // ... (resto da função fetch, parse e return, igual ao anterior) ...
    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      }),
    });
    if (!geminiResponse.ok) { throw new Error(`Erro da API Google AI: ${await geminiResponse.text()}`) }
    const geminiData = await geminiResponse.json();
    let jsonText = geminiData.candidates[0].content.parts[0].text;
    const startIndex = jsonText.indexOf('[');
    const endIndex = jsonText.lastIndexOf(']');
    if (startIndex === -1 || endIndex === -1) { throw new Error("A resposta da IA não continha um array JSON válido.") }
    jsonText = jsonText.substring(startIndex, endIndex + 1);
    const productData = JSON.parse(jsonText);
    return new Response(JSON.stringify(productData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});