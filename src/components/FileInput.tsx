import React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ControllerRenderProps, FieldValues } from "react-hook-form";

interface FileInputProps {
  id: string;
  label: string;
  multiple?: boolean;
  className?: string;
  field: ControllerRenderProps<FieldValues, any>;
}

const FileInput: React.FC<FileInputProps> = ({ id, label, multiple = false, className, field }) => {
  // O campo de arquivo precisa de um tratamento especial para o RHF, 
  // pois o valor é lido através de e.target.files e não e.target.value
  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    field.onChange(e.target.files);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        type="file"
        multiple={multiple}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        onChange={onChangeHandler}
        onBlur={field.onBlur}
        name={field.name}
        ref={field.ref}
      />
    </div>
  );
};

export default FileInput;