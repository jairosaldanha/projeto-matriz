import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { ControllerRenderProps, FieldValues } from "react-hook-form";
import { cn } from "@/lib/utils";

// Nome do bucket de arquivos
const ATTACHMENTS_BUCKET = "formulario_arquivos";
const MAX_ATTACHMENTS = 5; // Definindo o limite máximo de anexos

interface UploadedFile {
  id: string; // ID do registro no DB
  file_name: string;
  storage_path: string;
  size_bytes: number;
  mime_type: string;
}

interface AttachmentUploaderProps {
  projectId: string | null;
  userId: string | null;
  field: ControllerRenderProps<FieldValues, any>;
  disabled: boolean;
  onSaveDraft: () => Promise<string | null>; // Adicionado
}

const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({ projectId, userId, field, disabled, onSaveDraft }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  
  // Arquivos selecionados no input (FileList)
  const selectedFiles = field.value as FileList | null;

  // Função auxiliar para formatar tamanho do arquivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Efeito para carregar anexos existentes quando o projectId estiver disponível
  useEffect(() => {
    const fetchAttachments = async () => {
      if (!projectId) return;

      setIsFetching(true);
      
      const { data, error } = await supabase
        .from('project_attachments')
        .select('id, file_name, storage_path, size_bytes, mime_type')
        .eq('project_id', projectId);

      if (error) {
        console.error("Erro ao buscar anexos:", error);
        showError("Falha ao carregar anexos existentes.");
      } else {
        setUploadedFiles(data as UploadedFile[]);
      }
      setIsFetching(false);
    };

    fetchAttachments();
  }, [projectId]);
  
  // Função para chamar a Edge Function de notificação de anexos
  const notifyAttachmentsWebhook = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke('notify-attachments-webhook', {
        body: { project_id: id },
      });

      if (error) {
        console.error("Erro ao chamar Edge Function de notificação de anexos:", error);
        // Não mostramos erro crítico, pois o upload já foi bem-sucedido
      }
    } catch (e) {
      console.error("Erro inesperado ao chamar Edge Function de notificação de anexos:", e);
    }
  }, []);


  const handleUpload = useCallback(async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      showError("Nenhum arquivo selecionado para upload.");
      return;
    }
    if (!userId) {
      showError("Erro: Usuário não autenticado.");
      return;
    }
    
    let currentProjectId = projectId;
    
    // 1. Se o projeto ainda não foi salvo, salve o rascunho primeiro
    if (!currentProjectId) {
      try {
        const savedId = await onSaveDraft();
        if (!savedId) {
          // Se onSaveDraft retornar null (o que não deve acontecer se for bem-sucedido), paramos.
          showError("Falha ao obter ID do projeto após salvar rascunho.");
          return;
        }
        currentProjectId = savedId;
      } catch (e) {
        // O erro já foi tratado e exibido pelo onSaveDraft
        return;
      }
    }
    
    // Garantir que temos o ID do projeto
    if (!currentProjectId) {
      showError("Erro interno: ID do projeto não está disponível.");
      return;
    }
    
    // --- Lógica de Limite de Arquivos ---
    const currentCount = uploadedFiles.length;
    const filesToUpload = Array.from(selectedFiles);
    
    if (currentCount >= MAX_ATTACHMENTS) {
      showError(`Limite máximo de ${MAX_ATTACHMENTS} arquivos já atingido. Exclua um anexo para continuar.`);
      return;
    }
    
    const remainingSlots = MAX_ATTACHMENTS - currentCount;
    let filesToProcess = filesToUpload;
    
    if (filesToUpload.length > remainingSlots) {
      showError(`Você pode enviar no máximo mais ${remainingSlots} arquivo(s). Apenas os primeiros ${remainingSlots} serão processados.`);
      filesToProcess = filesToUpload.slice(0, remainingSlots);
    }
    // ------------------------------------

    setIsUploading(true);
    const toastId = showLoading(`Enviando ${filesToProcess.length} arquivo(s)...`);
    
    const newAttachmentRecords: Omit<UploadedFile, 'id'>[] = [];
    let successfulUploads = 0;

    try {
      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        // O caminho de armazenamento deve ser único e isolado por usuário/projeto
        // Formato: [user_id]/[project_id]/[timestamp]-[file_name]
        const storagePath = `${userId}/${currentProjectId}/${Date.now()}-${file.name}`;

        // 2. Upload para o Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(ATTACHMENTS_BUCKET)
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error(`[Upload Error] Falha no upload do arquivo ${file.name}. Supabase Error:`, uploadError);
          // Se houver um erro de RLS, ele será logado aqui.
          continue; 
        }
        
        successfulUploads++;

        // 3. Preparar registro para o banco de dados
        newAttachmentRecords.push({
          file_name: file.name,
          storage_path: uploadData.path,
          mime_type: file.type,
          size_bytes: file.size,
        });
      }

      if (successfulUploads === 0) {
        // Se chegamos aqui e não houve uploads bem-sucedidos, lançamos um erro
        throw new Error("Nenhum arquivo foi enviado com sucesso. Verifique o console para erros de permissão.");
      }

      // 4. Inserir metadados no banco de dados
      const dbRecords = newAttachmentRecords.map(record => ({
        ...record,
        project_id: currentProjectId,
        user_id: userId,
      }));
      
      const { data: insertedMetadata, error: metadataError } = await supabase
        .from('project_attachments')
        .insert(dbRecords)
        .select('id, file_name, storage_path, size_bytes, mime_type');

      if (metadataError) {
        // Se a inserção falhar, tentamos reverter o upload do storage (melhor esforço)
        const pathsToDelete = newAttachmentRecords.map(r => r.storage_path);
        await supabase.storage.from(ATTACHMENTS_BUCKET).remove(pathsToDelete);
        throw new Error(`Falha ao salvar metadados dos anexos: ${metadataError.message}`);
      }
      
      // 5. Notificar o webhook com os IDs dos anexos (incluindo os recém-inseridos)
      await notifyAttachmentsWebhook(currentProjectId);
      
      // Atualiza a lista de arquivos carregados na UI
      setUploadedFiles(prev => [...prev, ...(insertedMetadata as UploadedFile[])]);
      
      // Limpa o input de arquivo no formulário (seta para null)
      field.onChange(null); 

      dismissToast(toastId);
      showSuccess(`${successfulUploads} arquivo(s) enviado(s) com sucesso!`);

    } catch (error) {
      console.error("Erro durante o upload (Catch Final):", error);
      dismissToast(toastId);
      showError(`Falha no upload: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    } finally {
      setIsUploading(false);
    }
  }, [selectedFiles, projectId, userId, field, onSaveDraft, notifyAttachmentsWebhook, uploadedFiles.length]);
  
  const handleDelete = useCallback(async (file: UploadedFile) => {
    const confirmDelete = window.confirm(`Tem certeza que deseja excluir o arquivo: ${file.file_name}?`);
    if (!confirmDelete) return;

    const toastId = showLoading(`Excluindo ${file.file_name}...`);

    try {
      // 1. Deletar usando a Edge Function (Service Role Key)
      const { error: edgeError } = await supabase.functions.invoke('delete-attachment', {
        body: { storage_path: file.storage_path, attachment_id: file.id },
      });

      if (edgeError) {
        throw new Error(`Falha ao chamar Edge Function de exclusão: ${edgeError.message}`);
      }

      // 2. Atualizar UI
      setUploadedFiles(prev => prev.filter(f => f.id !== file.id));
      
      // 3. Notificar o webhook sobre a mudança (opcional, mas útil para manter o n8n atualizado)
      if (projectId) {
        await notifyAttachmentsWebhook(projectId);
      }

      dismissToast(toastId);
      showSuccess(`Arquivo ${file.file_name} excluído com sucesso.`);

    } catch (error) {
      console.error("Erro ao deletar anexo:", error);
      dismissToast(toastId);
      showError(`Falha ao excluir: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  }, [projectId, notifyAttachmentsWebhook]);


  const isUploadDisabled = disabled || isUploading || !selectedFiles || selectedFiles.length === 0 || !userId;
  
  const remainingSlots = MAX_ATTACHMENTS - uploadedFiles.length;
  const uploadMessage = projectId 
    ? `Você pode anexar até ${MAX_ATTACHMENTS} arquivos. Slots restantes: ${remainingSlots}.` 
    : "Salve o rascunho do projeto ou selecione arquivos para salvar automaticamente.";


  return (
    <div className="space-y-4">
      {/* Input de Arquivo (Controlado pelo RHF via FileInput) */}
      <div className="flex items-center space-x-4">
        <div className="flex-grow">
          {/* O FileInput é renderizado no ProjectAttachments, mas o field.value é usado aqui */}
          {selectedFiles && selectedFiles.length > 0 ? (
            <p className="text-sm font-medium text-primary">
              {selectedFiles.length} arquivo(s) selecionado(s) pronto(s) para upload.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {uploadMessage}
            </p>
          )}
        </div>
        
        <Button 
          type="button" 
          onClick={handleUpload} 
          disabled={isUploadDisabled || remainingSlots === 0}
          className="min-w-[150px]"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Carregando...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Enviar Arquivos
            </>
          )}
        </Button>
      </div>

      {/* Lista de Arquivos Carregados */}
      {(isFetching || uploadedFiles.length > 0) && (
        <div className="border rounded-md p-4 bg-secondary/30">
          <h4 className="text-sm font-semibold mb-2">Arquivos Carregados ({uploadedFiles.length}/{MAX_ATTACHMENTS}):</h4>
          
          {isFetching && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Carregando anexos...</span>
            </div>
          )}

          {!isFetching && uploadedFiles.length > 0 && (
            <ul className="space-y-2">
              {uploadedFiles.map((file) => (
                <li key={file.id} className="flex items-center justify-between text-sm text-foreground/80 p-1 hover:bg-secondary/50 rounded-sm transition-colors">
                  <div className="flex items-center truncate min-w-0 flex-grow">
                    <FileText className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                    <span className="truncate font-medium">{file.file_name}</span>
                  </div>
                  <div className="flex items-center flex-shrink-0 ml-4">
                    <span className="text-xs text-muted-foreground mr-2">
                      {formatFileSize(file.size_bytes)}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={() => handleDelete(file)}
                      disabled={disabled || isUploading}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default AttachmentUploader;