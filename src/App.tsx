import { useEffect, useState } from "react";
import Login from "./components/Login";
import TrocarSenha from "./components/TrocarSenha";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import VendedorDashboard from "./pages/VendedorDashboard";
import Estoque from "./pages/Estoque";
import CadastroProduto from "./pages/CadastroProduto";
import ProdutosRepor from "./pages/ProdutosRepor";
import PoucaRotatividade from "./pages/PoucaRotatividade";
import RegistrarVenda from "./pages/RegistrarVenda";
import HistoricoVendas from "./pages/HistoricoVendas";
import Vendedores from "./pages/Vendedores";
import VendasVendedor from "./pages/VendasVendedor";
import Financeiro from "./pages/Financeiro";
import Caixa from "./pages/Caixa";
import Relatorios from "./pages/Relatorios";
import Promocoes from "./pages/Promocoes";
import { DataProvider, useStore } from "./data/store";
import { ThemeProvider } from "./context/ThemeContext";

type Page = "dashboard" | "vendedor-dashboard" | "estoque" | "cadastro-produto" | "produtos-repor" | "pouca-rotatividade" | "registrar-venda" | "historico-vendas" | "promocoes" | "vendedores" | "vendas-vendedor" | "financeiro" | "caixa" | "relatorios";

function Splash({ text, action }: { text: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0A0F1E", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "14px", padding: "24px", color: "#94A3B8", fontSize: "14px", textAlign: "center" }}>
      <div>{text}</div>
      {action && <button className="btn btn-primary" onClick={action.onClick}>{action.label}</button>}
    </div>
  );
}

function AppContent() {
  const { status, currentUser, dataStatus, dataError, refresh, logout } = useStore();
  const [page, setPage] = useState<Page>("dashboard");
  const userId = currentUser?.id;
  const role = currentUser?.role;

  // Ao entrar, abre a tela inicial do perfil.
  useEffect(() => {
    if (role) setPage(role === "admin" ? "dashboard" : "vendedor-dashboard");
  }, [userId, role]);

  if (status === "loading") return <Splash text="Carregando..." />;
  if (!currentUser || !userId || !role) return <Login />;
  if (currentUser.mustChangePassword) return <TrocarSenha />;
  if (dataStatus === "error") return <Splash text={dataError || "Não foi possível carregar os dados."} action={{ label: "Tentar de novo", onClick: refresh }} />;
  if (dataStatus !== "ready") return <Splash text="Carregando dados..." />;

  const navigate = (p: Page) => setPage(p);
  const renderPage = () => {
    switch (page) {
      case "dashboard": return role === "admin" ? <Dashboard onNavigate={navigate} /> : <VendedorDashboard userId={userId} onNavigate={navigate} />;
      case "vendedor-dashboard": return <VendedorDashboard userId={userId} onNavigate={navigate} />;
      case "estoque": return <Estoque role={role} onNewProduct={role === "admin" ? () => navigate("cadastro-produto") : undefined} />;
      case "cadastro-produto": return role === "admin" ? <CadastroProduto onBack={() => navigate("estoque")} /> : null;
      case "produtos-repor": return role === "admin" ? <ProdutosRepor /> : null;
      case "pouca-rotatividade": return role === "admin" ? <PoucaRotatividade /> : null;
      case "registrar-venda": return <RegistrarVenda userId={userId} role={role} />;
      case "historico-vendas": return <HistoricoVendas userId={userId} role={role} />;
      case "promocoes": return role === "admin" ? <Promocoes /> : null;
      case "vendedores": return role === "admin" ? <Vendedores /> : null;
      case "vendas-vendedor": return role === "admin" ? <VendasVendedor /> : null;
      case "financeiro": return role === "admin" ? <Financeiro /> : null;
      case "caixa": return role === "admin" ? <Caixa /> : null;
      case "relatorios": return role === "admin" ? <Relatorios onNavigate={navigate} /> : null;
    }
  };
  return <Layout page={page} userId={userId} role={role} onNavigate={navigate} onLogout={() => { logout(); setPage("dashboard"); }}>{renderPage()}</Layout>;
}

export default function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </ThemeProvider>
  );
}
