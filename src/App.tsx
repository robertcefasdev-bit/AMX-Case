import { useState } from "react";
import Login from "./components/Login";
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
import { DataProvider } from "./data/store";

type Page = "dashboard" | "vendedor-dashboard" | "estoque" | "cadastro-produto" | "produtos-repor" | "pouca-rotatividade" | "registrar-venda" | "historico-vendas" | "vendedores" | "vendas-vendedor" | "financeiro" | "caixa" | "relatorios";
interface Session { userId: string; role: "admin" | "vendedor"; }

function AppContent() {
  const [session, setSession] = useState<Session | null>(null);
  const [page, setPage] = useState<Page>("dashboard");
  const navigate = (p: Page) => setPage(p);
  if (!session) return <Login onLogin={(userId, role) => { setSession({ userId, role }); setPage(role === "admin" ? "dashboard" : "vendedor-dashboard"); }} />;
  const { userId, role } = session;
  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard onNavigate={navigate} />;
      case "vendedor-dashboard": return <VendedorDashboard userId={userId} onNavigate={navigate} />;
      case "estoque": return <Estoque role={role} onNewProduct={role === "admin" ? () => navigate("cadastro-produto") : undefined} />;
      case "cadastro-produto": return role === "admin" ? <CadastroProduto onBack={() => navigate("estoque")} /> : null;
      case "produtos-repor": return role === "admin" ? <ProdutosRepor /> : null;
      case "pouca-rotatividade": return role === "admin" ? <PoucaRotatividade /> : null;
      case "registrar-venda": return <RegistrarVenda userId={userId} role={role} />;
      case "historico-vendas": return <HistoricoVendas userId={userId} role={role} />;
      case "vendedores": return role === "admin" ? <Vendedores /> : null;
      case "vendas-vendedor": return role === "admin" ? <VendasVendedor /> : null;
      case "financeiro": return role === "admin" ? <Financeiro /> : null;
      case "caixa": return role === "admin" ? <Caixa /> : null;
      case "relatorios": return role === "admin" ? <Relatorios onNavigate={navigate} /> : null;
    }
  };
  return <Layout page={page} userId={userId} role={role} onNavigate={navigate} onLogout={() => { setSession(null); setPage("dashboard"); }}>{renderPage()}</Layout>;
}

export default function App() { return <DataProvider><AppContent /></DataProvider>; }
