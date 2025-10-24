import Dashboard from "./Dashboard";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Dashboard />
      <MadeWithDyad />
    </div>
  );
};

export default Index;