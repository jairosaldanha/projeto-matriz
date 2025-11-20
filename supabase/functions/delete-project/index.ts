import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ATTACHMENTS_BUCKET = "formulario_arquivos";

serve(async (req) => {
  console.log(`[Delete Project] Function started.`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Inicializar o cliente Supabase com a CHAVE DE SERVIÇO
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
    
    console.log(`[Delete Project] Payload received: project_id=${project_id}, user_id=${user_id}`);

    if (!project_id || !user_id) {
      return new Response(
        JSON.stringify({ error: "project_id and user_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 1. Buscar todos os caminhos de armazenamento dos anexos
    const { data: attachments, error: fetchError } = await supabase
      .from("project_attachments")
      .select("storage_path")
      .eq("project_id", project_id);

    if (fetchError) {
      console.error("[Delete Project] Error fetching attachments:", fetchError);
      // Continuamos, pois o erro pode ser temporário ou não haver anexos
    }

    // 2. Deletar arquivos do Supabase Storage (se houver)
    if (attachments && attachments.length > 0) {
      const pathsToDelete = attachments.map(a => a.storage_path);
      
      const { error: storageError } = await supabase.storage
        .from(ATTACHMENTS_BUCKET)
        .remove(pathsToDelete);

      if (storageError) {
        console.error("[Delete Project] Error deleting from Storage:", storageError);
        // Logamos, mas continuamos para deletar o registro principal
      } else {
        console.log(`[Delete Project] ${pathsToDelete.length} files deleted from Storage.`);
      }
    }

    // 3. Deletar o registro principal do projeto no DB
    // A exclusão do registro do projeto deve acionar a exclusão dos metadados de anexos (project_attachments) via ON DELETE CASCADE.
    const { error: dbError } = await supabase
      .from("projects")
      .delete()
      .eq("id", project_id)
      .eq("user_id", user_id); // Adicionamos user_id para uma camada extra de segurança (embora a Service Role Key ignore RLS, é boa prática)

    if (dbError) {
      console.error("[Delete Project] Error deleting project metadata from DB:", dbError);
      throw new Error(`Falha ao deletar projeto do DB: ${dbError.message}`);
    }
    
    console.log(`[Delete Project] Project metadata deleted: ${project_id}`);

    return new Response(
      JSON.stringify({ message: "Project and associated files deleted successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[Delete Project] Edge Function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});