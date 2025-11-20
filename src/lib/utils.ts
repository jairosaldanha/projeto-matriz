import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitiza o nome de um arquivo, removendo acentos e substituindo caracteres especiais por underscores,
 * para garantir compatibilidade com o Supabase Storage.
 * @param fileName O nome original do arquivo.
 * @returns O nome do arquivo sanitizado.
 */
export function sanitizeFileName(fileName: string): string {
  // 1. Remove acentos (Normalization Form D e remove marcas combinatórias)
  let sanitized = fileName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // 2. Substitui espaços e caracteres especiais (exceto letras, números, ponto e hífen) por underscore
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // 3. Garante que não há múltiplos underscores seguidos
  sanitized = sanitized.replace(/_+/g, '_');
  
  // 4. Remove underscores iniciais/finais
  sanitized = sanitized.replace(/^_|_$/g, '');
  
  return sanitized;
}