import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import React from "react";
import ProjectAttachments from "./ProjectAttachments"; // Importando o novo componente

// Helper component for a standard form field group
interface FormFieldProps {
  id: string;
  label: string;
  placeholder: string;
  isTextArea?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({ id, label, placeholder, isTextArea = true }) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    {isTextArea ? (
      <Textarea id={id} placeholder={placeholder} rows={4} />
    ) : (
      <input id={id} placeholder={placeholder} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
    )}
  </div>
);

const ProjectForm = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Lógica de submissão do formulário
    console.log("Formulário submetido!");
    // Aqui você pode adicionar a lógica para coletar os dados dos campos
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Formulário de Proposta de Projeto de PD&I</h1>
      
      {/* Seção de Anexos no topo */}
      <div className="mb-8">
        <ProjectAttachments />
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* 1. INTRODUÇÃO */}
        <Card>
          <CardHeader>
            <CardTitle>1. INTRODUÇÃO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              id="contextualizacao"
              label="1.1. Contextualização e benefícios pretendidos"
              placeholder="Descreva o contexto e os benefícios esperados do projeto."
            />
            
            <div className="space-y-4">
              <Label className="text-base font-semibold block">1.2. Objetivos</Label>
              <FormField
                id="objetivo-geral"
                label="1.2.1. Objetivo geral"
                placeholder="Defina o objetivo geral do projeto."
              />
              <FormField
                id="objetivos-especificos"
                label="1.2.2. Objetivos específicos"
                placeholder="Liste os objetivos específicos do projeto."
              />
            </div>

            <FormField
              id="justificativa"
              label="1.3. Justificativa"
              placeholder="Apresente a justificativa para a realização deste projeto."
            />
            <FormField
              id="estagio-atual"
              label="1.4. Estágio atual de desenvolvimento do produto e/ou processo inovador objeto do projeto"
              placeholder="Descreva o estágio atual de desenvolvimento (ex: TRL)."
            />
          </CardContent>
        </Card>

        {/* 2. PLANO DO PROJETO */}
        <Card>
          <CardHeader>
            <CardTitle>2. PLANO DO PROJETO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              id="fundamentacao-teorica"
              label="2.1. Fundamentação teórica"
              placeholder="Apresente a fundamentação teórica que suporta o projeto."
            />
            <FormField
              id="metodologia"
              label="2.2. Metodologia"
              placeholder="Descreva a metodologia a ser empregada."
            />
            <FormField
              id="descricao-atividades"
              label="2.3. Descrição das atividades que compõem o projeto"
              placeholder="Descreva as atividades."
            />
            {/* Quadros 1 e 2 movidos para ProjectAttachments */}
            <FormField
              id="entregas-cronograma"
              label="2.4. Entregas previstas e cronograma físico"
              placeholder="Descreva as entregas e o cronograma físico."
            />
            {/* Quadro 3 movido para ProjectAttachments */}
          </CardContent>
        </Card>

        {/* 3. INFORMAÇÕES SOBRE A EMPRESA */}
        <Card>
          <CardHeader>
            <CardTitle>3. INFORMAÇÕES SOBRE A EMPRESA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              id="historico-empresa"
              label="3.1. Histórico da empresa"
              placeholder="Descreva o histórico da empresa."
            />
            {/* Quadro 4 movido para ProjectAttachments */}
            <FormField
              id="informacoes-administrativas"
              label="3.2. Informações administrativas e de estrutura"
              placeholder="Detalhe a estrutura administrativa e organizacional."
            />
            <FormField
              id="informacoes-comerciais"
              label="3.3. Informações comerciais"
              placeholder="Descreva as informações comerciais."
            />
            {/* Quadro 5 movido para ProjectAttachments */}
            <FormField
              id="infraestrutura-pdi"
              label="3.4. Informações sobre infraestrutura e atividades em PD&I"
              placeholder="Descreva a infraestrutura disponível e as atividades de PD&I realizadas."
            />
            <FormField
              id="acervo-pi"
              label="3.5. Acervo de propriedade intelectual e transferência de tecnologia da empresa (se houver)"
              placeholder="Descreva o acervo de PI."
            />
            {/* Quadro 6 movido para ProjectAttachments */}
            <FormField
              id="patentes-terceiros"
              label="3.6. Patentes / ativos de PI de terceiros relacionados ao projeto (se houver)"
              placeholder="Liste patentes ou ativos de terceiros relevantes."
            />
            <FormField
              id="novos-produtos"
              label="3.7. Novos produtos/processos pretendidos pela empresa"
              placeholder="Descreva os novos produtos/processos."
            />
            {/* Quadro 7 movido para ProjectAttachments */}
            <FormField
              id="principais-competidores"
              label="3.8. Principais competidores nacionais e internacionais"
              placeholder="Liste e descreva os principais competidores."
            />
            {/* Quadro 8 movido para ProjectAttachments */}
            <FormField
              id="contrapartida-fundos"
              label="3.9. Contrapartida e busca de outros fundos"
              placeholder="Descreva a contrapartida e a busca por outros fundos."
            />
          </CardContent>
        </Card>

        {/* 4. DESCRIÇÃO DA EQUIPE */}
        <Card>
          <CardHeader>
            <CardTitle>4. DESCRIÇÃO DA EQUIPE</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              id="responsavel-legal"
              label="4.1. Responsável legal"
              placeholder="Nome e informações do responsável legal."
              isTextArea={false}
            />
            <FormField
              id="coordenador-tecnico"
              label="4.2. Coordenador(a) técnico(a)"
              placeholder="Nome e informações do coordenador técnico."
              isTextArea={false}
            />
            <FormField
              id="equipe-trabalho"
              label="4.3. Equipe de trabalho"
              placeholder="Descreva a equipe de trabalho."
            />
            {/* Quadro 9 movido para ProjectAttachments */}
          </CardContent>
        </Card>

        {/* 5. POTENCIAL COMERCIAL */}
        <Card>
          <CardHeader>
            <CardTitle>5. POTENCIAL COMERCIAL DO PRODUTO OU PROCESSO QUE RESULTARÁ DESTE PROJETO DE PD&I</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              id="potencial-comercial"
              label="Descrição do Potencial Comercial"
              placeholder="Detalhe o potencial de mercado, público-alvo e estratégia de comercialização."
            />
          </CardContent>
        </Card>

        {/* 6. ORÇAMENTO */}
        <Card>
          <CardHeader>
            <CardTitle>6. ORÇAMENTO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              id="proposta-orcamento"
              label="Quadro 10 – Proposta de orçamento do projeto"
              placeholder="Descreva a proposta de orçamento. (Em um formulário real, isso seria uma tabela, mas aqui usamos um campo de texto para a descrição geral.)"
            />
            {/* Quadro 10 movido para ProjectAttachments */}
            <Separator />
            <Label className="text-base font-semibold block">Justificativas de:</Label>
            <FormField
              id="justificativa-equipamentos"
              label="1. Equipamentos e materiais permanentes"
              placeholder="Justifique a necessidade de equipamentos e materiais permanentes."
            />
            <FormField
              id="justificativa-servicos"
              label="2. Serviços de terceiros (incluindo consultorias)"
              placeholder="Justifique a necessidade de serviços de terceiros e consultorias."
            />
          </CardContent>
        </Card>

        {/* 7. REFERÊNCIAS */}
        <Card>
          <CardHeader>
            <CardTitle>7. REFERÊNCIAS</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              id="referencias"
              label="Referências Bibliográficas"
              placeholder="Liste todas as referências utilizadas no projeto."
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="w-full sm:w-auto">
            Enviar Proposta
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;