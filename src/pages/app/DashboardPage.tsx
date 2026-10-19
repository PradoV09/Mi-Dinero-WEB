import { Wallet } from "lucide-react";
import { Card, EmptyState } from "../../components/ui";

export default function DashboardPage() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Resumen</p>
          <h1>Tu dinero, por moneda</h1>
          <p className="page-header__lead">
            Aquí verás tus saldos, ingresos, gastos y movimientos recientes,
            siempre separados por moneda.
          </p>
        </div>
      </header>

      <Card>
        <EmptyState
          icon={<Wallet size={28} />}
          title="Aún no hay datos para mostrar"
          description="Cuando registres tus primeras cuentas y movimientos, este resumen se llenará con información real."
        />
      </Card>

      <p className="disclaimer">
        Los datos que verás en Mi Dinero son registrados por ti. No son saldos
        bancarios reales ni información obtenida de tu banco.
      </p>
    </div>
  );
}
