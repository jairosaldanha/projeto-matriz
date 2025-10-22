import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import React from "react";
import ProjectAttachments from "./ProjectAttachments";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";

// Nome do bucket de arquivos temporários
const ATTACHMENTS_BUCKET = "project-uploads";

// 1. Definindo o Schema Zod para o formulário
const projectSchema = z.object({
  // 1. INTRODUÇÃO
  contextualizacao: z.string().min(1, "Campo obrigatório"),
  objetivo_geral: z.string().min(1, "Campo obrigatório"),
  objetivos_especificos: z.string().min(1, "Campo obrigatório"),
  justificativa: z.string().min(1, "Campo obrigatório"),
  estagio_atual: z.string().min(1, "Campo obrigatório"),
  
  // 2. PLANO DO PROJETO
  fundamentacao_teorica: z.string().min(1, "Campo obrigatório"),
  metodologia: z.string().min(1, "Campo obrigatório"),
  descricao_atividades: z.string().min(1, "Campo obrigatório"),
  entregas_cronograma: z.string().min(1, "Campo obrigatório"),
  
  // 3. INFORMAÇÕES SOBRE A EMPRESA
  historico_empresa: z.string().min(1, "Campo obrigatório"),
  informacoes_administrativas: z.string().min(1, "Campo obrigatório"),
  informacoes_comerciais: z.string().min(1, "Campo obrigatório"),
  infraestrutura_pdi: z.string().min(1, "Campo obrigatório"),
  acervo_pi: z.string().optional(),
  patentes_terceiros: z.string().optional(),
  novos_produtos: z.string().min(1, "Campo obrigatório"),
  principais_competidores: z.string().min(1, "Campo obrigatório"),
  contrapartida_fundos: z.string().min(1, "Campo obrigatório"),
  
  // 4. DESCRIÇÃO DA EQUIPE
  responsavel_legal: z.string().min(1, "Campo obrigatório"),
  coordenador_tecnico: z.string().min(1, "Campo obrigatório"),
  equipe_trabalho: z.string().min(1, "Campo obrigatório"),
  
  // 5. POTENCIAL COMERCIAL
  potencial_comercial: z.string().min(1, "Campo obrigatório"),
  
  // 6. ORÇAMENTO
  proposta_orcamento: z.string().min(1, "Campo obrigatório"),
  justificativa_equipamentos: z.string().min(1, "Campo obrigatório"),
  justificativa_servicos: z.string().min(1, "Campo obrigatório"),
  
  // 7. REFERÊNCIAS
  referencias: z.string().min(1, "Campo obrigatório"),

  // Anexos (FileList ou null)
  anexos: z.instanceof(FileList).optional().nullable(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

// Helper component for a standard form field group
interface FormFieldProps {
  name: keyof ProjectFormData;
  label: string;
  placeholder: string;
  isTextArea?: boolean;
  control: any;
  error: string | undefined;
}

const FormField: React.FC<FormFieldProps> = ({ name, label, placeholder, isTextArea = true, control, error }) => (
  <div className="space-y-2">
    <Label htmlFor={name}>{label}</Label>
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        isTextArea ? (
          <Textarea 
            id={name} 
            placeholder={placeholder} 
            rows={4} 
            {...field} 
            value={field.value || ""}
          />
        ) : (
          <Input 
            id={name} 
            placeholder={placeholder} 
            {...field} 
            value={field.value || ""}
          />
        )
      )}
    />
    {error && <p className="text-sm text-destructive">{error}</p>}
  </div>
);

const ProjectForm = () => {
  const { control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      contextualizacao: "",
      objetivo_geral: "",
      objetivos_especificos: "",
      justificativa: "",
      estagio_atual: "",
      fundamentacao_teorica: "",
      metodologia: "",
      descricao_atividades: "",
      entregas_cronograma: "",
      historico_empresa: "",
      informacoes_administrativas: "",
      informacoes_comerciais: "",
      infraestrutura_pdi: "",
      acervo_pi: "",
      patentes_terceiros: "",
      novos_produtos: "",
      principais_competidores: "",
      contrapartida_fundos: "",
      responsavel_legal: "",
      coordenador_tecnico: "",
      equipe_trabalho: "",
      potencial_comercial: "",
      proposta_orcamento: "",
      justificativa_equipamentos: "",
      justificativa_servicos: "",
      referencias: "",
      anexos: null,
    }
  });

  const uploadFiles = async (projectId: string, userId: string, files: FileList) => {
    const attachmentRecords = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExtension = file.name.split('.').pop();
      const storagePath = `${userId}/${projectId}/${Date.now()}-${file.name}`;

      // 1. Upload para o Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(ATTACHMENTS_BUCKET)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Falha no upload do arquivo ${file.name}: ${uploadError.message}`);
      }

      // 2. Preparar registro para o banco de dados
      attachmentRecords.push({
        project_id: projectId,
        user_id: userId,
        file_name: file.name,
        storage_path: uploadData.path,
        mime_type: file.type,
        size_bytes: file.size,
      });
    }

    // 3. Inserir metadados no banco de dados
    if (attachmentRecords.length > 0) {
      const { error: metadataError } = await supabase
        .from('project_attachments')
        .insert(attachmentRecords);

      if (metadataError) {
        throw new Error(`Falha ao salvar metadados dos anexos: ${metadataError.message}`);
      }
    }
  };

  const onSubmit = async (data: ProjectFormData) => {
    const toastId = showLoading("Enviando proposta...");
    
    const { anexos, ...projectData } = data;

    try {
      // 0. Verificar autenticação
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        dismissToast(toastId);
        showError("Você precisa estar logado para enviar uma proposta.");
        return;
      }
      const userId = user.id;

      // 1. Inserir dados do projeto (incluindo user_id)
      const projectToInsert = { ...projectData, user_id: userId };
      
      const { data: insertedProject, error: dbError } = await supabase
        .from('projects')
        .insert([projectToInsert])
        .select('id')
        .single();

      if (dbError || !insertedProject) {
        throw new Error(dbError?.message || "Falha ao obter ID do projeto inserido.");
      }
      
      const projectId = insertedProject.id;

      // 2. Upload de arquivos, se existirem
      if (anexos && anexos.length > 0) {
        await uploadFiles(projectId, userId, anexos);
      }
      
      dismissToast(toastId);
      showSuccess("Proposta e anexos enviados com sucesso!");
      reset(); // Limpa o formulário após o sucesso

    } catch (error) {
      console.error("Erro ao submeter projeto:", error);
      dismissToast(toastId);
      showError(`Falha ao enviar a proposta: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Formulário de Proposta de Projeto de PD&I</h1>
      
      {/* Seção de Anexos no topo */}
      <div className="mb-8">
        <ProjectAttachments control={control} error={errors.anexos?.message} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* 1. INTRODUÇÃO */}
        <Card>
          <CardHeader>
            <CardTitle>1. INTRODUÇÃO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              name="contextualizacao"
              label="1.1. Contextualização e benefícios pretendidos"
              placeholder="Descreva o contexto e os benefícios esperados do projeto."
              control={control}
              error={errors.contextualizacao?.message}
            />
            
            <div className="space-y-4">
              <Label className="text-base font-semibold block">1.2. Objetivos</Label>
              <FormField
                name="objetivo_geral"
                label="1.2.1. Objetivo geral"
                placeholder="Defina o objetivo geral do projeto."
                control={control}
                error={errors.objetivo_geral?.message}
              />
              <FormField
                name="objetivos_especificos"
                label="1.2.2. Objetivos específicos"
                placeholder="Liste os objetivos específicos do projeto."
                control={control}
                error={errors.objetivos_especificos?.message}
              />
            </div>

            <FormField
              name="justificativa"
              label="1.3. Justificativa"
              placeholder="Apresente a justificativa para a realização deste projeto."
              control={control}
              error={errors.justificativa?.message}
            />
            <FormField
              name="estagio_atual"
              label="1.4. Estágio atual de desenvolvimento do produto e/ou processo inovador objeto do projeto"
              placeholder="Descreva o estágio atual de desenvolvimento (ex: TRL)."
              control={control}
              error={errors.estagio_atual?.message}
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
              name="fundamentacao_teorica"
              label="2.1. Fundamentação teórica"
              placeholder="Apresente a fundamentação teórica que suporta o projeto."
              control={control}
              error={errors.fundamentacao_teorica?.message}
            />
            <FormField
              name="metodologia"
              label="2.2. Metodologia"
              placeholder="Descreva a metodologia a ser empregada."
              control={control}
              error={errors.metodologia?.message}
            />
            <FormField
              name="descricao_atividades"
              label="2.3. Descrição das atividades que compõem o projeto"
              placeholder="Descreva as atividades."
              control={control}
              error={errors.descricao_atividades?.message}
            />
            <FormField
              name="entregas_cronograma"
              label="2.4. Entregas previstas e cronograma físico"
              placeholder="Descreva as entregas e o cronograma físico."
              control={control}
              error={errors.entregas_cronograma?.message}
            />
          </CardContent>
        </Card>

        {/* 3. INFORMAÇÕES SOBRE A EMPRESA */}
        <Card>
          <CardHeader>
            <CardTitle>3. INFORMAÇÕES SOBRE A EMPRESA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              name="historico_empresa"
              label="3.1. Histórico da empresa"
              placeholder="Descreva o histórico da empresa."
              control={control}
              error={errors.historico_empresa?.message}
            />
            <FormField
              name="informacoes_administrativas"
              label="3.2. Informações administrativas e de estrutura"
              placeholder="Detalhe a estrutura administrativa e organizacional."
              control={control}
              error={errors.informacoes_administrativas?.message}
            />
            <FormField
              name="informacoes_comerciais"
              label="3.3. Informações comerciais"
              placeholder="Descreva as informações comerciais."
              control={control}
              error={errors.informacoes_comerciais?.message}
            />
            <FormField
              name="infraestrutura_pdi"
              label="3.4. Informações sobre infraestrutura e atividades em PD&I"
              placeholder="Descreva a infraestrutura disponível e as atividades de PD&I realizadas."
              control={control}
              error={errors.infraestrutura_pdi?.message}
            />
            <FormField
              name="acervo_pi"
              label="3.5. Acervo de propriedade intelectual e transferência de tecnologia da empresa (se houver)"
              placeholder="Descreva o acervo de PI."
              control={control}
              error={errors.acervo_pi?.message}
            />
            <FormField
              name="patentes_terceiros"
              label="3.6. Patentes / ativos de PI de terceiros relacionados ao projeto (se houver)"
              placeholder="Liste patentes ou ativos de terceiros relevantes."
              control={control}
              error={errors.patentes_terceiros?.message}
            />
            <FormField
              name="novos_produtos"
              label="3.7. Novos produtos/processos pretendidos pela empresa"
              placeholder="Descreva os novos produtos/processos."
              control={control}
              error={errors.novos_produtos?.message}
            />
            <FormField
              name="principais_competidores"
              label="3.8. Principais competidores nacionais e internacionais"
              placeholder="Liste e descreva os principais competidores."
              control={control}
              error={errors.principais_competidores?.message}
            />
            <FormField
              name="contrapartida_fundos"
              label="3.9. Contrapartida e busca de outros fundos"
              placeholder="Descreva a contrapartida e a busca por outros fundos."
              control={control}
              error={errors.contrapartida_fundos?.message}
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
              name="responsavel_legal"
              label="4.1. Responsável legal"
              placeholder="Nome e informações do responsável legal."
              isTextArea={false}
              control={control}
              error={errors.responsavel_legal?.message}
            />
            <FormField
              name="coordenador_tecnico"
              label="4.2. Coordenador(a) técnico(a)"
              placeholder="Nome e informações do coordenador técnico."
              isTextArea={false}
              control={control}
              error={errors.coordenador_tecnico?.message}
            />
            <FormField
              name="equipe_trabalho"
              label="4.3. Equipe de trabalho"
              placeholder="Descreva a equipe de trabalho."
              control={control}
              error={errors.equipe_trabalho?.message}
            />
          </CardContent>
        </Card>

        {/* 5. POTENCIAL COMERCIAL */}
        <Card>
          <CardHeader>
            <CardTitle>5. POTENCIAL COMERCIAL DO PRODUTO OU PROCESSO QUE RESULTARÁ DESTE PROJETO DE PD&I</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              name="potencial_comercial"
              label="Descrição do Potencial Comercial"
              placeholder="Detalhe o potencial de mercado, público-alvo e estratégia de comercialização."
              control={control}
              error={errors.potencial_comercial?.message}
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
              name="proposta_orcamento"
              label="Quadro 10 – Proposta de orçamento do projeto"
              placeholder="Descreva a proposta de orçamento. (Em um formulário real, isso seria uma tabela, mas aqui usamos um campo de texto para a descrição geral.)"
              control={control}
              error={errors.proposta_orcamento?.message}
            />
            <Separator />
            <Label className="text-base font-semibold block">Justificativas de:</Label>
            <FormField
              name="justificativa_equipamentos"
              label="1. Equipamentos e materiais permanentes"
              placeholder="Justifique a necessidade de equipamentos e materiais permanentes."
              control={control}
              error={errors.justificativa_equipamentos?.message}
            />
            <FormField
              name="justificativa_servicos"
              label="2. Serviços de terceiros (incluindo consultorias)"
              placeholder="Justifique a necessidade de serviços de terceiros e consultorias."
              control={control}
              error={errors.justificativa_servicos?.message}
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
              name="referencias"
              label="Referências Bibliográficas"
              placeholder="Liste todas as referências utilizadas no projeto."
              control={control}
              error={errors.referencias?.message}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Enviar Proposta"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;