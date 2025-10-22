import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FileInput from "./FileInput";

const ProjectAttachments: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Anexos e Quadros (Upload de Arquivos)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Por favor, anexe os documentos e quadros solicitados abaixo.
        </p>
        
        {/* 2. PLANO DO PROJETO */}
        <FileInput
          id="quadro1-2"
          label="Quadros 1 e 2 (Visão geral das etapas e Cronograma de execução)"
          multiple
        />
        <FileInput
          id="quadro3"
          label="Quadro 3 (Cronograma físico associado às entregas)"
        />

        {/* 3. INFORMAÇÕES SOBRE A EMPRESA */}
        <FileInput
          id="quadro4"
          label="Quadro 4 (Participação da empresa em editais / programas de inovação)"
        />
        <FileInput
          id="quadro5"
          label="Quadro 5 (Produtos e serviços atuais da empresa)"
        />
        <FileInput
          id="quadro6"
          label="Quadro 6 (Acervo de propriedade intelectual da empresa)"
        />
        <FileInput
          id="quadro7"
          label="Quadro 7 (Novos produtos pretendidos como fonte de geração de receitas)"
        />
        <FileInput
          id="quadro8"
          label="Quadro 8 (Matriz com atributos & benefícios das soluções concorrentes)"
        />

        {/* 4. DESCRIÇÃO DA EQUIPE */}
        <FileInput
          id="quadro9"
          label="Quadro 9 (Resumo da equipe de trabalho)"
        />

        {/* 6. ORÇAMENTO */}
        <FileInput
          id="quadro10"
          label="Quadro 10 (Proposta de orçamento detalhada)"
        />
      </CardContent>
    </Card>
  );
};

export default ProjectAttachments;