import { Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/routing/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import Demo from "./pages/Demo";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import DashboardPage from "./pages/app/DashboardPage";
import TransactionsPage from "./pages/app/TransactionsPage";
import UpcomingPage from "./pages/app/UpcomingPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      {import.meta.env.DEV && <Route path="/demo" element={<Demo />} />}

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/app" element={<DashboardPage />} />
          <Route
            path="/app/cuentas"
            element={
              <UpcomingPage
                title="Cuentas"
                milestone="W3"
                description="Aquí podrás crear, editar y archivar tus cuentas en COP, USD y EUR."
              />
            }
          />
          <Route path="/app/movimientos" element={<TransactionsPage />} />
          <Route
            path="/app/transferencias"
            element={
              <UpcomingPage
                title="Transferencias"
                milestone="W6"
                description="Aquí podrás mover dinero entre tus propias cuentas de la misma moneda."
              />
            }
          />
          <Route
            path="/app/perfil"
            element={
              <UpcomingPage
                title="Perfil"
                milestone="W7"
                description="Aquí podrás configurar tus datos personales y preferencias de la cuenta."
              />
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
