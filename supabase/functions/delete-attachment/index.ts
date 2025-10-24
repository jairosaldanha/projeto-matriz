import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log(`[Delete Attachment] Function started.`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Inicializar o cliente Supabase com a CHAVE DE SERVIÇO
  // Isso permite ignorar RLS e deletar arquivos de qualquer usuário.
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
    const { storage_path, attachment_id } = body;
    
    console.log(`[Delete Attachment] Payload received: path=${storage_path}, id=${attachment_id}`);

    if (!storage_path || !attachment_id) {
      return new Response(
        JSON.stringify({ error: "storage_path and attachment_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 1. Deletar do Supabase Storage
    const { error: storageError } = await supabase.storage
      .from("formulario_arquivos")
      .remove([storage_path]);

    if (storageError) {
      console.error("[Delete Attachment] Error deleting from Storage:", storageError);
      // Se o arquivo não existir, o Supabase ainda retorna um erro, mas podemos prosseguir para o DB
    } else {
      console.log(`[Delete Attachment] File deleted from Storage: ${storage_path}`);
    }

    // 2. Deletar o metadado do banco de dados
    const { error: dbError } = await supabase
      .from("project_attachments")
      .delete()
      .eq("id", attachment_id);

    if (dbError) {
      console.error("[Delete Attachment] Error deleting metadata from DB:", dbError);
      throw new Error(`Falha ao deletar metadados do DB: ${dbError.message}`);
    }
    
    console.log(`[Delete Attachment] Metadata deleted from DB: ${attachment_id}`);

    return new Response(
      JSON.stringify({ message: "Attachment deleted successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[Delete Attachment] Edge Function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});