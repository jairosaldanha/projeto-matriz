import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/components/SessionContextProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

interface Project {
  id: string;
  created_at: string;
  project_name: string | null; // Novo campo
  contextualizacao: string | null;
}

const Dashboard: React.FC = () => {
  const { session, isLoading: isSessionLoading } = useSession();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  // 0. Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!isSessionLoading && !session) {
      navigate('/login');
    }
  }, [isSessionLoading, session, navigate]);

  // 1. Carregar projetos do usuário
  useEffect(() => {
    const fetchProjects = async () => {
      if (!session?.user?.id) return;

      setIsLoadingProjects(true);
      const { data, error } = await supabase
        .from('projects')
        .select('id, created_at, project_name, contextualizacao') // Incluindo project_name
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching projects:", error);
        showError("Falha ao carregar seus projetos.");
      } else {
        setProjects(data || []);
      }
      setIsLoadingProjects(false);
    };

    if (session) {
      fetchProjects();
    }
  }, [session]);

  if (isSessionLoading || !session) {
    return null;
  }
  
  const handleNewProject = () => {
    navigate('/projects/new');
  };
  
  const handleEditProject = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

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
          <CardDescription>Clique em um projeto para continuar editando ou visualizar.</CardDescription>
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
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                  onClick={() => handleEditProject(project.id)}
                >
                  <div className="flex items-center min-w-0">
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
                  <Button variant="outline" size="sm" className="flex-shrink-0 ml-4">
                    Editar
                  </Button>
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