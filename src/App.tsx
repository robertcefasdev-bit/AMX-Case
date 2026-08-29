import { useEffect, useState } from "react";
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
import { DataProvider, useStore } from "./data/store";
import { ThemeProvider } from "./context/ThemeContext";

type Page = "dashboard" | "vendedor-dashboard" | "estoque" | "cadastro-produto" | "produtos-repor" | "pouca-rotatividade" | "registrar-venda" | "historico-vendas" | "vendedores" | "vendas-vendedor" | "financeiro" | "caixa" | "relatorios";
interface Session { userId: string; role: "admin" | "vendedor"; }

const SESSION_KEY = "amxcase.session.v1";

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.userId === "string" && (parsed.role === "admin" || parsed.role === "vendedor")) return parsed;
    return null;
  } catch {
    return null;
  }
}

function saveSession(session: Session | null) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* localStorage indisponível (ex.: navegação anônima) — a sessão simplesmente não persiste */
  }
}

function AppContent() {
  const { users } = useStore();
  const [session, setSession] = useState<Session | null>(loadSession);
  const [page, setPage] = useState<Page>("dashboard");

  // Se o usuário da sessão salva foi removido ou inativado enquanto estava
  // logado (em outra aba, por exemplo), desloga automaticamente.
  useEffect(() => {
    if (!session) return;
    const stillValid = users.some(u => u.id === session.userId && u.status === "Ativo");
    if (!stillValid) {
      setSession(null);
      saveSession(null);
    }
  }, [users, session]);

  function login(userId: string, role: "admin" | "vendedor") {
    const next: Session = { userId, role };
    setSession(next);
    saveSession(next);
    setPage(role === "admin" ? "dashboard" : "vendedor-dashboard");
  }

  function logout() {
    setSession(null);
    saveSession(null);
    setPage("dashboard");
  }

  const navigate = (p: Page) => setPage(p);
  if (!session) return <Login onLogin={login} />;
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
  return <Layout page={page} userId={userId} role={role} onNavigate={navigate} onLogout={logout}>{renderPage()}</Layout>;
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
