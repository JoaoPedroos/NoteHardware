// supabase/functions/enrich-product/index.ts - VERSÃO COM PROMPT DE CPU DETALHADO

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) throw new Error("Segredo GEMINI_API_KEY não encontrado.");

    const { productName } = await req.json();
    if (!productName) throw new Error("Faltando 'productName' no corpo da requisição.");

    // ===============================================================
    // PROMPT ATUALIZADO COM TODOS OS CAMPOS DE CPU DETALHADOS
    // ===============================================================
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
      Exemplo de um item no array:
      {
        "name": "Dell G15 com i7",
        "description": "Notebook de alto desempenho com processador Intel Core i7 de 13ª geração e placa de vídeo dedicada RTX 3050, ideal para jogos, produtividade e tarefas intensivas."
        "image_url": "https://.../image.jpg",
        "cpu_details": "Intel Core i7-12650H, 10 núcleos, 16 threads, até 4.7 GHz",
        "cpu_brand": "Intel",
        "cpu_intel_series": "Core i7",
        "cpu_intel_generation": 12,
        "cpu_amd_series": null,
        "cpu_amd_generation": null,
        "cpu_turbo_ghz": 4.7,
        "cpu_cores": 10,
        "cpu_threads": 16,
        "gpu_details": "NVIDIA GeForce RTX 3050 Laptop, 4GB GDDR6",
        "gpu_brand": "NVIDIA",
        "gpu_series": "RTX 30",
        "gpu_vram": "4GB GDDR6",
        "tgp_detectado": 95,
        "ram_details": "16GB DDR5-4800MHz",
        "storage_details": "SSD 512GB PCIe NVMe M.2",
        "screen_details": "15.6 polegadas, Full HD 120Hz",
        "keyboard_backlight": "Branco",
        "battery_details": "90Wh",
        "charger_wattage": "240W",
        "tgp_range": "80W-95W",
        "offers": [
          { "store_name": "Dell Oficial", "price": 6999.00, "url": "https://..." }
        ]
      }
    `;

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

    if (!geminiResponse.ok) {
      throw new Error(`Erro da API Google AI: ${await geminiResponse.text()}`);
    }

    const geminiData = await geminiResponse.json();
    let jsonText = geminiData.candidates[0].content.parts[0].text;

    const startIndex = jsonText.indexOf('[');
    const endIndex = jsonText.lastIndexOf(']');
    if (startIndex === -1 || endIndex === -1) {
      throw new Error("A resposta da IA não continha um array JSON válido.");
    }
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