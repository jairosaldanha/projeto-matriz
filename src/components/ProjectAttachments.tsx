import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FileInput from "./FileInput";
import { Control, Controller } from "react-hook-form";
import AttachmentUploader from "./AttachmentUploader";

interface ProjectAttachmentsProps {
  control: Control<any>;
  error: string | undefined;
  projectId: string | null;
  userId: string | null;
  isSubmitting: boolean;
}

const ProjectAttachments: React.FC<ProjectAttachmentsProps> = ({ control, error, projectId, userId, isSubmitting }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Anexos e Quadros (Upload de Arquivos)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Por favor, anexe todos os documentos e quadros solicitados (Quadros 1 a 10, se aplicável).
        </p>
        
        {/* O Controller agora renderiza tanto o Input quanto o Uploader, garantindo que 'field' esteja definido */}
        <Controller
          name="anexos"
          control={control}
          render={({ field }) => (
            <div className="space-y-4">
              {/* 1. Input de Arquivo */}
              <FileInput
                id="todos-anexos"
                label="Selecionar Arquivos"
                multiple
                field={field}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              
              {/* 2. Botão de Upload (Componente Uploader) */}
              <AttachmentUploader 
                projectId={projectId} 
                userId={userId} 
                field={field} // Passa o field corretamente
                disabled={isSubmitting}
              />
            </div>
          )}
        />
        
        <p className="text-xs text-muted-foreground pt-2">
          *O upload dos arquivos é feito separadamente do envio do formulário. Certifique-se de enviar os anexos antes de finalizar a proposta.
        </p>
      </CardContent>
    </Card>
  );
};

export default ProjectAttachments;