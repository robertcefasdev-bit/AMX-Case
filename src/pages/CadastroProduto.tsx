import { useState } from "react";
import { useProducts } from "../data/store";
import type { Category } from "../data/mockData";

interface Props { onBack: () => void; }

export default function CadastroProduto({ onBack }: Props) {
  const { products, addProduct } = useProducts();
  const [form, setForm] = useState({
    name: "", sku: "", category: "Capa", brand: "", compatibility: "",
    description: "", cost: "", price: "", stockInit: "", minStock: "", idealStock: "",
    supplier: "", entryDate: new Date().toISOString().split("T")[0],
    excludeFromRotation: false,
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const cost = parseFloat(form.cost) || 0;
  const price = parseFloat(form.price) || 0;
  const margin = price > 0 ? Math.round(((price - cost) / price) * 100) : 0;
  const unitProfit = price - cost;

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sku = form.sku.trim();
    if (products.some((p) => p.sku.toLowerCase() === sku.toLowerCase())) {
      window.alert("Já existe um produto cadastrado com este SKU.");
      return;
    }
    if (Number(form.idealStock) < Number(form.minStock)) {
      window.alert("O estoque ideal não pode ser menor que o estoque mínimo.");
      return;
    }

    if (saving) return;
    setSaving(true);
    const result = await addProduct({
      name: form.name.trim(),
      sku,
      category: form.category as Category,
      brand: form.brand.trim(),
      compatibility: form.compatibility.trim(),
      description: form.description.trim(),
      cost,
      price,
      stock: Number(form.stockInit) || 0,
      minStock: Number(form.minStock) || 0,
      idealStock: Number(form.idealStock) || 0,
      supplier: form.supplier.trim(),
      entryDate: form.entryDate,
      lastEntry: form.stockInit ? form.entryDate : undefined,
      excludeFromRotation: form.excludeFromRotation,
    });
    setSaving(false);
    if (!result.ok) { window.alert(result.message); return; }

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onBack();
    }, 700);
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: "760px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Voltar
        </button>
        <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#0F172A", margin: 0 }}>Cadastrar Produto</h1>
      </div>

      {saved && <div className="alert alert-success" style={{ marginBottom: "20px" }}>
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
        Produto cadastrado com sucesso!
      </div>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gap: "20px" }}>
          {/* Identificação */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748B", marginBottom: "16px" }}>Identificação</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "5px", color: "#374151" }}>Nome do Produto *</label>
                <input className="input" required value={form.name} onChange={e => set("name", e.target.value)} placeholder="Ex.: Capa iPhone 15 Transparente" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "5px", color: "#374151" }}>Código / SKU *</label>
                <input className="input" required value={form.sku} onChange={e => set("sku", e.target.value)} placeholder="Ex.: CAP-IP15-001" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "5px", color: "#374151" }}>Categoria *</label>
                <select className="input select" value={form.category} onChange={e => set("category", e.target.value)}>
                  {["Capa","Película","Cabo","Carregador","Fone","Suporte","Adaptador","Acessório"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "5px", color: "#374151" }}>Marca</label>
                <input className="input" value={form.brand} onChange={e => set("brand", e.target.value)} placeholder="Ex.: ShieldPro" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "5px", color: "#374151" }}>Compatibilidade / Modelo</label>
                <input className="input" value={form.compatibility} onChange={e => set("compatibility", e.target.value)} placeholder="Ex.: iPhone 15 / 15 Pro" />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "5px", color: "#374151" }}>Descrição</label>
                <textarea className="input" rows={2} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Descrição do produto..." style={{ resize: "vertical" }} />
              </div>
            </div>
          </div>

          {/* Preços */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748B", marginBottom: "16px" }}>Preços</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "5px", color: "#374151" }}>Valor de Custo (R$) *</label>
                <input className="input" type="number" step="0.01" min="0" required value={form.cost} onChange={e => set("cost", e.target.value)} placeholder="0,00" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "5px", color: "#374151" }}>Valor de Venda Sugerido (R$) *</label>
                <input className="input" type="number" step="0.01" min="0" required value={form.price} onChange={e => set("price", e.target.value)} placeholder="0,00" />
              </div>
            </div>

            {/* Profit calc */}
            {cost > 0 && price > 0 && (
              <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
                {[
                  ["Custo", cost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), "#0F172A"],
                  ["Lucro Estimado", unitProfit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), unitProfit >= 0 ? "#16A34A" : "#DC2626"],
                  ["Margem", `${margin}%`, margin >= 30 ? "#16A34A" : margin >= 15 ? "#CA8A04" : "#DC2626"],
                ].map(([l, v, c]) => (
                  <div key={String(l)} style={{ background: "#F8FAFC", borderRadius: "8px", padding: "12px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748B" }}>{l}</div>
                    <div style={{ fontSize: "18px", fontWeight: 800, color: String(c), marginTop: "2px" }}>{v}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Estoque */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748B", marginBottom: "16px" }}>Estoque</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "5px", color: "#374151" }}>Estoque Inicial</label>
                <input className="input" type="number" min="0" value={form.stockInit} onChange={e => set("stockInit", e.target.value)} placeholder="0" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "5px", color: "#374151" }}>Estoque Mínimo</label>
                <input className="input" type="number" min="0" value={form.minStock} onChange={e => set("minStock", e.target.value)} placeholder="0" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "5px", color: "#374151" }}>Estoque Ideal</label>
                <input className="input" type="number" min="0" value={form.idealStock} onChange={e => set("idealStock", e.target.value)} placeholder="0" />
              </div>
            </div>
            <label className="checkbox-field" style={{ marginTop: "16px" }}>
              <input
                type="checkbox"
                checked={form.excludeFromRotation}
                onChange={e => setForm(f => ({ ...f, excludeFromRotation: e.target.checked }))}
              />
              <span>
                <strong>Não considerar em "Pouca Rotatividade"</strong>
                <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 400, marginTop: "2px" }}>
                  Use para produtos que naturalmente vendem devagar (ex.: itens de reposição, encomenda ou sazonais), para não aparecerem nos alertas de baixa rotatividade.
                </div>
              </span>
            </label>
          </div>

          {/* Fornecedor */}
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748B", marginBottom: "16px" }}>Fornecedor</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "5px", color: "#374151" }}>Fornecedor</label>
                <input className="input" value={form.supplier} onChange={e => set("supplier", e.target.value)} placeholder="Nome do fornecedor" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, marginBottom: "5px", color: "#374151" }}>Data de Entrada</label>
                <input className="input" type="date" value={form.entryDate} onChange={e => set("entryDate", e.target.value)} />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: "10px 28px" }}>{saving ? "Salvando..." : "Salvar Produto"}</button>
            <button type="button" className="btn btn-secondary" onClick={onBack}>Cancelar</button>
          </div>
        </div>
      </form>
    </div>
  );
}
