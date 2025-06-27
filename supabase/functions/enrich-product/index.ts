// supabase/functions/enrich-product/index.ts - VERSÃO COM PROMPT SIMPLIFICADO

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
    // PROMPT ATUALIZADO SEM OS CAMPOS DE DESEMPENHO
    // ===============================================================
    const prompt = `
      Você é um especialista em hardware de notebooks com foco em análise de GPUs mobile. Seu papel é agir como um assistente técnico de catálogo.

      Para a pesquisa de notebook: "${productName}", encontre de 3 a 5 modelos populares e recentes com configurações similares, focando em variações de TGP para a mesma GPU.

      Para cada modelo encontrado, forneça as seguintes especificações detalhadas:
      - name: O nome completo e exato do notebook.
      - imageUrl: Uma URL de imagem de alta qualidade do produto.
      - cpu_details: Informações completas da CPU (ex: "Intel Core i7-12650HX, 10 núcleos, 16 threads").
      - gpu_details: Informações completas da GPU, incluindo memória, arquitetura e o TGP/TDP configurado (ex: "NVIDIA RTX 4050 Laptop GPU, 6GB GDDR6, 50W TGP").
      - tgp_detectado: O TGP real detectado nos benchmarks ou informado oficialmente pela fabricante (em watts), apenas o número.
      - ram_details: Detalhes da memória RAM (ex: "16GB DDR5-4800MHz, dual-channel").
      - screen_details: Informações completas da tela (ex: "15.6” Full HD 144Hz, 100% sRGB, 300 nits").
      - keyboard_details: Tipo de teclado (ex: "Retroiluminado RGB, ABNT2").
      - battery_details: Capacidade da bateria (ex: "60Wh, 4 células").
      - tgp_range: O intervalo de TGP suportado oficialmente pela GPU (ex: "35W – 115W").

      Retorne a resposta ESTRITAMENTE como um array de objetos JSON. Exemplo:
      [
        {
          "name": "Modelo A",
          "imageUrl": "...",
          "cpu_details": "...",
          "gpu_details": "...",
          "tgp_detectado": 140,
          "ram_details": "...",
          "screen_details": "...",
          "keyboard_details": "...",
          "battery_details": "...",
          "tgp_range": "90W - 140W"
        }
      ]
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