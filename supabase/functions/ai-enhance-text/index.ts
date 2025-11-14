import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função simples para simular o aprimoramento de texto
function enhanceText(originalText: string): string {
    if (!originalText || originalText.trim().length < 10) {
        return "O texto é muito curto para aprimoramento. Por favor, escreva mais.";
    }
    
    // Simulação de aprimoramento: adiciona uma frase de conclusão e capitaliza a primeira letra.
    const enhanced = originalText.trim();
    const capitalized = enhanced.charAt(0).toUpperCase() + enhanced.slice(1);
    
    if (capitalized.endsWith('.')) {
        return capitalized + " Além disso, a clareza e o foco foram aprimorados pela IA.";
    }
    return capitalized + ". Além disso, a clareza e o foco foram aprimorados pela IA.";
}

serve(async (req) => {
  console.log(`[AI Enhance Text] Function started.`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificação de autenticação básica (apenas para garantir que a requisição vem de um usuário logado)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }
    
    const body = await req.json();
    const { text } = body;
    
    if (typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: "O campo 'text' é obrigatório e deve ser uma string." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`[AI Enhance Text] Enhancing text of length: ${text.length}`);
    
    // Simular um pequeno atraso para parecer que a IA está trabalhando
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    
    const enhancedText = enhanceText(text);

    return new Response(
      JSON.stringify({ enhanced_text: enhancedText }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[AI Enhance Text] Edge Function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});