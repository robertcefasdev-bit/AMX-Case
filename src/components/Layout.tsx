import { useEffect, useState } from "react";
import { useStore } from "../data/store";
import { useTheme } from "../context/ThemeContext";
import { LOGO_ICON } from "../assets/logoData";

type Page =
  | "dashboard" | "vendedor-dashboard"
  | "estoque" | "cadastro-produto" | "produtos-repor" | "pouca-rotatividade"
  | "registrar-venda" | "historico-vendas"
  | "vendedores" | "vendas-vendedor"
  | "financeiro" | "caixa" | "relatorios";

interface Props {
  page: Page;
  userId: string;
  role: "admin" | "vendedor";
  onNavigate: (p: Page) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const adminMenu = [
  { section: "Visão Geral" },
  { id: "dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { section: "Estoque" },
  { id: "estoque", label: "Estoque", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" },
  { id: "cadastro-produto", label: "Produtos", icon: "M12 4v16m8-8H4" },
  { id: "produtos-repor", label: "Produtos para Repor", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
  { id: "pouca-rotatividade", label: "Pouca Rotatividade", icon: "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" },
  { section: "Vendas" },
  { id: "registrar-venda", label: "Registrar Venda", icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" },
  { id: "historico-vendas", label: "Histórico de Vendas", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { section: "Pessoas" },
  { id: "vendedores", label: "Vendedores", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { id: "vendas-vendedor", label: "Vendas por Vendedor", icon: "M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { section: "Financeiro" },
  { id: "financeiro", label: "Financeiro", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: "caixa", label: "Caixa", icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" },
  { id: "relatorios", label: "Relatórios", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
];

const vendedorMenu = [
  { id: "vendedor-dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { id: "registrar-venda", label: "Registrar Venda", icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" },
  { id: "historico-vendas", label: "Minhas Vendas", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { id: "estoque", label: "Produtos", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" },
];

function Icon({ path }: { path: string }) {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d={path} />
    </svg>
  );
}

function ThemeIcon({ theme }: { theme: "light" | "dark" }) {
  if (theme === "dark") {
    return (
      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="5" /><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

export default function Layout({ page, userId, role, onNavigate, onLogout, children }: Props) {
  const { currentUser } = useStore();
  const { theme, toggleTheme } = useTheme();
  const user = currentUser && currentUser.id === userId ? currentUser : undefined;
  const menu = role === "admin" ? adminMenu : vendedorMenu;
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [page]);

  return (
    <div className="app-shell" style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Mobile top bar */}
      <header className="mobile-topbar">
        <button className="mobile-icon-btn" onClick={() => setMobileOpen(v => !v)} aria-label="Abrir menu">
          <span className="hamburger"><i /><i /><i /></span>
        </button>
        <div className="mobile-brand">
          {/* ALTERAÇÃO DA LOGO: a imagem fica embutida em src/assets/logoData.ts */}
          <img className="mobile-brand-logo" src={LOGO_ICON} alt="Logo da empresa" />
          <div>
            {/* ALTERAÇÃO DO NOME DA EMPRESA: troque o texto abaixo */}
            <div className="mobile-brand-title">AMX Case</div>
            <div className="mobile-brand-subtitle">Gestão</div>
          </div>
        </div>
        <button className="mobile-icon-btn" onClick={toggleTheme} aria-label="Alternar tema">
          <ThemeIcon theme={theme} />
        </button>
        <button className="mobile-icon-btn" onClick={onLogout} aria-label="Sair" title="Sair" style={{ color: "#F87171" }}>
          <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
        </button>
        <div className="mobile-user-avatar">{user?.name?.charAt(0)}</div>
      </header>

      {mobileOpen && <button className="mobile-menu-backdrop" aria-label="Fechar menu" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar${mobileOpen ? " mobile-open" : ""}`}>
        {/* Logo */}
        <div className="sidebar-brand-row" style={{ padding: "20px 20px 16px", borderBottom: "1px solid #1E293B" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* ALTERAÇÃO DA LOGO: a imagem fica embutida em src/assets/logoData.ts */}
            <img className="sidebar-brand-logo" src={LOGO_ICON} alt="Logo da empresa" />
            <div>
              {/* ALTERAÇÃO DO NOME DA EMPRESA: troque o texto abaixo */}
              <div style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "13.5px", fontWeight: 700, color: "white", lineHeight: 1.2 }}>AMX Case</div>
              <div style={{ fontSize: "10px", color: "#475569", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>Gestão</div>
            </div>
          </div>
          <button className="mobile-sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Fechar menu">×</button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, paddingTop: "8px", paddingBottom: "8px" }}>
          {menu.map((item: any) => {
            if (item.section) {
              return <div key={item.section} className="sidebar-section">{item.section}</div>;
            }
            const isActive = page === item.id;
            return (
              <button
                key={item.id}
                className={`sidebar-item${isActive ? " active" : ""}`}
                onClick={() => onNavigate(item.id as Page)}
                style={{ width: "calc(100% - 16px)", textAlign: "left" }}
              >
                <Icon path={item.icon} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #1E293B" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <div style={{ width: "32px", height: "32px", background: "#2563EB", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "white", fontSize: "13px", fontWeight: 700 }}>{user?.name.charAt(0)}</span>
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#E2E8F0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name}</div>
              <div style={{ fontSize: "11px", color: "#475569", textTransform: "capitalize" }}>{role}</div>
            </div>
          </div>
          <button onClick={toggleTheme} className="sidebar-item" style={{ width: "100%", textAlign: "left" }}>
            <ThemeIcon theme={theme} />
            {theme === "dark" ? "Tema claro" : "Tema escuro"}
          </button>
          <button onClick={onLogout} className="sidebar-item" style={{ width: "100%", textAlign: "left", color: "#EF4444" }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="app-main" style={{ flex: 1, overflowY: "auto", background: "#F1F5F9" }}>
        {children}
      </main>
    </div>
  );
}
