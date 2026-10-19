import { Link } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import DashboardPage from "./app/DashboardPage";

export default function Demo() {
  return (
    <AppLayout>
      <div className="preview-banner" role="note">
        <span>
          Vista previa de la interfaz base (solo desarrollo). La autenticación
          y los datos reales llegan en los siguientes hitos.
        </span>
        <Link to="/">Volver al inicio</Link>
      </div>
      <DashboardPage />
    </AppLayout>
  );
}
