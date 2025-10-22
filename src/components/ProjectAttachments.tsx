import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FileInput from "./FileInput";

const ProjectAttachments: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Anexos e Quadros (Upload de Arquivos)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Por favor, anexe todos os documentos e quadros solicitados (Quadros 1 a 10, se aplicável). Você pode selecionar múltiplos arquivos de uma vez.
        </p>
        
        <FileInput
          id="todos-anexos"
          label="Anexar todos os Quadros e Documentos"
          multiple
        />
      </CardContent>
    </Card>
  );
};

export default ProjectAttachments;