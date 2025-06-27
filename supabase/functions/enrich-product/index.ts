// supabase/functions/enrich-product/index.ts - VERSÃO FINAL COM PARSING ROBUSTO PARA TODOS OS CAMPOS

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
      Você é um especialista em hardware de notebooks com foco em análise de desempenho real de GPUs mobile. Seu papel é agir como um assistente técnico de catálogo e ajudar usuários a entenderem qual notebook oferece melhor desempenho considerando o TGP (Total Graphics Power) real da GPU.

      Para a pesquisa de notebook: "${productName}", pesquise e encontre de 3 a 5 modelos populares e recentes com configurações similares, que **podem incluir GPUs diferentes, mas dentro de uma faixa de desempenho comparável ao produto pesquisado**, focando na relevância do TGP para o desempenho final.

      Para cada modelo encontrado, forneça as seguintes especificações detalhadas em formato JSON. Seja extremamente preciso e tente extrair os valores numéricos e textuais exatos conforme as descrições abaixo. Se um valor não for encontrado, use \`null\`.

      - name: O nome completo e exato do modelo do notebook (string).
      - imageUrl: Uma URL de imagem de alta qualidade do produto (string).
      - price: O preço aproximado do notebook em BRL, apenas o número (float, ex: 4999.99).
      - description: Uma breve descrição geral do notebook (string).
      - product_url: Uma URL de onde o produto pode ser encontrado/comprado (string).

      - cpu_details: Informações completas da CPU (string, ex: "Intel Core i7-12650HX, 10 núcleos, 16 threads, 2.3 GHz base, 4.7 GHz turbo").
      - cpu_base_ghz: Frequência base do CPU em GHz, apenas o número (float, ex: 2.3).
      - cpu_turbo_ghz: Frequência turbo/boost máxima do CPU em GHz, apenas o número (float, ex: 4.7).
      - cpu_cores: Número de núcleos do CPU, apenas o número (integer, ex: 10).
      - cpu_threads: Número de threads do CPU, apenas o número (integer, ex: 16).
      - cpu_intel_series: A série do processador Intel (string, ex: "i3", "i5", "i7", "i9").
      - cpu_intel_generation: A geração do processador Intel (integer, ex: 11, 12, 13, 14).
      - cpu_amd_series: A série do processador AMD (string, ex: "Ryzen 3", "Ryzen 5", "Ryzen 7", "Ryzen 9").
      - cpu_amd_generation: A geração do processador AMD (integer, ex: 5000, 6000, 7000, 8000, 9000).

      - gpu_details: Informações completas da GPU (string, ex: "NVIDIA GeForce RTX 4050 Laptop GPU, 6GB GDDR6").
      - gpu_brand: A marca da GPU (string, ex: "NVIDIA", "AMD", "Intel").
      - gpu_series: A série específica da GPU (string, ex: "RTX 4050", "RX 7600M", "Iris Xe", "UHD Graphics").
      - gpu_vram_gb: A quantidade de VRAM da GPU em GB, apenas o número (integer, ex: 6).
      - tgp_detectado: O TGP real detectado (em watts), apenas o número (integer).
      - fps_medio_1080p_ultra: O desempenho médio em jogos modernos em 1080p Ultra (FPS), baseado em testes reais, apenas o número (integer).
      - performance_por_watt: Valor calculado (fps_medio_1080p_ultra / tgp_detectado), com duas casas decimais, apenas o número (float).

      - ram_details: Detalhes da memória RAM (string, ex: "16GB DDR5-4800MHz, dual-channel").
      - ram_size_gb: Tamanho da memória RAM em GB, apenas o número (integer, ex: 16).

      - storage_details: Detalhes do armazenamento (string, ex: "1TB PCIe Gen4 NVMe SSD").
      - storage_gb: Tamanho total do armazenamento em GB, apenas o número (integer, converta TB para GB, ex: 1TB = 1024GB).

      - screen_details: Informações completas da tela (string, ex: "15.6” Full HD 144Hz, 100% sRGB, 300 nits, IPS").
      - screen_size_inches: Tamanho da tela em polegadas, apenas o número (float, ex: 15.6).
      - screen_hz: Taxa de atualização da tela em Hz, apenas o número (integer, ex: 144).
      - screen_nits: Brilho da tela em nits, apenas o número (integer, ex: 300).
      - screen_panel_type: Tipo de painel da tela (string, ex: "IPS", "OLED", "TN", "VA", "mini-LED").

      - keyboard_details: Tipo de teclado (string, ex: "Retroiluminado RGB, ABNT2").
      - keyboard_type_feature: Característica principal do teclado (string, ex: "RGB", "Branco").

      - battery_details: Capacidade da bateria (string, ex: "60Wh, 4 células").
      - charger_wattage: Potência do carregador em Watts, apenas o número (integer, ex: 180).

      - tgp_range: O intervalo de TGP suportado oficialmente pela GPU (string, ex: "35W – 115W").

      Após listar os notebooks, determine automaticamente e inclua no JSON final, esses cálculos baseados nos valores da lista:
      - desempenho_relativo: Calculado com base no notebook com maior FPS da lista usando a fórmula: (FPS_atual / FPS_mais_alto) * 100, com duas casas decimais, apenas o número (float).
      - perda_percentual: A diferença de desempenho entre o notebook mais fraco e o mais forte, calculada como: ((FPS_mais_alto - FPS_atual) / FPS_mais_alto) * 100, com duas casas decimais, apenas o número (float).
      - ganho_eficiencia_percentual: Diferença entre as eficiências (FPS/Watt) usando a fórmula: ((eff_mais_eficiente - eff_menos_eficiente) / eff_menos_eficiente) * 100, com duas casas decimais, apenas o número (float).

      Retorne a resposta ESTRITAMENTE como um array de objetos JSON. Não inclua "'''json" ou qualquer outra formatação de código no início ou fim.
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
      throw new Error("A resposta da IA não continha um array JSON válido ou estava vazia.");
    }
    jsonText = jsonText.substring(startIndex, endIndex + 1);

    const productData = JSON.parse(jsonText);

    // Bloco de pós-processamento robusto
    const processedData = productData.map(item => {
        // Funções auxiliares de parsing
        const parseNumber = (value) => {
            if (typeof value === 'number') return value;
            if (typeof value === 'string') {
                const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
                return isNaN(num) ? null : num;
            }
            return null;
        };
        const parseIntStrict = (value) => {
            if (typeof value === 'number') return Math.round(value);
            if (typeof value === 'string') {
                const num = parseInt(value.replace(/[^0-9]/g, ''), 10);
                return isNaN(num) ? null : num;
            }
            return null;
        };

        // --- Parsing CPU ---
        if (item.cpu_details) {
            item.cpu_base_ghz = parseNumber(item.cpu_base_ghz) || parseNumber(item.cpu_details.match(/(\d+\.\d+|\d+)\s*GHz/i)?.[1]);
            item.cpu_turbo_ghz = parseNumber(item.cpu_turbo_ghz) || parseNumber(item.cpu_details.match(/turbo(?: max)?:\s*(\d+\.\d+|\d+)\s*GHz/i)?.[1]);
            item.cpu_cores = parseIntStrict(item.cpu_cores) || parseIntStrict(item.cpu_details.match(/(\d+)\s*(?:nucleos|cores)/i)?.[1]);
            item.cpu_threads = parseIntStrict(item.cpu_threads) || parseIntStrict(item.cpu_details.match(/(\d+)\s*(?:threads|fios)/i)?.[1]);

            if (item.cpu_details.toLowerCase().includes('intel')) {
                item.cpu_intel_series = item.cpu_intel_series || item.cpu_details.match(/i([3579])/i)?.[0];
                item.cpu_intel_generation = parseIntStrict(item.cpu_intel_generation) || parseIntStrict(item.cpu_details.match(/i\d{1,2}-?(\d{2})\d{3}/i)?.[1]);
            } else {
                item.cpu_intel_series = null; item.cpu_intel_generation = null;
            }

            if (item.cpu_details.toLowerCase().includes('ryzen') || item.cpu_details.toLowerCase().includes('amd')) {
                item.cpu_amd_series = item.cpu_amd_series || item.cpu_details.match(/Ryzen\s*([3579])|R([3579])/i)?.[0];
                if (item.cpu_amd_series && item.cpu_amd_series.startsWith('R')) item.cpu_amd_series = `Ryzen ${item.cpu_amd_series.substring(1)}`;

                item.cpu_amd_generation = parseIntStrict(item.cpu_amd_generation) || (item.cpu_details.match(/Ryzen\s*\d\s*(\d)\d{3}/i) || item.cpu_details.match(/R\d-?(\d)\d{3}/i))?.[1];
                if (item.cpu_amd_generation && String(item.cpu_amd_generation).length === 1) item.cpu_amd_generation = parseIntStrict(String(item.cpu_amd_generation) + '000');
            } else {
                item.cpu_amd_series = null; item.cpu_amd_generation = null;
            }
        }

        // --- Parsing GPU ---
        if (item.gpu_details) {
            item.gpu_brand = item.gpu_brand || (item.gpu_details.toLowerCase().includes('nvidia') ? 'NVIDIA' : item.gpu_details.toLowerCase().includes('amd') || item.gpu_details.toLowerCase().includes('radeon') ? 'AMD' : item.gpu_details.toLowerCase().includes('intel') ? 'Intel' : null);
            item.gpu_series = item.gpu_series || (item.gpu_details.match(/RTX\s*(\d{3,4}(?:s|Ti)?)/i) || item.gpu_details.match(/RX\s*(\d{3,4}(?:M|S)?)/i) || item.gpu_details.match(/GTX\s*(\d{3,4})/i) || item.gpu_details.match(/UHD\s*Graphics/i) || item.gpu_details.match(/Iris\s*Xe/i) || item.gpu_details.match(/Arc\s*([A]\d{3,4}M?)/i) || item.gpu_details.match(/Radeon\s*Graphics/i))?.[0];
            item.tgp_detectado = parseIntStrict(item.tgp_detectado) || parseIntStrict(item.gpu_details.match(/(\d+)\s*W/i)?.[1]);
            item.gpu_vram_gb = parseIntStrict(item.gpu_vram_gb) || parseIntStrict(item.gpu_details.match(/(\d+)\s*GB(?:\s*GDDR\d+)?/i)?.[1]);
        }

        // --- Parsing RAM ---
        if (item.ram_details) {
            item.ram_size_gb = parseIntStrict(item.ram_size_gb) || parseIntStrict(item.ram_details.match(/(\d+)\s*GB/i)?.[1]);
        }

        // --- Parsing Storage ---
        if (item.storage_details) {
            if (typeof item.storage_gb !== 'number') {
                const gbMatch = item.storage_details.match(/(\d+(?:\.\d+)?)\s*(GB|TB)/i);
                if (gbMatch) {
                    let size = parseNumber(gbMatch[1]);
                    if (gbMatch[2].toLowerCase() === 'tb') { size *= 1024; }
                    item.storage_gb = Math.round(size);
                } else { item.storage_gb = null; }
            }
        }

        // --- Parsing Screen ---
        if (item.screen_details) {
            item.screen_size_inches = parseNumber(item.screen_size_inches) || parseNumber(item.screen_details.match(/(\d+\.?\d*)\s*[”"]/)?.[1]);
            item.screen_hz = parseIntStrict(item.screen_hz) || parseIntStrict(item.screen_details.match(/(\d+)\s*Hz/i)?.[1]);
            item.screen_nits = parseIntStrict(item.screen_nits) || parseIntStrict(item.screen_details.match(/(\d+)\s*nits/i)?.[1]);
            item.screen_panel_type = item.screen_panel_type || item.screen_details.match(/(TN|IPS|VA|mini-LED|OLED)/i)?.[0];
        }

        // --- Parsing Keyboard ---
        if (item.keyboard_details) {
            item.keyboard_type_feature = item.keyboard_type_feature || (item.keyboard_details.toLowerCase().includes('rgb') ? 'RGB' : item.keyboard_details.toLowerCase().includes('branco') ? 'Branco' : null);
        }

        // --- Parsing Battery and Charger Wattage ---
        // Prioriza charger_wattage se IA preencheu
        if (typeof item.charger_wattage !== 'number' || item.charger_wattage === null) {
            // Tenta extrair de battery_details ou description ou de charger_wattage se IA deu como string
            const combinedText = (item.battery_details || '') + ' ' + (item.description || '') + ' ' + (String(item.charger_wattage) || '');
            const chargerWattageMatch = combinedText.match(/(\d+)\s*W\s*(?:carregador|charger|power\s*adapter)/i);
            item.charger_wattage = parseIntStrict(chargerWattageMatch ? chargerWattageMatch[1] : null);
        }
        // Se battery_details está faltando
        if (!item.battery_details) {
            // Tenta adivinhar uma descrição básica se houver charger_wattage
            if (item.charger_wattage) {
                item.battery_details = `Bateria padrão (Carregador ${item.charger_wattage}W)`;
            } else {
                item.battery_details = null; // Ou uma string padrão 'Capacidade não informada'
            }
        }
        
        // Ensure other numbers are parsed
        item.price = parseNumber(item.price);
        item.fps_medio_1080p_ultra = parseIntStrict(item.fps_medio_1080p_ultra);
        item.performance_por_watt = parseNumber(item.performance_por_watt);
        item.desempenho_relativo = parseNumber(item.desempenho_relativo);
        item.perda_percentual = parseNumber(item.perda_percentual);
        item.ganho_eficiencia_percentual = parseNumber(item.ganho_eficiencia_percentual);

        return item;
    });


    return new Response(JSON.stringify(processedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Erro na Edge Function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});