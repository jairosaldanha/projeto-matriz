import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// URL do webhook de teste fornecido pelo usuário
const N8N_WEBHOOK_TEST_URL = "https://n8n.braglam.com/webhook-test/9e3475c0-48f4-436a-992d-d0622a684b22";

serve(async (req) => {
  console.log(`[Notify Attachments Webhook] Function started.`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Inicializar o cliente Supabase com a chave de serviço para acesso seguro
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
    const { project_id } = body;
    
    console.log(`[Notify Attachments Webhook] Payload received: project_id=${project_id}`);

    if (!project_id) {
      return new Response(
        JSON.stringify({ error: "project_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 1. Buscar IDs e nomes dos anexos para o projeto
    const { data: attachments, error: attachmentError } = await supabase
      .from("project_attachments")
      .select("id, file_name")
      .eq("project_id", project_id);

    if (attachmentError) {
      console.error("[Notify Attachments Webhook] Error fetching attachments:", attachmentError);
      throw new Error(`Falha ao buscar anexos: ${attachmentError.message}`);
    }

    const attachment_ids = attachments.map((a) => a.id);
    const attachment_names = attachments.map((a) => a.file_name);
      
    console.log(`[Notify Attachments Webhook] Attachment IDs found: ${attachment_ids.join(", ")}`);

    // 2. Preparar o payload JSON para o n8n
    const n8nPayload = {
      project_id: project_id,
      attachment_ids: attachment_ids,
      attachment_names: attachment_names,
      count: attachment_ids.length,
    };
    
    console.log("[Notify Attachments Webhook] Sending POST request to n8n with payload:", JSON.stringify(n8nPayload));

    // 3. Enviar para o webhook do n8n
    const n8nResponse = await fetch(N8N_WEBHOOK_TEST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(n8nPayload),
    });

    if (!n8nResponse.ok) {
      const n8nErrorText = await n8nResponse.text();
      console.error(`[Notify Attachments Webhook] N8N Webhook failed: Status ${n8nResponse.status}. Response: ${n8nErrorText}`);
      // Retornamos sucesso para o cliente, mas logamos o erro do webhook
    } else {
      console.log(`[Notify Attachments Webhook] N8N Webhook successful: Status ${n8nResponse.status}`);
    }

    return new Response(
      JSON.stringify({ message: "Webhook sent successfully", n8n_status: n8nResponse.status }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[Notify Attachments Webhook] Edge Function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});