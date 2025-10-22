import React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FileInputProps {
  id: string;
  label: string;
  multiple?: boolean;
  className?: string;
}

const FileInput: React.FC<FileInputProps> = ({ id, label, multiple = false, className }) => {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        type="file"
        multiple={multiple}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
};

export default FileInput;