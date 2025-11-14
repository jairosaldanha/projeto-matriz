import React, { useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Login: React.FC = () => {
  const { session, isLoading } = useSession();
  const navigate = useNavigate();

  // Redireciona se o usuário já estiver logado
  useEffect(() => {
    if (session) {
      navigate('/');
    }
  }, [session, navigate]);

  if (isLoading || session) {
    return null; // O SessionContextProvider já mostra um loader, ou estamos redirecionando
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Projeto Matriz</CardTitle>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            providers={[]} // Sem provedores de terceiros por padrão
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary-foreground))',
                  },
                },
              },
            }}
            theme="light"
            redirectTo={window.location.origin + '/'}
            view="sign_in"
            localization={{
              variables: {
                sign_in: {
                  link_text: 'Já tem uma conta? Faça login', // Mantém o texto de login
                },
                sign_up: {
                  link_text: '', // Remove o link de Sign Up
                },
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;