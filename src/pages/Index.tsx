import ProjectForm from "@/components/ProjectForm";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ProjectForm />
      <MadeWithDyad />
    </div>
  );
};

export default Index;