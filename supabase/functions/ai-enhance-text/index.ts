import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// URL base do seu webhook do n8n
const N8N_WEBHOOK_URL = "https://n8n.braglam.com/webhook/9e3475c0-48f4-436a-992d-d0622a684b22";

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
    // Verificação de autenticação básica
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }
    
    const body = await req.json();
    const { text, project_id, field_name } = body; // Recebendo project_id e field_name
    
    if (typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: "O campo 'text' é obrigatório e deve ser uma string." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    
    if (!project_id || !field_name) {
        console.warn("[AI Enhance Text] project_id or field_name missing in payload. Skipping n8n notification.");
        // Não é um erro fatal, apenas logamos e continuamos
    }

    console.log(`[AI Enhance Text] Enhancing text for project ${project_id}, field: ${field_name}`);
    
    // 1. Aprimorar o texto
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    const enhancedText = enhanceText(text);
    
    // 2. Notificar o webhook do n8n (se os dados estiverem presentes)
    if (project_id && field_name) {
        const n8nPayload = {
            project_id: project_id,
            field_name: field_name,
            action: "ai_enhancement_used",
            original_text_length: text.length,
            enhanced_text_length: enhancedText.length,
        };
        
        console.log("[AI Enhance Text] Sending notification to n8n:", JSON.stringify(n8nPayload));

        const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(n8nPayload),
        });

        if (!n8nResponse.ok) {
            const n8nErrorText = await n8nResponse.text();
            console.error(`[AI Enhance Text] N8N Webhook failed: Status ${n8nResponse.status}. Response: ${n8nErrorText}`);
        } else {
            console.log(`[AI Enhance Text] N8N Webhook successful: Status ${n8nResponse.status}`);
        }
    }

    // 3. Retornar o texto aprimorado para o cliente
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