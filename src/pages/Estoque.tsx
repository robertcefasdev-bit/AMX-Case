import { useMemo, useState } from "react";
import { useProducts, downloadCSV } from "../data/store";
import type { Product, UserRole } from "../data/mockData";

interface Props { role: UserRole; onNewProduct?: () => void; }

const categories = ["Todas", "Capa", "Película", "Cabo", "Carregador", "Fone", "Suporte", "Adaptador", "Acessório"];
const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function stockStatus(p: Product) {
  if (p.stock === 0) return ["Sem estoque", "badge-red"] as const;
  if (p.stock <= p.minStock) return ["Estoque baixo", "badge-yellow"] as const;
  return ["Disponível", "badge-green"] as const;
}

function rotation(p: Product) {
  if (p.totalSold === 0 || p.daysSinceLastSale > 90) return ["Parado", "badge-red"] as const;
  if (p.daysSinceLastSale > 60) return ["Baixa", "badge-yellow"] as const;
  if (p.daysSinceLastSale > 30) return ["Normal", "badge-blue"] as const;
  return ["Boa", "badge-green"] as const;
}

export default function Estoque({ role, onNewProduct }: Props) {
  const { products, updateProduct, addStock } = useProducts();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterCat, setFilterCat] = useState("Todas");
  const [selected, setSelected] = useState<Product | null>(null);
  const [entryProduct, setEntryProduct] = useState<Product | null>(null);
  const [entryQty, setEntryQty] = useState("");

  const filtered = useMemo(() => products.filter((p) => {
    if (p.status !== "Ativo") return false;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || [p.name, p.sku, p.category, p.brand, p.compatibility].some(v => v.toLowerCase().includes(q));
    const matchesStatus = filterStatus === "Todos"
      || (filterStatus === "Disponíveis" && p.stock > p.minStock)
      || (filterStatus === "Estoque baixo" && p.stock > 0 && p.stock <= p.minStock)
      || (filterStatus === "Sem estoque" && p.stock === 0);
    const matchesCat = filterCat === "Todas" || p.category === filterCat;
    return matchesSearch && matchesStatus && matchesCat;
  }), [products, search, filterStatus, filterCat]);

  function openEntry(p: Product) {
    setEntryProduct(p);
    setEntryQty("");
  }

  function confirmEntry() {
    if (!entryProduct) return;
    const qty = Number(entryQty);
    if (!Number.isInteger(qty) || qty <= 0) return;
    addStock(entryProduct.id, qty);
    setEntryProduct(null);
  }

  function editPrice(p: Product) {
    if (role !== "admin") return;
    const raw = window.prompt("Novo preço de venda:", String(p.price));
    if (raw === null) return;
    const price = Number(raw.replace(",", "."));
    if (!Number.isFinite(price) || price < 0) return;
    updateProduct(p.id, { price });
  }

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "22px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0F172A", margin: 0 }}>Estoque</h1>
          <p style={{ fontSize: "13px", color: "#64748B", margin: "5px 0 0" }}>{products.filter(p => p.status === "Ativo").length} produtos cadastrados</p>
        </div>
        {role === "admin" && <div style={{display:"flex",gap:"8px"}}><button className="btn btn-secondary" onClick={() => downloadCSV("estoque.csv", filtered.map(p => ({SKU:p.sku,Produto:p.name,Categoria:p.category,Compatibilidade:p.compatibility,Estoque:p.stock,Minimo:p.minStock,Ideal:p.idealStock,Custo:p.cost,PrecoVenda:p.price,ValorEstoque:p.cost*p.stock,Status:stockStatus(p)[0],Rotatividade:rotation(p)[0]})))}>Exportar</button><button className="btn btn-primary" onClick={onNewProduct}>+ Cadastrar Produto</button></div>}
      </div>

      <div className="card" style={{ padding: "14px 16px", marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 320px" }}>
            <span style={{ position: "absolute", left: "12px", top: "9px", color: "#94A3B8" }}>⌕</span>
            <input className="input" style={{ paddingLeft: "34px" }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar por nome, SKU, categoria, marca ou modelo..." />
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {["Todos", "Disponíveis", "Estoque baixo", "Sem estoque"].map(f => <button key={f} className={`btn btn-sm ${filterStatus === f ? "btn-primary" : "btn-ghost"}`} onClick={() => setFilterStatus(f)}>{f}</button>)}
          </div>
          <select className="input select" style={{ maxWidth: "170px" }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ marginTop: "9px", fontSize: "12px", color: "#64748B" }}>{filtered.length} resultado(s) encontrado(s)</div>
      </div>

      <div className="card table-wrap">
        <table>
          <thead><tr><th>Código</th><th>Produto</th><th>Categoria</th><th>Compatibilidade</th><th>Atual</th><th>Mín.</th><th>Ideal</th><th>Custo</th><th>Venda</th><th>Status</th><th>Rotatividade</th><th>Ações</th></tr></thead>
          <tbody>
            {filtered.map(p => {
              const [ss, sc] = stockStatus(p); const [rs, rc] = rotation(p);
              return <tr key={p.id}>
                <td><span className="font-mono" style={{ fontSize: "12px", color: "#64748B" }}>{p.sku}</span></td>
                <td style={{ fontWeight: 600, maxWidth: "210px" }}><div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div><div style={{ fontSize: "11px", color: "#64748B", fontWeight: 400 }}>{p.brand}</div></td>
                <td><span className="badge badge-blue">{p.category}</span></td>
                <td style={{ fontSize: "12.5px", color: "#475569" }}>{p.compatibility}</td>
                <td><span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: p.stock === 0 ? "#DC2626" : p.stock <= p.minStock ? "#CA8A04" : "#0F172A" }}>{p.stock}</span></td>
                <td>{p.minStock}</td><td>{p.idealStock}</td><td>{fmt(p.cost)}</td><td style={{ color: "#2563EB", fontWeight: 600 }}>{fmt(p.price)}</td>
                <td><span className={`badge ${sc}`}>{ss}</span></td><td><span className={`badge ${rc}`}>{rs}</span></td>
                <td><div style={{ display: "flex", gap: "4px" }}>
                  <button className="btn btn-ghost btn-sm" title="Detalhes" onClick={() => setSelected(p)}>Ver</button>
                  {role === "admin" && <><button className="btn btn-ghost btn-sm" title="Alterar preço" onClick={() => editPrice(p)}>Editar</button><button className="btn btn-ghost btn-sm" title="Registrar entrada" onClick={() => openEntry(p)}>+ Estoque</button></>}
                </div></td>
              </tr>;
            })}
            {!filtered.length && <tr><td colSpan={12} style={{ textAlign: "center", padding: "42px", color: "#94A3B8" }}>Nenhum produto encontrado</td></tr>}
          </tbody>
        </table>
      </div>

      {selected && <div className="modal-overlay" onClick={() => setSelected(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{ padding: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}><div><div style={{ fontSize: "11px", color: "#64748B" }}>{selected.sku}</div><h2 style={{ fontSize: "18px", margin: "4px 0" }}>{selected.name}</h2><div style={{ fontSize: "13px", color: "#64748B" }}>{selected.brand} · {selected.compatibility}</div></div><button onClick={() => setSelected(null)} className="btn btn-ghost btn-sm">✕</button></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>{[["Estoque Atual", selected.stock],["Estoque Mínimo",selected.minStock],["Estoque Ideal",selected.idealStock],["Custo",fmt(selected.cost)],["Preço de Venda",fmt(selected.price)],["Lucro/unidade",fmt(selected.price-selected.cost)],["Total Comprado",selected.totalBought],["Total Vendido",selected.totalSold],["Dias sem venda",selected.daysSinceLastSale]].map(([label,value]) => <div key={String(label)} style={{ background: "#F8FAFC", borderRadius: "8px", padding: "12px" }}><div style={{ fontSize: "11px", color: "#64748B", fontWeight: 700 }}>{label}</div><div style={{ fontSize: "17px", fontWeight: 800, marginTop: "3px" }}>{value}</div></div>)}</div>
        <div style={{ marginTop: "14px", padding: "14px", background: "#F8FAFC", borderRadius: "8px", fontSize: "13px", color: "#475569" }}>Última entrada: {selected.lastEntry || "—"} · Última venda: {selected.lastSale || "—"} · Fornecedor: {selected.supplier || "—"}</div>
      </div></div>}

      {entryProduct && <div className="modal-overlay" onClick={() => setEntryProduct(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{ padding: "28px", maxWidth: "420px" }}>
        <h2 style={{ marginTop: 0 }}>Registrar entrada</h2><p style={{ color: "#64748B", fontSize: "13px" }}>{entryProduct.name}</p>
        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>Quantidade</label><input className="input" type="number" min="1" step="1" autoFocus value={entryQty} onChange={e => setEntryQty(e.target.value)} placeholder="Ex.: 10" />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "18px" }}><button className="btn btn-ghost" onClick={() => setEntryProduct(null)}>Cancelar</button><button className="btn btn-primary" onClick={confirmEntry}>Confirmar entrada</button></div>
      </div></div>}
    </div>
  );
}
