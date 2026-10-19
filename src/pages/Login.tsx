import { Link } from "react-router-dom";
import { LogIn, Wallet } from "lucide-react";
import { buttonClassName, Card } from "../components/ui";

export default function Login() {
  return (
    <div className="auth-shell">
      <Link to="/" className="brand" aria-label="Mi Dinero, inicio">
        <span className="brand__mark" aria-hidden="true">
          <Wallet size={22} />
        </span>
        <span className="brand__text">
          <span className="brand__name">Mi Dinero</span>
          <span className="brand__tagline">Finanzas personales</span>
        </span>
      </Link>

      <Card className="auth-card" title="Iniciar sesión">
        <div className="auth-card__body">
          <span className="auth-card__icon" aria-hidden="true">
            <LogIn size={24} />
          </span>
          <p>
            La autenticación con cookies seguras se habilitará en el hito W2.
            Esta pantalla ya forma parte de la base visual de la aplicación.
          </p>
          <Link to="/" className={buttonClassName({ variant: "secondary", block: true })}>
            Volver al inicio
          </Link>
          {import.meta.env.DEV && (
            <Link
              to="/demo"
              className={buttonClassName({ variant: "ghost", block: true })}
            >
              Ver la interfaz base
            </Link>
          )}
        </div>
      </Card>
    </div>
  );
}
