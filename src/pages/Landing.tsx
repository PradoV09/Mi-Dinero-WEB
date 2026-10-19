import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  ReceiptText,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { getHealth } from "../services/health";
import { buttonClassName, Card, ErrorState, Skeleton } from "../components/ui";

type HealthState =
  | { status: "loading" }
  | { status: "ok" }
  | { status: "error"; message: string };

const FEATURES = [
  {
    icon: Wallet,
    title: "Cuentas por moneda",
    description:
      "Organiza tus cuentas en COP, USD y EUR con saldos separados y claros.",
  },
  {
    icon: ReceiptText,
    title: "Movimientos",
    description:
      "Registra ingresos y gastos, filtra por fecha, cuenta, categoría y tipo.",
  },
  {
    icon: ArrowLeftRight,
    title: "Transferencias",
    description:
      "Mueve dinero entre tus propias cuentas sin perder el historial.",
  },
];

export default function Landing() {
  const [health, setHealth] = useState<HealthState>({ status: "loading" });

  const checkHealth = useCallback(() => {
    setHealth({ status: "loading" });

    getHealth()
      .then((response) => {
        setHealth(
          response.status === "ok"
            ? { status: "ok" }
            : {
                status: "error",
                message: "La API respondió con un estado inesperado.",
              },
        );
      })
      .catch((error: unknown) => {
        setHealth({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "No fue posible contactar la API.",
        });
      });
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return (
    <div className="public-shell">
      <header className="public-header">
        <Link to="/" className="brand" aria-label="Mi Dinero, inicio">
          <span className="brand__mark" aria-hidden="true">
            <Wallet size={22} />
          </span>
          <span className="brand__text">
            <span className="brand__name">Mi Dinero</span>
            <span className="brand__tagline">Finanzas personales</span>
          </span>
        </Link>
        <Link
          to="/login"
          className={buttonClassName({ variant: "secondary", size: "sm" })}
        >
          Iniciar sesión
        </Link>
      </header>

      <main className="public-main">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__copy">
            <p className="eyebrow">Tus finanzas, sin ruido</p>
            <h1 className="hero__title" id="hero-title">
              Tu dinero claro, por fin.
            </h1>
            <p className="hero__lead">
              Registra tus cuentas y movimientos, entiende en qué se va tu
              dinero y mantén cada moneda en orden. Sin conectar tu banco y sin
              compartir tus credenciales.
            </p>
            <div className="hero__actions">
              <Link
                to="/login"
                className={buttonClassName({ size: "lg" })}
              >
                Comenzar
                <ArrowRight aria-hidden="true" size={18} />
              </Link>
              <Link
                to="/app"
                className={buttonClassName({ variant: "ghost", size: "lg" })}
              >
                Ir a mi resumen
              </Link>
            </div>
            <p className="hero__note">
              <ShieldCheck aria-hidden="true" size={16} />
              Tus datos son registrados por ti. No leemos saldos bancarios.
            </p>
          </div>

          <Card className="health-card" title="Estado del servicio">
            {health.status === "loading" && (
              <div className="health-card__loading" role="status">
                <Skeleton width="60%" height={16} />
                <Skeleton width="85%" height={12} />
                <Skeleton width="40%" height={12} />
                <span className="sr-only">Comprobando conexión con la API…</span>
              </div>
            )}

            {health.status === "ok" && (
              <div className="health-card__ok" role="status">
                <span className="health-card__icon" aria-hidden="true">
                  <CheckCircle2 size={24} />
                </span>
                <div>
                  <p className="health-card__title">API conectada</p>
                  <p className="health-card__description">
                    El frontend puede comunicarse con el servidor.
                  </p>
                </div>
              </div>
            )}

            {health.status === "error" && (
              <>
                <ErrorState
                  title="Sin conexión con la API"
                  description="No pudimos contactar la API. Verifica que esté disponible en VITE_API_URL."
                  onRetry={checkHealth}
                />
                <p className="health-card__detail">{health.message}</p>
              </>
            )}
          </Card>
        </section>

        <section className="features" aria-labelledby="features-title">
          <div className="section-heading">
            <p className="eyebrow">Lo esencial</p>
            <h2 id="features-title">Una app para entender tu dinero</h2>
          </div>
          <div className="feature-grid">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;

              return (
                <Card key={feature.title} className="feature-card">
                  <div className="feature-card__icon" aria-hidden="true">
                    <Icon size={22} />
                  </div>
                  <h3 className="feature-card__title">{feature.title}</h3>
                  <p className="feature-card__description">
                    {feature.description}
                  </p>
                  <span className="badge">Próximamente</span>
                </Card>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="public-footer">
        <p>
          Mi Dinero es una app personal de registro financiero. Los saldos que
          verás son datos ingresados por ti, no saldos bancarios reales.
        </p>
      </footer>
    </div>
  );
}
