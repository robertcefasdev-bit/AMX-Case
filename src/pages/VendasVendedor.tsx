import { useState } from "react";
import { fmt } from "../data/mockData";
import { useStore, downloadCSV, todayISO } from "../data/store";

export default function VendasVendedor() {
  const { users, sales } = useStore();
  const [sellerId, setSellerId] = useState("Todos");
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0,10); });
  const [dateTo, setDateTo] = useState(() => todayISO());

  const sellers = users.filter(u => u.role === "vendedor");

  const list = sales.filter(s => {
    if (s.status !== "Concluída") return false;
    if (sellerId !== "Todos" && s.sellerId !== sellerId) return false;
    const [d,m,y] = s.date.split("/").map(Number);
    const saleISO = `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    return saleISO >= dateFrom && saleISO <= dateTo;
  });

  const totalRevenue = list.reduce((a, s) => a + s.finalPrice, 0);
  const totalProfit = list.reduce((a, s) => a + s.profit, 0);
  const totalDiscounts = list.reduce((a, s) => a + s.discount, 0);
  const products = [...new Set(list.map(s => s.productId))].length;

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0F172A", margin: 0 }}>Vendas por Vendedor</h1>
        <p style={{ color: "#64748B", fontSize: "13.5px", margin: "4px 0 0" }}>Análise e exportação por vendedor</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: "16px 20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "5px" }}>Vendedor</label>
            <select className="input select" style={{ minWidth: "200px" }} value={sellerId} onChange={e => setSellerId(e.target.value)}>
              <option value="Todos">Todos os vendedores</option>
              {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "5px" }}>Data inicial</label>
            <input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: "160px" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "5px" }}>Data final</label>
            <input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: "160px" }} />
          </div>
          <button className="btn btn-primary btn-sm" style={{ alignSelf: "flex-end" }}>Filtrar</button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "20px" }}>
        {[
          ["Vendas", list.length, "#0F172A"],
          ["Produtos Diferentes", products, "#0F172A"],
          ["Faturamento", fmt(totalRevenue), "#2563EB"],
          ["Lucro", fmt(totalProfit), "#16A34A"],
        ].map(([l, v, c]) => (
          <div key={String(l)} className="kpi-card">
            <div className="kpi-label">{l}</div>
            <div className="kpi-value" style={{ color: String(c), fontSize: "22px" }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Export buttons */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button className="btn btn-secondary btn-sm" onClick={() => downloadCSV(`vendas-${sellerId === "Todos" ? "todos" : (sellers.find(x=>x.id===sellerId)?.username || sellerId)}.csv`, list.map(s => ({Data:s.date,Horario:s.time,Vendedor:s.sellerName,Produto:s.productName,Quantidade:s.quantity,ValorFinal:s.finalPrice,Desconto:s.discount,Lucro:s.profit,Pagamento:s.paymentMethod,Status:s.status})))}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          {sellerId === "Todos" ? "Baixar todos os vendedores" : "Baixar vendas deste vendedor"}
        </button>
        {sellerId !== "Todos" && (
          <button className="btn btn-secondary btn-sm">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Baixar relatório de todos
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Vendedor</th>
              <th>Produto</th>
              <th>Qtd.</th>
              <th>Preço Original</th>
              <th>Desconto</th>
              <th>Valor Final</th>
              <th>Lucro</th>
              <th>Pagamento</th>
            </tr>
          </thead>
          <tbody>
            {list.map(s => (
              <tr key={s.id}>
                <td style={{ fontSize: "12.5px" }}>{s.date} {s.time}</td>
                <td style={{ fontSize: "12.5px", fontWeight: 600 }}>{s.sellerName}</td>
                <td style={{ fontSize: "12.5px" }}>{s.productName}</td>
                <td style={{ fontFamily: "'JetBrains Mono',monospace", textAlign: "center" }}>{s.quantity}</td>
                <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "12.5px", color: "#64748B" }}>{fmt(s.originalPrice * s.quantity)}</td>
                <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "12.5px", color: s.discount > 0 ? "#CA8A04" : "#94A3B8" }}>{s.discount > 0 ? `-${fmt(s.discount)}` : "—"}</td>
                <td style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: "#2563EB" }}>{fmt(s.finalPrice)}</td>
                <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "12.5px", color: "#16A34A" }}>{fmt(s.profit)}</td>
                <td><span className="badge badge-blue" style={{ fontSize: "11px" }}>{s.paymentMethod}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
