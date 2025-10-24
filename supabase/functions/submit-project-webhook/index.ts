import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// URL base do seu webhook do n8n
const N8N_WEBHOOK_URL = "https://n8n.braglam.com/webhook/9e3475c0-48f4-436a-992d-d0622a684b22";

serve(async (req) => {
  console.log(`[Webhook] Function started.`); // Log de inicialização
  console.log(`[Webhook] Request received: ${req.method}`);
  
  // Lidar com requisições OPTIONS (CORS)
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 1. Inicializar o cliente Supabase (usando a chave de serviço para acesso seguro ao DB)
  // CORREÇÃO: Usando o operador '!' para garantir que as variáveis de ambiente são strings.
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, 
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  try {
    const body = await req.json();
    const { project_id, user_id } = body;
    
    console.log(`[Webhook] Payload received: project_id=${project_id}, user_id=${user_id}`);

    if (!project_id || !user_id) {
      return new Response(
        JSON.stringify({ error: "project_id and user_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Buscar nomes dos arquivos anexados
    const { data: attachments, error: attachmentError } = await supabase
      .from("project_attachments")
      .select("file_name")
      .eq("project_id", project_id);

    if (attachmentError) {
      console.error("[Webhook] Error fetching attachments:", attachmentError);
      // Continua mesmo com erro, mas registra
    }

    const nome_dos_arquivos = attachments
      ? attachments.map((a) => a.file_name).join(", ")
      : "Nenhum anexo encontrado ou erro na busca.";
      
    console.log(`[Webhook] Attachments found: ${nome_dos_arquivos}`);

    // 3. Preparar o payload JSON para o n8n
    const n8nPayload = {
      user_id: user_id,
      project_id: project_id,
      nome_dos_arquivos: nome_dos_arquivos,
    };
    
    console.log("[Webhook] Sending POST request to n8n with payload:", JSON.stringify(n8nPayload));

    // 4. Enviar para o webhook do n8n usando POST
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: "POST", // Método POST
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(n8nPayload), // Envia o payload no corpo
    });

    if (!n8nResponse.ok) {
      const n8nErrorText = await n8nResponse.text();
      console.error(`[Webhook] N8N Webhook failed: Status ${n8nResponse.status}. Response: ${n8nErrorText}`);
      // Retornamos sucesso para o cliente, mas logamos o erro do webhook
    } else {
      console.log(`[Webhook] N8N Webhook successful: Status ${n8nResponse.status}`);
    }

    return new Response(
      JSON.stringify({ message: "Webhook sent successfully", n8n_status: n8nResponse.status }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[Webhook] Edge Function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});