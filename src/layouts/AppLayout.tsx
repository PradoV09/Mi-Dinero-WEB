import type { ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  ArrowLeftRight,
  LayoutDashboard,
  ReceiptText,
  UserRound,
  Wallet,
} from "lucide-react";
import { cn } from "../utils/classNames";

const NAV_ITEMS = [
  { to: "/app", label: "Resumen", icon: LayoutDashboard, end: true },
  { to: "/app/cuentas", label: "Cuentas", icon: Wallet },
  { to: "/app/movimientos", label: "Movimientos", icon: ReceiptText },
  { to: "/app/transferencias", label: "Transferencias", icon: ArrowLeftRight },
  { to: "/app/perfil", label: "Perfil", icon: UserRound },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <NavLink
      to="/app"
      className={cn("brand", compact && "brand--compact")}
      aria-label="Mi Dinero, ir al resumen"
    >
      <span className="brand__mark" aria-hidden="true">
        <Wallet size={22} />
      </span>
      <span className="brand__text">
        <span className="brand__name">Mi Dinero</span>
        <span className="brand__tagline">Finanzas personales</span>
      </span>
    </NavLink>
  );
}

function NavigationLinks({ mobile = false }: { mobile?: boolean }) {
  return (
    <>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                mobile ? "bottom-nav__link" : "sidebar__link",
                isActive && (mobile ? "bottom-nav__link--active" : "sidebar__link--active"),
              )
            }
          >
            <Icon aria-hidden="true" size={mobile ? 20 : 19} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </>
  );
}

export default function AppLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>

      <aside className="sidebar" aria-label="Barra lateral">
        <Brand />
        <nav className="sidebar__nav" aria-label="Navegación lateral">
          <NavigationLinks />
        </nav>
        <p className="sidebar__note">
          Los datos son registrados por ti. No representan saldos bancarios
          reales.
        </p>
      </aside>

      <div className="app-content">
        <header className="mobile-header">
          <Brand compact />
        </header>

        <main className="app-main" id="contenido">
          {children ?? <Outlet />}
        </main>
      </div>

      <nav className="bottom-nav" aria-label="Navegación inferior">
        <NavigationLinks mobile />
      </nav>
    </div>
  );
}
