import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { ControllerRenderProps, FieldValues } from "react-hook-form";
import { cn } from "@/lib/utils";

// Nome do bucket de arquivos
const ATTACHMENTS_BUCKET = "project-uploads";

interface AttachmentUploaderProps {
  projectId: string | null;
  userId: string | null;
  field: ControllerRenderProps<FieldValues, any>;
  disabled: boolean;
}

interface UploadedFile {
  id: string; // ID temporário para a UI
  file_name: string;
  storage_path: string;
  size_bytes: number;
  mime_type: string;
}

const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({ projectId, userId, field, disabled }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  
  // Arquivos selecionados no input (FileList)
  const selectedFiles = field.value as FileList | null;

  const handleUpload = useCallback(async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      showError("Nenhum arquivo selecionado para upload.");
      return;
    }
    if (!projectId || !userId) {
      showError("Erro de autenticação ou ID do projeto ausente. Tente salvar o projeto primeiro.");
      return;
    }

    setIsUploading(true);
    const toastId = showLoading(`Enviando ${selectedFiles.length} arquivo(s)...`);
    
    const newAttachmentRecords: Omit<UploadedFile, 'id'>[] = [];
    let successfulUploads = 0;

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        // O caminho de armazenamento deve ser único e isolado por usuário/projeto
        const storagePath = `${userId}/${projectId}/${Date.now()}-${file.name}`;

        // 1. Upload para o Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(ATTACHMENTS_BUCKET)
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error(`Falha no upload do arquivo ${file.name}:`, uploadError);
          // Continua para o próximo arquivo, mas registra o erro
          continue; 
        }
        
        successfulUploads++;

        // 2. Preparar registro para o banco de dados
        newAttachmentRecords.push({
          file_name: file.name,
          storage_path: uploadData.path,
          mime_type: file.type,
          size_bytes: file.size,
        });
      }

      if (successfulUploads === 0) {
        throw new Error("Nenhum arquivo foi enviado com sucesso.");
      }

      // 3. Inserir metadados no banco de dados
      const dbRecords = newAttachmentRecords.map(record => ({
        ...record,
        project_id: projectId,
        user_id: userId,
      }));
      
      const { data: insertedMetadata, error: metadataError } = await supabase
        .from('project_attachments')
        .insert(dbRecords)
        .select('*');

      if (metadataError) {
        throw new Error(`Falha ao salvar metadados dos anexos: ${metadataError.message}`);
      }
      
      // Atualiza a lista de arquivos carregados na UI
      const newUploadedFiles: UploadedFile[] = insertedMetadata.map((item: any) => ({
        id: item.id, // Usando o ID real do DB
        file_name: item.file_name,
        storage_path: item.storage_path,
        size_bytes: item.size_bytes,
        mime_type: item.mime_type,
      }));
      
      setUploadedFiles(prev => [...prev, ...newUploadedFiles]);
      
      // Limpa o input de arquivo no formulário (seta para null)
      field.onChange(null); 

      dismissToast(toastId);
      showSuccess(`${successfulUploads} arquivo(s) enviado(s) com sucesso!`);

    } catch (error) {
      console.error("Erro durante o upload:", error);
      dismissToast(toastId);
      showError(`Falha no upload: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    } finally {
      setIsUploading(false);
    }
  }, [selectedFiles, projectId, userId, field]);
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
              Selecione os arquivos acima para habilitar o botão de upload.
            </p>
          )}
        </div>
        
        <Button 
          type="button" 
          onClick={handleUpload} 
          disabled={disabled || isUploading || !selectedFiles || selectedFiles.length === 0}
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
      {uploadedFiles.length > 0 && (
        <div className="border rounded-md p-4 bg-secondary/30">
          <h4 className="text-sm font-semibold mb-2">Arquivos Carregados ({uploadedFiles.length}):</h4>
          <ul className="space-y-2">
            {uploadedFiles.map((file) => (
              <li key={file.id} className="flex items-center justify-between text-sm text-foreground/80">
                <div className="flex items-center truncate">
                  <FileText className="h-4 w-4 mr-2 text-primary" />
                  <span className="truncate">{file.file_name}</span>
                </div>
                <span className="text-xs text-muted-foreground ml-4 flex-shrink-0">
                  {formatFileSize(file.size_bytes)}
                </span>
                {/* Implementação de exclusão (opcional, mas boa prática) */}
                {/* <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-2">
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button> */}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AttachmentUploader;