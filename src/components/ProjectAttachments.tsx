import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FileInput from "./FileInput";
import { Control, Controller } from "react-hook-form";

interface ProjectAttachmentsProps {
  control: Control<any>;
  error: string | undefined;
}

const ProjectAttachments: React.FC<ProjectAttachmentsProps> = ({ control, error }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Anexos e Quadros (Upload de Arquivos)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Por favor, anexe todos os documentos e quadros solicitados (Quadros 1 a 10, se aplicável). Você pode selecionar múltiplos arquivos de uma vez.
        </p>
        
        <Controller
          name="anexos"
          control={control}
          render={({ field }) => (
            <FileInput
              id="todos-anexos"
              label="Anexar todos os Quadros e Documentos"
              multiple
              field={field}
            />
          )}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
};

export default ProjectAttachments;