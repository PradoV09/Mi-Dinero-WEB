import { Clock3 } from "lucide-react";
import { Card, EmptyState } from "../../components/ui";

interface UpcomingPageProps {
  title: string;
  milestone: string;
  description: string;
}

export default function UpcomingPage({
  title,
  milestone,
  description,
}: UpcomingPageProps) {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Módulo</p>
          <h1>{title}</h1>
        </div>
      </header>

      <Card>
        <EmptyState
          icon={<Clock3 size={28} />}
          title={`Disponible en ${milestone}`}
          description={description}
        />
      </Card>
    </div>
  );
}
