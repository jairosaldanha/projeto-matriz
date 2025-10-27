import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import React, { useState, useEffect, useCallback } from "react";
import ProjectAttachments from "./ProjectAttachments";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Loader2 } from "lucide-react";
import { useSession } from "@/components/SessionContextProvider";
import { useNavigate, useParams } from "react-router-dom";

// 1. Definindo o Schema Zod para o formulário (usado apenas na submissão final)
const projectSchema = z.object({
  contextualizacao: z.string().min(1, "Campo obrigatório"),
  objetivo_geral: z.string().min(1, "Campo obrigatório"),
  objetivos_especificos: z.string().min(1, "Campo obrigatório"),
  justificativa: z.string().min(1, "Campo obrigatório"),
  estagio_atual: z.string().min(1, "Campo obrigatório"),
  
  fundamentacao_teorica: z.string().min(1, "Campo obrigatório"),
  metodologia: z.string().min(1, "Campo obrigatório"),
  descricao_atividades: z.string().min(1, "Campo obrigatório"),
  entregas_cronograma: z.string().min(1, "Campo obrigatório"),
  
  historico_empresa: z.string().min(1, "Campo obrigatório"),
  informacoes_administrativas: z.string().min(1, "Campo obrigatório"),
  informacoes_comerciais: z.string().min(1, "Campo obrigatório"),
  infraestrutura_pdi: z.string().min(1, "Campo obrigatório"),
  acervo_pi: z.string().optional(),
  patentes_terceiros: z.string().optional(),
  novos_produtos: z.string().min(1, "Campo obrigatório"),
  principais_competidores: z.string().min(1, "Campo obrigatório"),
  contrapartida_fundos: z.string().min(1, "Campo obrigatório"),
  
  responsavel_legal: z.string().min(1, "Campo obrigatório"),
  coordenador_tecnico: z.string().min(1, "Campo obrigatório"),
  equipe_trabalho: z.string().min(1, "Campo obrigatório"),
  
  potencial_comercial: z.string().min(1, "Campo obrigatório"),
  
  proposta_orcamento: z.string().min(1, "Campo obrigatório"),
  justificativa_equipamentos: z.string().min(1, "Campo obrigatório"),
  justificativa_servicos: z.string().min(1, "Campo obrigatório"),
  
  referencias: z.string().min(1, "Campo obrigatório"),

  // Anexos (FileList ou null) - Usado apenas para seleção temporária no FileInput
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
  const { session, isLoading: isSessionLoading } = useSession();
  const navigate = useNavigate();
  const { projectId: urlProjectId } = useParams<{ projectId: string }>(); // Captura o ID da URL
  
  const [projectId, setProjectId] = useState<string | null>(urlProjectId || null);
  const [isProjectLoading, setIsProjectLoading] = useState(!!urlProjectId);
  const userId = session?.user?.id || null;
  
  const { control, handleSubmit, formState: { errors, isSubmitting }, reset, getValues } = useForm<ProjectFormData>({
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
  
  // 0. Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!isSessionLoading && !session) {
      navigate('/login');
    }
  }, [isSessionLoading, session, navigate]);
  
  // 1. Carregar dados do projeto se houver um ID na URL
  useEffect(() => {
    const loadProject = async () => {
      if (!urlProjectId || !userId) return;
      
      setIsProjectLoading(true);
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', urlProjectId)
        .eq('user_id', userId)
        .single();
        
      if (error) {
        console.error("Erro ao carregar projeto:", error);
        showError("Falha ao carregar os dados do projeto. Verifique se você tem permissão.");
        navigate('/'); // Redireciona para o dashboard se falhar
        return;
      }
      
      // Remove campos que não devem ser resetados (como anexos)
      const { id, user_id, created_at, anexos, ...projectData } = data;
      
      // Preenche o formulário com os dados carregados
      reset(projectData as ProjectFormData);
      setProjectId(urlProjectId);
      setIsProjectLoading(false);
    };
    
    if (urlProjectId && userId) {
      loadProject();
    } else if (!urlProjectId) {
      // Se for um novo projeto, garante que o estado de carregamento esteja falso
      setIsProjectLoading(false);
    }
  }, [urlProjectId, userId, reset, navigate]);


  // Função centralizada para salvar/atualizar dados do projeto (usada por rascunho e submissão final)
  const saveProjectData = useCallback(async (data: Partial<ProjectFormData>): Promise<string> => {
    const { anexos, ...projectData } = data;
    
    if (!userId) {
      throw new Error("Usuário não autenticado.");
    }

    // Filtra campos vazios para não sobrescrever dados existentes com strings vazias,
    // mas mantém campos que foram explicitamente preenchidos (mesmo que com string vazia se for submissão final)
    // Para rascunho, filtramos apenas os campos que têm algum valor.
    const projectToInsert = Object.fromEntries(
      Object.entries(projectData).filter(([, value]) => value !== "" && value !== null && value !== undefined)
    );
    
    let insertedId = projectId;
    
    if (!projectId) {
      // Se for um novo projeto, garantimos que pelo menos o user_id seja inserido para obter um ID.
      const dataToInsert = Object.keys(projectToInsert).length > 0 
        ? { ...projectToInsert, user_id: userId }
        : { user_id: userId }; // Mínimo para criar o registro

      const { data: insertedProject, error: dbError } = await supabase
        .from('projects')
        .insert([dataToInsert])
        .select('id')
        .single();

      if (dbError || !insertedProject) {
        throw new Error(dbError?.message || "Falha ao iniciar novo projeto.");
      }
      insertedId = insertedProject.id;
      setProjectId(insertedId);
      
      // Redireciona para a URL de edição do projeto recém-criado
      // Usamos window.history.replaceState para mudar a URL sem recarregar o componente,
      // pois o navigate com replace: true pode causar problemas de estado no React Router.
      // No entanto, como estamos usando `useParams`, o `navigate` é a forma mais segura de garantir que o estado do componente seja atualizado.
      // Vamos manter o navigate, mas garantir que o ProjectAttachments lide com a remontagem.
      navigate(`/projects/${insertedId}`, { replace: true });
      
    } else if (Object.keys(projectToInsert).length > 0) {
      // Atualizar projeto existente, mas apenas se houver dados para atualizar
      const { error: dbError } = await supabase
        .from('projects')
        .update(projectToInsert)
        .eq('id', projectId);
        
      if (dbError) {
        throw new Error(dbError.message);
      }
    }
    
    if (!insertedId) {
      throw new Error("ID do projeto não definido após a operação de salvamento.");
    }
    
    return insertedId;
  }, [projectId, userId, navigate]);
  
  // Função para salvar rascunho (ignora validação Zod)
  const saveDraft = useCallback(async () => {
    const toastId = showLoading("Salvando rascunho...");
    try {
      const data = getValues(); // Pega todos os valores atuais do formulário
      const finalProjectId = await saveProjectData(data);
      
      dismissToast(toastId);
      showSuccess(`Rascunho salvo com sucesso! ID: ${finalProjectId}`);
      return finalProjectId;
    } catch (error) {
      console.error("Erro ao salvar rascunho:", error);
      dismissToast(toastId);
      // Lançamos o erro novamente para que o AttachmentUploader possa capturá-lo se necessário
      throw error; 
    }
  }, [getValues, saveProjectData]);
  
  // Função para chamar a Edge Function do Webhook
  const callWebhook = async (projectId: string, userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('submit-project-webhook', {
        body: { project_id: projectId, user_id: userId },
      });

      if (error) {
        console.error("Erro ao chamar Edge Function:", error);
        showError("Erro ao notificar o sistema de automação (n8n).");
        return false;
      }
      
      console.log("Edge Function response:", data);
      return true;
    } catch (e) {
      console.error("Erro inesperado ao chamar Edge Function:", e);
      showError("Erro inesperado ao notificar o sistema de automação.");
      return false;
    }
  };
  
  // Função de submissão final (usa validação Zod)
  const onSubmit = async (data: ProjectFormData) => {
    const action = projectId ? "Atualizando" : "Enviando";
    const toastId = showLoading(`${action} proposta...`);
    
    try {
      // 1. Salvar/Atualizar dados do projeto (com todos os campos validados)
      const finalProjectId = await saveProjectData(data);
      
      if (!finalProjectId || !userId) {
        throw new Error("Falha ao obter ID do projeto ou usuário.");
      }
      
      // 2. Verificar se há anexos pendentes no FileInput
      if (data.anexos && data.anexos.length > 0) {
        dismissToast(toastId);
        showError("Por favor, use o botão 'Enviar Arquivos' na seção de Anexos antes de finalizar a proposta.");
        return;
      }
      
      // 3. Chamar o Webhook (Edge Function)
      const webhookSuccess = await callWebhook(finalProjectId, userId);
      
      // 4. Confirmação final
      dismissToast(toastId);
      
      if (webhookSuccess) {
        showSuccess(`Proposta ${projectId ? 'atualizada' : 'enviada'} com sucesso! O fluxo de automação foi iniciado.`);
      } else {
        showSuccess(`Proposta ${projectId ? 'atualizada' : 'enviada'} com sucesso! (Houve um problema na notificação do n8n, verifique os logs.)`);
      }
      
      // Redireciona para o dashboard após o envio bem-sucedido
      navigate('/');

    } catch (error) {
      console.error("Erro ao submeter projeto:", error);
      dismissToast(toastId);
      showError(`Falha ao ${action.toLowerCase()} a proposta: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    }
  };
  
  if (isSessionLoading || !session) {
    return null;
  }
  
  if (isProjectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Carregando projeto...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {projectId ? "Editar Proposta de Projeto" : "Nova Proposta de Projeto de PD&I"}
        </h1>
        <Button variant="outline" onClick={() => navigate('/')}>
          Voltar para o Dashboard
        </Button>
      </div>
      
      {/* Mensagem de status do projeto */}
      {projectId && (
        <Alert className="mb-6 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <Terminal className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-600 dark:text-green-400">Projeto Salvo</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            O ID do seu projeto é: <span className="font-mono text-sm">{projectId}</span>.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Seção de Anexos no topo */}
      <div className="mb-8">
        <ProjectAttachments 
          control={control} 
          error={errors.anexos?.message} 
          projectId={projectId}
          userId={userId}
          isSubmitting={isSubmitting}
          onSaveDraft={saveDraft} // Passa a função de salvamento de rascunho
        />
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

        <div className="flex justify-end space-x-4">
          <Button 
            type="button" // Mudado para type="button" para não disparar o handleSubmit
            variant="secondary"
            onClick={async () => {
              try {
                await saveDraft();
              } catch (e) {
                // O saveDraft já trata o erro e mostra o toast
              }
            }}
            disabled={isSubmitting || !userId}
            className="w-full sm:w-auto"
          >
            Salvar Rascunho
          </Button>
          <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting || !userId}>
            {isSubmitting ? "Finalizando..." : "Finalizar Proposta"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;