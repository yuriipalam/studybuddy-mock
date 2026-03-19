import { FolderKanban } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { useNavigate } from "react-router-dom";

export default function ProjectsPage() {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">My Projects</h1>
      <EmptyState
        icon={<FolderKanban className="h-12 w-12" />}
        title="No Projects Yet"
        description="Start a project by applying for a topic or with an industry partner."
        actionLabel="Search Topics"
        onAction={() => navigate("/topics")}
      />
    </div>
  );
}
