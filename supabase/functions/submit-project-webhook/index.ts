import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// URL do seu webhook do n8n
const N8N_WEBHOOK_URL = "https://n8n.braglam.com/webhook/9e3475c0-48f4-436a-992d-d0622a684b22";

serve(async (req) => {
  // Lidar com requisições OPTIONS (CORS)
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 1. Inicializar o cliente Supabase (usando a chave de serviço para acesso seguro ao DB)
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // Usamos a chave de serviço para ignorar RLS e garantir a leitura dos dados
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  try {
    const { project_id, user_id } = await req.json();

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
      console.error("Error fetching attachments:", attachmentError);
      // Continua mesmo com erro, mas registra
    }

    const nome_dos_arquivos = attachments
      ? attachments.map((a) => a.file_name).join(", ")
      : "Nenhum anexo encontrado ou erro na busca.";

    // 3. Preparar o payload para o n8n
    const n8nPayload = {
      user_id: user_id,
      project_id: project_id,
      nome_dos_arquivos: nome_dos_arquivos,
    };

    // 4. Enviar para o webhook do n8n
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(n8nPayload),
    });

    if (!n8nResponse.ok) {
      console.error("N8N Webhook failed:", n8nResponse.status, await n8nResponse.text());
      // Retornamos sucesso para o cliente, mas logamos o erro do webhook
    }

    return new Response(
      JSON.stringify({ message: "Webhook sent successfully", n8n_status: n8nResponse.status }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Edge Function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});