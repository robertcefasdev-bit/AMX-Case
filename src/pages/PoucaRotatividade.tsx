import { useState } from "react";
import { fmt } from "../data/mockData";
import { useStore, downloadCSV } from "../data/store";

const FILTERS = ["Todos", "+30 dias", "+60 dias", "+90 dias"];

function rotLabel(days: number) {
  if (days <= 7) return { label: "Boa", cls: "badge-green" };
  if (days <= 30) return { label: "Normal", cls: "badge-gray" };
  if (days <= 90) return { label: "Baixa", cls: "badge-yellow" };
  return { label: "Parado", cls: "badge-red" };
}

export default function PoucaRotatividade() {
  const { products } = useStore();
  const [filter, setFilter] = useState("Todos");

  const list = products
    .filter(p => p.status === "Ativo")
    .filter(p => !p.excludeFromRotation)
    .filter(p => {
      if (filter === "+30 dias") return p.daysSinceLastSale > 30;
      if (filter === "+60 dias") return p.daysSinceLastSale > 60;
      if (filter === "+90 dias") return p.daysSinceLastSale > 90;
      return p.daysSinceLastSale > 14;
    })
    .sort((a, b) => b.daysSinceLastSale - a.daysSinceLastSale);

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0F172A", margin: 0 }}>Pouca Rotatividade</h1>
          <p style={{ color: "#64748B", fontSize: "13.5px", margin: "4px 0 0" }}>Produtos com baixa saída no período</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => downloadCSV("baixa-rotatividade.csv", list.map(p => ({SKU:p.sku,Produto:p.name,Estoque:p.stock,Vendidas:p.totalSold,UltimaVenda:p.lastSale||"",DiasSemVenda:p.daysSinceLastSale,ValorParado:p.cost*p.stock,Rotatividade:rotLabel(p.daysSinceLastSale).label})))}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          Exportar Relatório
        </button>
      </div>

      <div style={{ marginBottom: "18px" }}>
        <div className="pill-tabs">
          {FILTERS.map(f => <button key={f} className={`pill-tab${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>{f}</button>)}
        </div>
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Estoque Atual</th>
              <th>Qtd. Vendida</th>
              <th>Última Venda</th>
              <th>Dias Sem Venda</th>
              <th>Valor Parado</th>
              <th>Rotatividade</th>
            </tr>
          </thead>
          <tbody>
            {list.map(p => {
              const rot = rotLabel(p.daysSinceLastSale);
              const valor = p.cost * p.stock;
              return (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: "11px", color: "#64748B", fontFamily: "'JetBrains Mono',monospace" }}>{p.sku}</div>
                  </td>
                  <td style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>{p.stock}</td>
                  <td style={{ fontFamily: "'JetBrains Mono',monospace", color: "#64748B" }}>{p.totalSold}</td>
                  <td style={{ fontSize: "12.5px", color: "#475569" }}>{p.lastSale || "Nunca"}</td>
                  <td>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: p.daysSinceLastSale > 90 ? "#DC2626" : p.daysSinceLastSale > 30 ? "#CA8A04" : "#64748B" }}>
                      {p.daysSinceLastSale}d
                    </span>
                  </td>
                  <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "13px", color: "#CA8A04", fontWeight: 600 }}>{fmt(valor)}</td>
                  <td><span className={`badge ${rot.cls}`}>{rot.label}</span></td>
                </tr>
              );
            })}
            {list.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#94A3B8" }}>Nenhum produto neste filtro</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
