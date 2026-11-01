import { useMemo, useState } from "react";
import { fmt } from "../data/mockData";
import type { Product } from "../data/mockData";
import { useStore } from "../data/store";
import type { Promotion } from "../data/store";

const CATEGORIES = ["Todas", "Capa", "Película", "Cabo", "Carregador", "Fone", "Suporte", "Adaptador", "Acessório"];

function brDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
function promoLabel(p: Promotion) {
  return p.kind === "preco" ? `${fmt(p.value)} cada` : `${p.value.toLocaleString("pt-BR")}% de desconto`;
}
function statusOf(p: Promotion) {
  if (p.active) return { label: "Ativa", cls: "badge-green" };
  if (p.status === "Ativa") return { label: "Expirada", cls: "badge-yellow" };
  return { label: "Encerrada", cls: "badge-gray" };
}
const round2 = (n: number) => Math.round(n * 100) / 100;

export default function Promocoes() {
  const { products, promotions, savePromotion, setPromotionStatus, deletePromotion } = useStore();

  // Modal: null = fechado; { promo: null } = nova; { promo } = editando
  const [modal, setModal] = useState<{ promo: Promotion | null } | null>(null);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"preco" | "percentual">("preco");
  const [valueText, setValueText] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Todas");
  const [busy, setBusy] = useState(false);

  const activeProducts = useMemo(() => products.filter((p) => p.status === "Ativo"), [products]);
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const editingId = modal?.promo?.id;

  // Produtos que já estão em OUTRA promoção em vigor (não dá para repetir).
  const takenBy = useMemo(() => {
    const m = new Map<string, string>();
    for (const pr of promotions) {
      if (!pr.active || pr.id === editingId) continue;
      for (const pid of pr.productIds) m.set(pid, pr.name);
    }
    return m;
  }, [promotions, editingId]);

  const value = Number(valueText.replace(",", "."));
  const validValue = Number.isFinite(value) && value > 0;

  function previewPrice(p: Product): number | null {
    if (!validValue) return null;
    return kind === "preco" ? value : round2(p.price * (1 - value / 100));
  }
  function isInvalid(p: Product) {
    if (!validValue) return false;
    return kind === "preco" ? value >= p.price : value >= 100;
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeProducts.filter((p) => {
      if (cat !== "Todas" && p.category !== cat) return false;
      if (!q) return true;
      return [p.name, p.sku, p.brand, p.compatibility].some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [activeProducts, search, cat]);

  function openNew() {
    setName(""); setKind("preco"); setValueText(""); setEndsOn("");
    setSelected(new Set()); setSearch(""); setCat("Todas");
    setModal({ promo: null });
  }
  function openEdit(promo: Promotion) {
    const ids = new Set(activeProducts.map((p) => p.id));
    setName(promo.name); setKind(promo.kind); setValueText(String(promo.value).replace(".", ","));
    setEndsOn(promo.endsOn || "");
    setSelected(new Set(promo.productIds.filter((id) => ids.has(id))));
    setSearch(""); setCat("Todas");
    setModal({ promo });
  }

  function toggle(id: string) {
    if (takenBy.has(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function selectAllFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of filtered) if (!takenBy.has(p.id)) next.add(p.id);
      return next;
    });
  }

  async function save() {
    if (busy || !modal) return;
    const trimmed = name.trim();
    if (!trimmed) { alert("Dê um nome para a promoção."); return; }
    if (!validValue) { alert("Informe o valor da promoção."); return; }
    if (kind === "percentual" && value >= 100) { alert("O desconto deve ser menor que 100%."); return; }
    if (selected.size === 0) { alert("Escolha pelo menos um produto."); return; }
    const bad = activeProducts.filter((p) => selected.has(p.id) && isInvalid(p));
    if (bad.length) {
      alert(`O valor da promoção precisa ser menor que o preço normal. Confira: ${bad.slice(0, 3).map((p) => p.name).join(", ")}${bad.length > 3 ? "..." : ""}`);
      return;
    }
    setBusy(true);
    const result = await savePromotion({
      id: modal.promo?.id,
      name: trimmed,
      kind,
      value: round2(value),
      endsOn: endsOn || undefined,
      productIds: [...selected],
      status: modal.promo ? modal.promo.status : "Ativa",
    });
    setBusy(false);
    if (!result.ok) { alert(result.message); return; }
    setModal(null);
  }

  async function toggleStatus(p: Promotion) {
    const next = p.active ? "Encerrada" : "Ativa";
    const result = await setPromotionStatus(p.id, next);
    if (!result.ok) alert(result.message);
  }
  async function remove(p: Promotion) {
    if (!window.confirm(`Remover a promoção "${p.name}"? Os produtos voltam ao preço normal. As vendas já feitas não mudam.`)) return;
    const result = await deletePromotion(p.id);
    if (!result.ok) alert(result.message);
  }

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: 0 }}>Promoções</h1>
          <p style={{ color: "#64748B", fontSize: 13.5, margin: "4px 0 0" }}>
            Escolha os produtos e o valor. No Registrar Venda, eles passam a sair pelo preço da promoção automaticamente.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Nova promoção</button>
      </div>

      {promotions.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>Nenhuma promoção ainda</div>
          <div style={{ color: "#64748B", marginTop: 6, fontSize: 13.5 }}>Crie uma promoção, escolha os produtos e defina o valor.</div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openNew}>+ Nova promoção</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
          {promotions.map((p) => {
            const st = statusOf(p);
            const names = p.productIds.map((id) => byId.get(id)?.name).filter(Boolean) as string[];
            return (
              <div key={p.id} className="card" style={{ padding: 18, opacity: p.active ? 1 : 0.8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{p.name}</div>
                  <span className={`badge ${st.cls}`}>{st.label}</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#16A34A", marginTop: 8 }}>{promoLabel(p)}</div>
                <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 4 }}>
                  {p.productIds.length} produto(s){p.endsOn ? ` · válida até ${brDate(p.endsOn)}` : " · sem data final"}
                </div>
                <div style={{ fontSize: 12.5, color: "#475569", marginTop: 8, lineHeight: 1.5 }}>
                  {names.slice(0, 4).join(", ")}{names.length > 4 ? ` e mais ${names.length - 4}` : ""}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>Editar</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => toggleStatus(p)}>{p.active ? "Encerrar" : "Ativar"}</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: "#DC2626" }} onClick={() => remove(p)}>Remover</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => !busy && setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ padding: 24, maxWidth: 720 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>{modal.promo ? "Editar promoção" : "Nova promoção"}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <label className="field-label">Nome da promoção
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Semana dos cabos" maxLength={80} />
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
                <label className="field-label">Tipo de valor
                  <select className="input select" value={kind} onChange={(e) => setKind(e.target.value as "preco" | "percentual")}>
                    <option value="preco">Preço fixo (R$) por produto</option>
                    <option value="percentual">Desconto (%) sobre o preço</option>
                  </select>
                </label>
                <label className="field-label">{kind === "preco" ? "Valor da promoção (R$)" : "Desconto (%)"}
                  <input className="input" inputMode="decimal" value={valueText} onChange={(e) => setValueText(e.target.value)} placeholder={kind === "preco" ? "Ex.: 19,90" : "Ex.: 15"} />
                </label>
              </div>
              <label className="field-label">Válida até (opcional)
                <input className="input" type="date" value={endsOn} onChange={(e) => setEndsOn(e.target.value)} />
              </label>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Produtos da promoção <span style={{ color: "#2563EB" }}>({selected.size} escolhido{selected.size === 1 ? "" : "s"})</span></div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={selectAllFiltered}>Marcar os da lista</button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>Limpar</button>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8, marginBottom: 8 }}>
                  <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, código, marca ou modelo..." />
                  <select className="input select" value={cat} onChange={(e) => setCat(e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <div style={{ border: "1px solid #E2E8F0", borderRadius: 8, maxHeight: 320, overflowY: "auto" }}>
                  {filtered.length === 0 && <div style={{ padding: 24, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>Nenhum produto encontrado</div>}
                  {filtered.map((p) => {
                    const taken = takenBy.get(p.id);
                    const checked = selected.has(p.id);
                    const preview = previewPrice(p);
                    const invalid = checked && isInvalid(p);
                    return (
                      <label
                        key={p.id}
                        style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderBottom: "1px solid #F1F5F9", cursor: taken ? "not-allowed" : "pointer", opacity: taken ? 0.55 : 1, background: checked ? "#EFF6FF" : "transparent" }}
                      >
                        <input type="checkbox" checked={checked} disabled={!!taken} onChange={() => toggle(p.id)} style={{ width: 18, height: 18, accentColor: "#2563EB", flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A" }}>{p.name}</div>
                          <div style={{ fontSize: 11.5, color: "#64748B" }}>{p.sku}{p.compatibility ? ` · ${p.compatibility}` : ""}</div>
                          {taken && <div style={{ fontSize: 11.5, color: "#CA8A04", fontWeight: 600 }}>Já está na promoção "{taken}"</div>}
                          {invalid && <div style={{ fontSize: 11.5, color: "#DC2626", fontWeight: 600 }}>O valor precisa ser menor que o preço normal</div>}
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 12, color: "#64748B", textDecoration: checked && preview !== null && !invalid ? "line-through" : "none" }}>{fmt(p.price)}</div>
                          {checked && preview !== null && !invalid && <div style={{ fontSize: 14, fontWeight: 700, color: "#16A34A" }}>{fmt(preview)}</div>}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? "Salvando..." : modal.promo ? "Salvar alterações" : "Criar promoção"}</button>
                <button className="btn btn-secondary" disabled={busy} onClick={() => setModal(null)}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
