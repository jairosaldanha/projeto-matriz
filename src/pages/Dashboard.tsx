import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/components/SessionContextProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Project {
  id: string;
  created_at: string;
  project_name: string | null;
  contextualizacao: string | null;
}

const Dashboard: React.FC = () => {
  const { session, isLoading: isSessionLoading } = useSession();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // 0. Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!isSessionLoading && !session) {
      navigate('/login');
    }
  }, [isSessionLoading, session, navigate]);

  // Função para carregar projetos
  const fetchProjects = useCallback(async () => {
    if (!session?.user?.id) return;

    setIsLoadingProjects(true);
    const { data, error } = await supabase
      .from('projects')
      .select('id, created_at, project_name, contextualizacao')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching projects:", error);
      showError("Falha ao carregar seus projetos.");
    } else {
      setProjects(data || []);
    }
    setIsLoadingProjects(false);
  }, [session]);

  // 1. Carregar projetos do usuário
  useEffect(() => {
    if (session) {
      fetchProjects();
    }
  }, [session, fetchProjects]);
  
  const handleNewProject = () => {
    navigate('/projects/new');
  };
  
  const handleEditProject = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };
  
  const handleDeleteProject = async (projectId: string) => {
    if (!session?.user?.id) {
      showError("Usuário não autenticado.");
      return;
    }
    
    setIsDeleting(true);
    const toastId = showLoading("Excluindo projeto e arquivos...");

    try {
      // 1. Chamar a Edge Function para exclusão em cascata
      const { error: edgeError } = await supabase.functions.invoke('delete-project', {
        body: { project_id: projectId, user_id: session.user.id },
      });

      if (edgeError) {
        throw new Error(edgeError.message);
      }

      // 2. Atualizar a lista de projetos na UI
      setProjects(prev => prev.filter(p => p.id !== projectId));

      dismissToast(toastId);
      showSuccess("Projeto excluído com sucesso!");

    } catch (error) {
      console.error("Erro ao deletar projeto:", error);
      dismissToast(toastId);
      showError(`Falha ao excluir projeto: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isSessionLoading || !session) {
    return null;
  }
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Meus Projetos de PD&I</h1>
        <Button onClick={handleNewProject}>
          <Plus className="mr-2 h-4 w-4" />
          Criar Novo Projeto
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Projetos Existentes</CardTitle>
          <CardDescription>Clique em um projeto para continuar editando ou visualize.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingProjects ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Carregando projetos...
            </div>
          ) : projects.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Você ainda não tem projetos. Clique em "Criar Novo Projeto" para começar.
            </p>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div 
                  key={project.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div 
                    className="flex items-center min-w-0 flex-grow cursor-pointer"
                    onClick={() => handleEditProject(project.id)}
                  >
                    <FileText className="h-5 w-5 mr-4 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {/* Exibe o nome do projeto, ou a contextualização truncada como fallback */}
                        {project.project_name || (project.contextualizacao ? project.contextualizacao.substring(0, 80) + '...' : `Projeto sem título (${project.id.substring(0, 8)})`)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Criado em: {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditProject(project.id)}
                      disabled={isDeleting}
                    >
                      Editar
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          className="h-8 w-8"
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o projeto 
                            <span className="font-bold mx-1">"{project.project_name || project.id.substring(0, 8)}"</span> 
                            e todos os seus anexos associados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteProject(project.id)}
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={isDeleting}
                          >
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Excluir Projeto"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;