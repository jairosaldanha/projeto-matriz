import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';

interface AIEnhanceButtonProps {
  currentText: string;
  onEnhance: (enhancedText: string) => void;
  disabled: boolean;
}

const AIEnhanceButton: React.FC<AIEnhanceButtonProps> = ({ currentText, onEnhance, disabled }) => {
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleEnhance = useCallback(async () => {
    if (isEnhancing || disabled) return;
    
    if (!currentText || currentText.trim().length === 0) {
      showError("Por favor, insira algum texto antes de aprimorar.");
      return;
    }

    setIsEnhancing(true);
    const toastId = showLoading("Aprimorando texto com IA...");

    try {
      const { data, error } = await supabase.functions.invoke('ai-enhance-text', {
        body: { text: currentText },
      });

      if (error) {
        throw new Error(error.message);
      }
      
      const enhancedText = (data as { enhanced_text: string })?.enhanced_text;

      if (enhancedText) {
        onEnhance(enhancedText);
        showSuccess("Texto aprimorado com sucesso!");
      } else {
        throw new Error("Resposta da IA inválida.");
      }

    } catch (e) {
      console.error("Erro ao aprimorar texto:", e);
      showError(`Falha ao aprimorar texto: ${e instanceof Error ? e.message : "Erro desconhecido"}`);
    } finally {
      dismissToast(toastId);
      setIsEnhancing(false);
    }
  }, [currentText, onEnhance, disabled, isEnhancing]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleEnhance}
      disabled={isEnhancing || disabled}
      className="h-8 px-3 text-xs"
    >
      {isEnhancing ? (
        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
      ) : (
        <Sparkles className="mr-2 h-3 w-3" />
      )}
      {isEnhancing ? "Aprimorando..." : "Aprimorar com IA"}
    </Button>
  );
};

export default AIEnhanceButton;