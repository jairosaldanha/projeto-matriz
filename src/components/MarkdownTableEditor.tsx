import React, { useState, useEffect, useCallback } from 'react';
import { ControllerRenderProps, FieldValues } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Define a estrutura básica da linha da tabela de orçamento
interface BudgetRow {
  id: number;
  item: string;
  descricao: string;
  valor: string;
}

// Colunas fixas para a tabela de orçamento
const COLUMNS = [
  { key: 'item', label: 'Item' },
  { key: 'descricao', label: 'Descrição' },
  { key: 'valor', label: 'Valor (R$)' },
];

interface MarkdownTableEditorProps {
  label: string;
  placeholder: string;
  field: ControllerRenderProps<FieldValues, any>;
  error: string | undefined;
  disabled: boolean;
}

// Funções de conversão
const markdownToRows = (markdown: string): BudgetRow[] => {
  if (!markdown) return [];
  
  const lines = markdown.trim().split('\n');
  if (lines.length < 2) return []; // Precisa de pelo menos cabeçalho e separador
  
  // Ignora cabeçalho e separador (linhas 0 e 1)
  const dataLines = lines.slice(2);
  
  return dataLines.map((line, index) => {
    // Remove barras laterais e espaços extras, depois divide por barras
    const values = line.replace(/^\||\|$/g, '').split('|').map(v => v.trim());
    
    // Garante que temos 3 colunas de dados
    const [item = '', descricao = '', valor = ''] = values;
    
    return {
      id: index + 1,
      item,
      descricao,
      valor,
    };
  });
};

const rowsToMarkdown = (rows: BudgetRow[]): string => {
  if (rows.length === 0) return '';
  
  const header = `| ${COLUMNS.map(c => c.label).join(' | ')} |`;
  const separator = `| ${COLUMNS.map(() => '---').join(' | ')} |`;
  
  const data = rows.map(row => 
    `| ${row.item} | ${row.descricao} | ${row.valor} |`
  ).join('\n');
  
  return `${header}\n${separator}\n${data}`;
};


const MarkdownTableEditor: React.FC<MarkdownTableEditorProps> = ({ label, field, error, disabled }) => {
  const [rows, setRows] = useState<BudgetRow[]>(() => markdownToRows(field.value || ''));
  
  // Sincroniza o estado interno com o valor do formulário (apenas na montagem/reset)
  useEffect(() => {
    setRows(markdownToRows(field.value || ''));
  }, [field.value]);

  // Função para atualizar o RHF sempre que as linhas mudarem
  const updateFormValue = useCallback((newRows: BudgetRow[]) => {
    const markdown = rowsToMarkdown(newRows);
    field.onChange(markdown);
    setRows(newRows);
  }, [field]);

  const handleAddRow = () => {
    const newRow: BudgetRow = {
      id: Date.now(), // ID temporário para React key
      item: '',
      descricao: '',
      valor: '',
    };
    updateFormValue([...rows, newRow]);
  };

  const handleRemoveRow = (id: number) => {
    const newRows = rows.filter(row => row.id !== id);
    updateFormValue(newRows);
  };

  const handleInputChange = (id: number, key: keyof Omit<BudgetRow, 'id'>, value: string) => {
    const newRows = rows.map(row => 
      row.id === id ? { ...row, [key]: value } : row
    );
    updateFormValue(newRows);
  };

  return (
    <div className={cn("space-y-2", disabled && "opacity-70 pointer-events-none")}>
      <Label htmlFor={field.name}>{label}</Label>
      
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map(col => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
              <TableHead className="w-[50px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                  Nenhum item de orçamento adicionado.
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="p-1">
                  <Input
                    value={row.item}
                    onChange={(e) => handleInputChange(row.id, 'item', e.target.value)}
                    placeholder="Ex: Mão de Obra"
                    className="h-8"
                    disabled={disabled}
                  />
                </TableCell>
                <TableCell className="p-1">
                  <Input
                    value={row.descricao}
                    onChange={(e) => handleInputChange(row.id, 'descricao', e.target.value)}
                    placeholder="Descrição detalhada"
                    className="h-8"
                    disabled={disabled}
                  />
                </TableCell>
                <TableCell className="p-1 w-[150px]">
                  <Input
                    value={row.valor}
                    onChange={(e) => handleInputChange(row.id, 'valor', e.target.value)}
                    placeholder="R$ 0,00"
                    className="h-8"
                    disabled={disabled}
                  />
                </TableCell>
                <TableCell className="p-1 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveRow(row.id)}
                    className="h-8 w-8 p-0"
                    disabled={disabled}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <Button type="button" variant="outline" size="sm" onClick={handleAddRow} disabled={disabled}>
        <Plus className="mr-2 h-4 w-4" />
        Adicionar Linha
      </Button>
      
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};

export default MarkdownTableEditor;