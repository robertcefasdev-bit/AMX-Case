import { useState } from "react";
import { fmt } from "../data/mockData";
import { useStore, downloadCSV } from "../data/store";

interface Props { userId: string; role: "admin" | "vendedor"; }

const PAYMENTS = ["Dinheiro", "PIX", "Débito", "Crédito", "Outros"] as const;

export default function HistoricoVendas({ userId, role }: Props) {
  const { sales, users, updateSale, deleteSale } = useStore();
  const [filterSeller, setFilterSeller] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterPayment, setFilterPayment] = useState("Todos");
  const [search, setSearch] = useState("");
  const [editSale, setEditSale] = useState<(typeof sales)[number] | null>(null);
  const [editForm, setEditForm] = useState({ quantity: "1", paymentMethod: "PIX" as (typeof PAYMENTS)[number], discountPercent: "0" });

  function openEdit(s: (typeof sales)[number]) {
    if (role !== "admin" || s.status !== "Concluída") return;
    const subtotal = s.originalPrice * s.quantity;
    const discountPercent = subtotal ? (s.discount / subtotal) * 100 : 0;
    setEditForm({ quantity: String(s.quantity), paymentMethod: s.paymentMethod as (typeof PAYMENTS)[number], discountPercent: String(Math.round(discountPercent)) });
    setEditSale(s);
  }

  function saveEdit() {
    if (!editSale) return;
    const quantity = Number(editForm.quantity);
    const discountPercent = Number(editForm.discountPercent);
    const result = updateSale(editSale.id, { quantity, paymentMethod: editForm.paymentMethod, discountPercent });
    if (!result.ok) { alert(result.message); return; }
    setEditSale(null);
  }

  function handleDelete(s: (typeof sales)[number]) {
    if (role !== "admin") return;
    if (!window.confirm(`Remover a venda de "${s.productName}" (${s.date} ${s.time})? Esta ação não pode ser desfeita.`)) return;
    const result = deleteSale(s.id);
    if (!result.ok) alert(result.message);
  }

  const sellers = users.filter(u => u.role === "vendedor");

  const list = sales.filter(s => {
    if (role === "vendedor" && s.sellerId !== userId) return false;
    if (filterSeller !== "Todos" && s.sellerId !== filterSeller) return false;
    if (filterStatus !== "Todos" && s.status !== filterStatus) return false;
    if (filterPayment !== "Todos" && s.paymentMethod !== filterPayment) return false;
    if (search && !s.productName.toLowerCase().includes(search.toLowerCase()) && !s.sellerName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalRevenue = list.filter(s => s.status === "Concluída").reduce((a, s) => a + s.finalPrice, 0);
  const totalProfit = list.filter(s => s.status === "Concluída").reduce((a, s) => a + s.profit, 0);

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0F172A", margin: 0 }}>{role === "vendedor" ? "Minhas Vendas" : "Histórico de Vendas"}</h1>
          <p style={{ color: "#64748B", fontSize: "13.5px", margin: "4px 0 0" }}>{list.length} registro(s) · Faturamento: <strong>{fmt(totalRevenue)}</strong> · Lucro: <strong>{fmt(totalProfit)}</strong></p>
        </div>
        {role === "admin" && <button className="btn btn-secondary btn-sm" onClick={() => downloadCSV("vendas.csv", list.map(s => ({Data:s.date,Horario:s.time,Vendedor:s.sellerName,Produto:s.productName,SKU:s.productSku,Quantidade:s.quantity,PrecoOriginal:s.originalPrice,Desconto:s.discount,ValorFinal:s.finalPrice,Custo:s.cost,Lucro:s.profit,Pagamento:s.paymentMethod,Status:s.status})))}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          Exportar Vendas
        </button>}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: "14px 20px", marginBottom: "18px" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <input className="input" style={{ maxWidth: "220px" }} placeholder="Buscar produto ou vendedor..." value={search} onChange={e => setSearch(e.target.value)} />
          {role === "admin" && (
            <select className="input select" style={{ maxWidth: "180px" }} value={filterSeller} onChange={e => setFilterSeller(e.target.value)}>
              <option value="Todos">Todos os vendedores</option>
              {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <select className="input select" style={{ maxWidth: "160px" }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option>Todos</option>
            <option>Concluída</option>
            <option>Cancelada</option>
            <option>Estornada</option>
          </select>
          <select className="input select" style={{ maxWidth: "160px" }} value={filterPayment} onChange={e => setFilterPayment(e.target.value)}>
            <option>Todos</option>
            <option>Dinheiro</option>
            <option>PIX</option>
            <option>Débito</option>
            <option>Crédito</option>
            <option>Outros</option>
          </select>
        </div>
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Data / Hora</th>
              {role === "admin" && <th>Vendedor</th>}
              <th>Produto</th>
              <th>Qtd.</th>
              <th>Preço Original</th>
              <th>Desconto</th>
              <th>Valor Final</th>
              {role === "admin" && <th>Lucro</th>}
              <th>Pagamento</th>
              <th>Status</th>
              {role === "admin" && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {list.map(s => (
              <tr key={s.id} style={{ opacity: s.status !== "Concluída" ? 0.6 : 1 }}>
                <td>
                  <div style={{ fontSize: "12.5px", fontWeight: 600 }}>{s.date}</div>
                  <div style={{ fontSize: "11px", color: "#64748B" }}>{s.time} · {s.weekday}</div>
                </td>
                {role === "admin" && <td style={{ fontSize: "12.5px" }}>{s.sellerName}</td>}
                <td>
                  <div style={{ fontSize: "12.5px", fontWeight: 600 }}>{s.productName}</div>
                  <div style={{ fontSize: "11px", color: "#64748B", fontFamily: "'JetBrains Mono',monospace" }}>{s.productSku}</div>
                </td>
                <td style={{ fontFamily: "'JetBrains Mono',monospace", textAlign: "center" }}>{s.quantity}</td>
                <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "12.5px", color: "#64748B" }}>{fmt(s.originalPrice * s.quantity)}</td>
                <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "12.5px", color: s.discount > 0 ? "#CA8A04" : "#94A3B8" }}>
                  {s.discount > 0 ? `-${fmt(s.discount)}` : "—"}
                </td>
                <td style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: "#2563EB" }}>{fmt(s.finalPrice)}</td>
                {role === "admin" && <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "12.5px", color: "#16A34A" }}>{fmt(s.profit)}</td>}
                <td><span className="badge badge-blue" style={{ fontSize: "11px" }}>{s.paymentMethod}</span></td>
                <td>
                  <span className={`badge ${s.status === "Concluída" ? "badge-green" : "badge-red"}`}>{s.status}</span>
                </td>
                {role === "admin" && (
                  <td><div style={{ display: "flex", gap: "4px" }}>
                    <button className="btn btn-ghost btn-sm" title="Editar venda" disabled={s.status !== "Concluída"} onClick={() => openEdit(s)}>Editar</button>
                    <button className="btn btn-ghost btn-sm" title="Remover venda" style={{ color: "#DC2626" }} onClick={() => handleDelete(s)}>Remover</button>
                  </div></td>
                )}
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={11} style={{ textAlign: "center", padding: "40px", color: "#94A3B8" }}>Nenhuma venda encontrada</td></tr>}
          </tbody>
        </table>
      </div>

      {editSale && (
        <div className="modal-overlay" onClick={() => setEditSale(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ padding: "24px", maxWidth: "420px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <div><h2 style={{ margin: 0, fontSize: "17px" }}>Editar venda</h2><div style={{ fontSize: "12px", color: "#64748B", marginTop: "3px" }}>{editSale.productName}</div></div>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditSale(null)}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
              <label className="field-label">Quantidade<input className="input" type="number" min="1" value={editForm.quantity} onChange={e => setEditForm(f => ({ ...f, quantity: e.target.value }))} /></label>
              <label className="field-label">Desconto (%)<input className="input" type="number" min="0" max="100" value={editForm.discountPercent} onChange={e => setEditForm(f => ({ ...f, discountPercent: e.target.value }))} /></label>
              <label className="field-label">Forma de pagamento
                <select className="input select" value={editForm.paymentMethod} onChange={e => setEditForm(f => ({ ...f, paymentMethod: e.target.value as (typeof PAYMENTS)[number] }))}>
                  {PAYMENTS.map(p => <option key={p}>{p}</option>)}
                </select>
              </label>
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button className="btn btn-primary" onClick={saveEdit}>Salvar alterações</button>
                <button className="btn btn-secondary" onClick={() => setEditSale(null)}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
