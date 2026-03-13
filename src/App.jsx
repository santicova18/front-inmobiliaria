import { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { Notification } from "./components/ui";
import { Sidebar } from "./components/layout/Sidebar";
import { LoginPage, RegisterPage, ForgotPasswordPage } from "./components/auth/AuthPages";
import { GestionLotes, CatalogoTipologias } from "./components/lotes/GestionLotes";
import { GestionPagos, RegistrarCompra, MisCuentas } from "./components/pagos/GestionPagos";
import { AdminPQRS, FormularioPQRS } from "./components/pqrs/PQRS";
import { InformacionProyecto } from "./components/proyecto/Proyecto";
import { AdminDashboard, ClienteDashboard } from "./components/layout/Dashboards";
import { GestionClientes } from "./components/layout/Clientes";

// Page titles map
const PAGE_TITLES = {
  dashboard: "Dashboard",
  lotes: "Gestión de Lotes",
  compras: "Compras",
  pagos: "Gestión de Pagos",
  pqrs: "PQRS",
  proyecto: "El Proyecto",
  clientes: "Clientes",
  "mis-lotes": "Mis Lotes",
  "mis-pagos": "Mis Pagos",
  "mis-pqrs": "Mis PQRS",
  tipologias: "Tipologías",
};

function AppContent() {
  const { state } = useApp();
  const [authPage, setAuthPage] = useState("login");
  const [activePage, setActivePage] = useState("dashboard");

  // Not authenticated
  if (!state.user) {
    if (authPage === "register") return <RegisterPage onNavigate={setAuthPage} />;
    if (authPage === "forgot") return <ForgotPasswordPage onNavigate={setAuthPage} />;
    return <LoginPage onNavigate={setAuthPage} />;
  }

  const isAdmin = state.role === "admin";

  const renderPage = () => {
    if (isAdmin) {
      switch (activePage) {
        case "dashboard": return <AdminDashboard onNavigate={setActivePage} />;
        case "lotes": return <GestionLotes />;
        case "tipologias": return <CatalogoTipologias />;
        case "compras": return <RegistrarCompra />;
        case "pagos": return <GestionPagos />;
        case "pqrs": return <AdminPQRS />;
        case "proyecto": return <InformacionProyecto />;
        case "clientes": return <GestionClientes />;
        default: return <AdminDashboard onNavigate={setActivePage} />;
      }
    } else {
      switch (activePage) {
        case "dashboard": return <ClienteDashboard onNavigate={setActivePage} />;
        case "mis-lotes": return <MisCuentas />;
        case "mis-pagos": return <MisCuentas />;
        case "mis-pqrs": return <FormularioPQRS />;
        case "proyecto": return <InformacionProyecto />;
        default: return <ClienteDashboard onNavigate={setActivePage} />;
      }
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="flex-1 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
      <Notification />
    </AppProvider>
  );
}
