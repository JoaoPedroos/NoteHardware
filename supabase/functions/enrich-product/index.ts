// supabase/functions/enrich-product/index.ts - VERSÃO COM CAMPO DE TECLADO CORRIGIDO

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

    const prompt = `
      Você é um especialista em hardware de notebooks. Para o notebook "${productName}", encontre de 2 a 4 configurações.
      Para cada uma, retorne um objeto JSON com as seguintes chaves:
      - name: O nome completo do modelo.
      - imageUrl: URL de uma imagem.
      - cpu_details: As especificações da CPU.
      - gpu_details: As especificações da GPU.
      - tgp_detectado: O TGP real em watts (apenas o número).
      - ram_details: Detalhes da memória RAM.
      - screen_details: Informações da tela.
      - battery_details: Capacidade da bateria.
      - tgp_range: O intervalo de TGP suportado pela GPU.
      - keyboard_backlight: A iluminação do teclado. Responda com UMA das três opções exatas: "RGB", "Branco", ou "Sem Iluminação".

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
          "battery_details": "...",
          "tgp_range": "90W - 140W",
          "keyboard_backlight": "RGB"
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