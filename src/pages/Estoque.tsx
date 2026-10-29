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
  if (p.excludeFromRotation) return ["Não aplicável", "badge-gray"] as const;
  if (p.totalSold === 0 || p.daysSinceLastSale > 90) return ["Parado", "badge-red"] as const;
  if (p.daysSinceLastSale > 60) return ["Baixa", "badge-yellow"] as const;
  if (p.daysSinceLastSale > 30) return ["Normal", "badge-blue"] as const;
  return ["Boa", "badge-green"] as const;
}

export default function Estoque({ role, onNewProduct }: Props) {
  const { products, updateProduct, deleteProduct, addStock } = useProducts();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterCat, setFilterCat] = useState("Todas");
  const [selected, setSelected] = useState<Product | null>(null);
  const [entryProduct, setEntryProduct] = useState<Product | null>(null);
  const [entryQty, setEntryQty] = useState("");
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({ sku: "", name: "", category: "", brand: "", compatibility: "", cost: "", price: "", minStock: "", idealStock: "", supplier: "", excludeFromRotation: false });

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

  async function confirmEntry() {
    if (!entryProduct) return;
    const qty = Number(entryQty);
    if (!Number.isInteger(qty) || qty <= 0) return;
    const result = await addStock(entryProduct.id, qty);
    if (!result.ok) { alert(result.message); return; }
    setEntryProduct(null);
  }

  function openEdit(p: Product) {
    if (role !== "admin") return;
    setEditForm({
      sku: p.sku, name: p.name, category: p.category, brand: p.brand, compatibility: p.compatibility,
      cost: String(p.cost), price: String(p.price), minStock: String(p.minStock), idealStock: String(p.idealStock),
      supplier: p.supplier || "", excludeFromRotation: !!p.excludeFromRotation,
    });
    setEditProduct(p);
  }

  async function saveEdit() {
    if (!editProduct) return;
    const cost = Number(editForm.cost.replace(",", "."));
    const price = Number(editForm.price.replace(",", "."));
    const minStock = Number(editForm.minStock);
    const idealStock = Number(editForm.idealStock);
    if (!editForm.name.trim()) { alert("Informe o nome do produto."); return; }
    if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(price) || price < 0) { alert("Custo e preço devem ser números válidos."); return; }
    if (!Number.isInteger(minStock) || !Number.isInteger(idealStock) || minStock < 0 || idealStock < minStock) { alert("Verifique o estoque mínimo e ideal (ideal não pode ser menor que o mínimo)."); return; }
    const newSku = editForm.sku.trim();
    const result = await updateProduct(editProduct.id, {
      ...(newSku && newSku !== editProduct.sku ? { sku: newSku } : {}),
      name: editForm.name.trim(), category: editForm.category as Product["category"], brand: editForm.brand.trim(),
      compatibility: editForm.compatibility.trim(), cost, price, minStock, idealStock,
      supplier: editForm.supplier.trim(), excludeFromRotation: editForm.excludeFromRotation,
    });
    if (!result.ok) { alert(result.message); return; }
    setEditProduct(null);
  }

  async function handleDelete(p: Product) {
    if (role !== "admin") return;
    if (!window.confirm(`Remover "${p.name}" definitivamente? Esta ação não pode ser desfeita.`)) return;
    const result = await deleteProduct(p.id);
    if (!result.ok) alert(result.message);
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
          <thead><tr><th>Código</th><th>Produto</th><th>Categoria</th><th>Compatibilidade</th><th>Atual</th><th>Mín.</th><th>Ideal</th>{role === "admin" && <th>Custo</th>}<th>Venda</th><th>Status</th><th>Rotatividade</th><th>Ações</th></tr></thead>
          <tbody>
            {filtered.map(p => {
              const [ss, sc] = stockStatus(p); const [rs, rc] = rotation(p);
              return <tr key={p.id}>
                <td><span className="font-mono" style={{ fontSize: "12px", color: "#64748B" }}>{p.sku}</span></td>
                <td style={{ fontWeight: 600, maxWidth: "210px" }}><div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div><div style={{ fontSize: "11px", color: "#64748B", fontWeight: 400 }}>{p.brand}</div></td>
                <td><span className="badge badge-blue">{p.category}</span></td>
                <td style={{ fontSize: "12.5px", color: "#475569" }}>{p.compatibility}</td>
                <td><span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: p.stock === 0 ? "#DC2626" : p.stock <= p.minStock ? "#CA8A04" : "#0F172A" }}>{p.stock}</span></td>
                <td>{p.minStock}</td><td>{p.idealStock}</td>{role === "admin" && <td>{fmt(p.cost)}</td>}<td style={{ color: "#2563EB", fontWeight: 600 }}>{fmt(p.price)}</td>
                <td><span className={`badge ${sc}`}>{ss}</span></td><td><span className={`badge ${rc}`}>{rs}</span></td>
                <td><div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  <button className="btn btn-ghost btn-sm" title="Detalhes" onClick={() => setSelected(p)}>Ver</button>
                  {role === "admin" && <>
                    <button className="btn btn-ghost btn-sm" title="Editar produto" onClick={() => openEdit(p)}>Editar</button>
                    <button className="btn btn-ghost btn-sm" title="Registrar entrada" onClick={() => openEntry(p)}>+ Estoque</button>
                    <button className="btn btn-ghost btn-sm" title="Remover produto" style={{ color: "#DC2626" }} onClick={() => handleDelete(p)}>Remover</button>
                  </>}
                </div></td>
              </tr>;
            })}
            {!filtered.length && <tr><td colSpan={role === "admin" ? 12 : 11} style={{ textAlign: "center", padding: "42px", color: "#94A3B8" }}>Nenhum produto encontrado</td></tr>}
          </tbody>
        </table>
      </div>

      {selected && <div className="modal-overlay" onClick={() => setSelected(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{ padding: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}><div><div style={{ fontSize: "11px", color: "#64748B" }}>{selected.sku}</div><h2 style={{ fontSize: "18px", margin: "4px 0" }}>{selected.name}</h2><div style={{ fontSize: "13px", color: "#64748B" }}>{selected.brand} · {selected.compatibility}</div></div><button onClick={() => setSelected(null)} className="btn btn-ghost btn-sm">✕</button></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>{[["Estoque Atual", selected.stock],["Estoque Mínimo",selected.minStock],["Estoque Ideal",selected.idealStock],...(role === "admin" ? [["Custo",fmt(selected.cost)]] : []),["Preço de Venda",fmt(selected.price)],...(role === "admin" ? [["Lucro/unidade",fmt(selected.price-selected.cost)]] : []),["Total Comprado",selected.totalBought],["Total Vendido",selected.totalSold],["Dias sem venda",selected.daysSinceLastSale]].map(([label,value]) => <div key={String(label)} style={{ background: "#F8FAFC", borderRadius: "8px", padding: "12px" }}><div style={{ fontSize: "11px", color: "#64748B", fontWeight: 700 }}>{label}</div><div style={{ fontSize: "17px", fontWeight: 800, marginTop: "3px" }}>{value}</div></div>)}</div>
        <div style={{ marginTop: "14px", padding: "14px", background: "#F8FAFC", borderRadius: "8px", fontSize: "13px", color: "#475569" }}>Última entrada: {selected.lastEntry || "—"} · Última venda: {selected.lastSale || "—"} · Fornecedor: {selected.supplier || "—"}</div>
      </div></div>}

      {entryProduct && <div className="modal-overlay" onClick={() => setEntryProduct(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{ padding: "28px", maxWidth: "420px" }}>
        <h2 style={{ marginTop: 0 }}>Registrar entrada</h2><p style={{ color: "#64748B", fontSize: "13px" }}>{entryProduct.name}</p>
        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px" }}>Quantidade</label><input className="input" type="number" min="1" step="1" autoFocus value={entryQty} onChange={e => setEntryQty(e.target.value)} placeholder="Ex.: 10" />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "18px" }}><button className="btn btn-ghost" onClick={() => setEntryProduct(null)}>Cancelar</button><button className="btn btn-primary" onClick={confirmEntry}>Confirmar entrada</button></div>
      </div></div>}

      {editProduct && <div className="modal-overlay" onClick={() => setEditProduct(null)}><div className="modal" onClick={e => e.stopPropagation()} style={{ padding: "28px", maxWidth: "520px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "18px" }}>
          <div><h2 style={{ margin: 0, fontSize: "18px" }}>Editar produto</h2><div style={{ fontSize: "12px", color: "#64748B", marginTop: "3px" }}>{editProduct.sku}</div></div>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditProduct(null)}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
          <label className="field-label">Código / SKU (código de barras)<input className="input" value={editForm.sku} onChange={e => setEditForm(f => ({ ...f, sku: e.target.value }))} placeholder="Digite ou leia o código de barras" />{editProduct.sku.startsWith("SC-") && <span style={{ fontSize: "11.5px", fontWeight: 400, color: "#64748B" }}>Este é um código automático. Troque pelo código de barras quando tiver.</span>}</label>
          <label className="field-label">Nome<input className="input" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "13px" }}>
            <label className="field-label">Categoria
              <select className="input select" value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}>
                {categories.filter(c => c !== "Todas").map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="field-label">Marca<input className="input" value={editForm.brand} onChange={e => setEditForm(f => ({ ...f, brand: e.target.value }))} /></label>
          </div>
          <label className="field-label">Compatibilidade<input className="input" value={editForm.compatibility} onChange={e => setEditForm(f => ({ ...f, compatibility: e.target.value }))} /></label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "13px" }}>
            <label className="field-label">Custo (R$)<input className="input" type="number" step="0.01" min="0" value={editForm.cost} onChange={e => setEditForm(f => ({ ...f, cost: e.target.value }))} /></label>
            <label className="field-label">Preço de venda (R$)<input className="input" type="number" step="0.01" min="0" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} /></label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "13px" }}>
            <label className="field-label">Estoque mínimo<input className="input" type="number" min="0" value={editForm.minStock} onChange={e => setEditForm(f => ({ ...f, minStock: e.target.value }))} /></label>
            <label className="field-label">Estoque ideal<input className="input" type="number" min="0" value={editForm.idealStock} onChange={e => setEditForm(f => ({ ...f, idealStock: e.target.value }))} /></label>
          </div>
          <label className="field-label">Fornecedor<input className="input" value={editForm.supplier} onChange={e => setEditForm(f => ({ ...f, supplier: e.target.value }))} /></label>
          <label className="checkbox-field">
            <input type="checkbox" checked={editForm.excludeFromRotation} onChange={e => setEditForm(f => ({ ...f, excludeFromRotation: e.target.checked }))} />
            <span><strong>Não considerar em "Pouca Rotatividade"</strong></span>
          </label>
          <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
            <button className="btn btn-primary" onClick={saveEdit}>Salvar alterações</button>
            <button className="btn btn-secondary" onClick={() => setEditProduct(null)}>Cancelar</button>
          </div>
        </div>
      </div></div>}
    </div>
  );
}
