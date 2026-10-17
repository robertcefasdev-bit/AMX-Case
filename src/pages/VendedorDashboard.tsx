import { fmt } from "../data/mockData";
import { useStore } from "../data/store";

type Page = "registrar-venda" | "historico-vendas" | "estoque" | "vendedor-dashboard" | "dashboard" | "cadastro-produto" | "produtos-repor" | "pouca-rotatividade" | "vendedores" | "vendas-vendedor" | "financeiro" | "caixa" | "relatorios";

interface Props { userId: string; onNavigate: (p: Page) => void; }

export default function VendedorDashboard({ userId, onNavigate }: Props) {
  const { sales, products } = useStore();
  const today = new Date().toLocaleDateString("pt-BR");
  const mySales = sales.filter(s => s.sellerId === userId && s.status === "Concluída");
  const todaySales = mySales.filter(s => s.date === today);
  const weekSales = mySales.filter(s => {
    const d = new Date(); const dates = Array.from({length:7},(_,i)=>{const x=new Date(d); x.setDate(d.getDate()-i); return x.toLocaleDateString("pt-BR");});
    return dates.includes(s.date);
  });
  const todayRevenue = todaySales.reduce((acc, s) => acc + s.finalPrice, 0);

  const availableProducts = products.filter(p => p.stock > 0 && p.status === "Ativo").slice(0, 5);

  return (
    <div style={{ padding: "28px 32px", maxWidth: "900px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0F172A", margin: 0 }}>Meu Dashboard</h1>
        <p style={{ color: "#64748B", fontSize: "13.5px", margin: "4px 0 0" }}>Visão geral das suas vendas</p>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "14px", marginBottom: "24px" }}>
        <div className="kpi-card">
          <div className="kpi-label">Vendas Hoje</div>
          <div className="kpi-value">{todaySales.length}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Valor Vendido Hoje</div>
          <div className="kpi-value" style={{ color: "#2563EB" }}>{fmt(todayRevenue)}</div>
          <div className="kpi-sub">{todaySales.length} transações</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Vendas da Semana</div>
          <div className="kpi-value">{weekSales.length}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Vendas do Mês</div>
          <div className="kpi-value">{mySales.length}</div>
        </div>
      </div>

      {/* CTA */}
      <button className="btn btn-primary" style={{ fontSize: "15px", padding: "12px 28px", marginBottom: "28px", gap: "8px" }} onClick={() => onNavigate("registrar-venda")}>
        <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
        Registrar Nova Venda
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Recent sales */}
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}>Minhas Vendas Recentes</div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate("historico-vendas")}>Ver todas</button>
          </div>
          {mySales.slice(0, 5).map(s => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #F1F5F9" }}>
              <div>
                <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#0F172A" }}>{s.productName}</div>
                <div style={{ fontSize: "11px", color: "#64748B" }}>{s.date} · {s.time} · {s.paymentMethod}</div>
              </div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#16A34A" }}>{fmt(s.finalPrice)}</div>
            </div>
          ))}
        </div>

        {/* Available products */}
        <div className="card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}>Produtos Disponíveis</div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate("estoque")}>Ver todos</button>
          </div>
          {availableProducts.map(p => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #F1F5F9" }}>
              <div>
                <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#0F172A" }}>{p.name}</div>
                <div style={{ fontSize: "11px", color: "#64748B" }}>{p.compatibility} · {p.sku}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#2563EB" }}>{fmt(p.price)}</div>
                <div style={{ fontSize: "11px", color: p.stock <= p.minStock ? "#DC2626" : "#64748B" }}>{p.stock} un.</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
