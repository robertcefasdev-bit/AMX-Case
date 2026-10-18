import { useState } from "react";
import { fmt, type Product, type PaymentMethod } from "../data/mockData";
import { useStore } from "../data/store";

interface Props { userId: string; role: "admin" | "vendedor"; }

type PaymentMethodOption = PaymentMethod;
const PAYMENTS: PaymentMethodOption[] = ["Dinheiro", "PIX", "Débito", "Crédito", "Outros"];

interface CartItem { product: Product; qty: number; }

export default function RegistrarVenda({ userId, role }: Props) {
  const { products, users, registerSale, hasDiscountPassword } = useStore();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payment, setPayment] = useState<PaymentMethodOption>("PIX");
  const [sellerId, setSellerId] = useState(userId);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [overridePassword, setOverridePassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const sellers = users.filter(u => u.status === "Ativo");

  const results = search.length > 1
    ? products.filter(p => p.status === "Ativo" && (
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.compatibility.toLowerCase().includes(search.toLowerCase())
      )).slice(0, 6)
    : [];

  function addToCart(p: Product) {
    if (p.stock === 0) { setErrorMsg(`${p.name} está sem estoque.`); return; }
    const existing = cart.find(c => c.product.id === p.id);
    if (existing) {
      setCart(cart.map(c => c.product.id === p.id ? { ...c, qty: Math.min(c.qty + 1, p.stock) } : c));
    } else {
      setCart([...cart, { product: p, qty: 1 }]);
    }
    setSearch("");
    setErrorMsg("");
  }

  function updateQty(id: string, qty: number) {
    const item = cart.find(c => c.product.id === id);
    if (!item) return;
    if (qty <= 0) { removeItem(id); return; }
    if (qty > item.product.stock) { setErrorMsg(`Estoque insuficiente. Disponível: ${item.product.stock}`); return; }
    setCart(cart.map(c => c.product.id === id ? { ...c, qty } : c));
    setErrorMsg("");
  }

  function removeItem(id: string) { setCart(cart.filter(c => c.product.id !== id)); }

  const subtotal = cart.reduce((acc, c) => acc + c.product.price * c.qty, 0);
  const totalDiscount = subtotal * (discountPercent / 100);
  const total = subtotal - totalDiscount;
  const totalProfit = cart.reduce((acc, c) => acc + (c.product.price - c.product.cost) * c.qty, 0) - totalDiscount;

  async function confirm() {
    if (cart.length === 0 || submitting) return;
    if (discountPercent > 20 && !hasDiscountPassword) { setErrorMsg("O administrador ainda não definiu a senha para autorizar descontos acima de 20%."); return; }
    setSubmitting(true);
    const result = await registerSale({ sellerId, paymentMethod: payment, discountPercent, overridePassword: discountPercent > 20 ? overridePassword : undefined, items: cart.map(c => ({ productId: c.product.id, quantity: c.qty })) });
    setSubmitting(false);
    if (!result.ok) { setErrorMsg(result.message); return; }
    setSuccess(true); setCart([]); setSearch(""); setDiscountPercent(0); setOverridePassword(""); setErrorMsg("");
    setTimeout(() => setSuccess(false), 4000);
  }

  return (
    <div style={{ padding: "28px 32px", maxWidth: "900px" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0F172A", marginBottom: "24px" }}>Registrar Venda</h1>

      {success && <div className="alert alert-success" style={{ marginBottom: "20px" }}>
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
        Venda registrada com sucesso! Estoque e caixa atualizados.
      </div>}

      {errorMsg && <div className="alert alert-error" style={{ marginBottom: "16px" }}>
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
        {errorMsg}
      </div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px" }}>
        {/* Left: search + cart */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Seller selector (admin only) */}
          {role === "admin" && (
            <div className="card" style={{ padding: "16px 20px" }}>
              <label style={{ fontSize: "12.5px", fontWeight: 600, display: "block", marginBottom: "6px", color: "#374151" }}>Vendedor responsável</label>
              <select className="input select" value={sellerId} onChange={e => setSellerId(e.target.value)}>
                {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}

          {/* Search */}
          <div className="card" style={{ padding: "16px 20px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: 600, display: "block", marginBottom: "8px", color: "#374151" }}>Buscar Produto</label>
            <div className="product-search" style={{ position: "relative" }}>
              <input className="input" placeholder="Digite o nome, SKU ou modelo..." value={search} onChange={e => { setSearch(e.target.value); setErrorMsg(""); }} autoFocus />
              {results.length > 0 && (
                <div className="product-search-results">
                  {results.map(p => (
                    <button key={p.id} className="product-search-item" onClick={() => addToCart(p)}>
                      <div className="product-search-item-info">
                        <div className="product-search-item-name">{p.name}</div>
                        <div className="product-search-item-meta">{p.sku} · {p.compatibility}</div>
                        <div className="product-search-item-stock" style={{ color: p.stock === 0 ? "#DC2626" : p.stock <= p.minStock ? "#CA8A04" : "#16A34A" }}>
                          {p.stock === 0 ? "Sem estoque" : `${p.stock} disponíveis`}
                        </div>
                      </div>
                      <div className="product-search-item-price">{fmt(p.price)}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cart */}
          {cart.length > 0 && (
            <div className="card" style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748B", marginBottom: "14px" }}>Itens da Venda</div>
              {cart.map(item => (
                <div key={item.product.id} style={{ padding: "12px 0", borderBottom: "1px solid #F1F5F9" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#0F172A" }}>{item.product.name}</div>
                      <div style={{ fontSize: "11.5px", color: "#64748B" }}>{fmt(item.product.price)} / un. · {item.product.stock} em estoque</div>
                    </div>
                    <button onClick={() => removeItem(item.product.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: "18px", lineHeight: 1 }}>×</button>
                  </div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <label style={{ fontSize: "11.5px", color: "#64748B", fontWeight: 600 }}>Qtd.</label>
                      <input type="number" min="1" max={item.product.stock} value={item.qty} onChange={e => updateQty(item.product.id, parseInt(e.target.value) || 1)} className="input" style={{ width: "60px", padding: "5px 8px" }} />
                    </div>
                    <div style={{ marginLeft: "auto", textAlign: "right" }}>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: "#2563EB" }}>{fmt(item.product.price * item.qty)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: summary + payment */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="card" style={{ padding: "20px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", marginBottom: "14px" }}>Desconto da compra inteira</div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <input type="number" min="0" max="100" step="1" className="input" value={discountPercent} onChange={e => setDiscountPercent(Math.max(0, Math.min(100, Number(e.target.value) || 0)))} style={{ width: "90px" }} />
              <span style={{ fontWeight: 700, color: "#475569" }}>%</span>
              <span style={{ fontSize: "12px", color: discountPercent > 20 ? "#DC2626" : "#64748B" }}>Limite normal: 20%</span>
            </div>
            <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "12px" }}>O percentual é aplicado sobre o valor total da compra, não sobre cada produto.</div>
            {discountPercent > 20 && (
              <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: "8px", padding: "12px", marginBottom: "14px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#9A3412", marginBottom: "6px" }}>Autorização necessária</div>
                {hasDiscountPassword ? (
                  <input type="password" className="input" placeholder="Senha definida pelo administrador" value={overridePassword} onChange={e => setOverridePassword(e.target.value)} />
                ) : (
                  <div style={{ fontSize: "12px", color: "#9A3412" }}>O administrador ainda precisa definir a senha para permitir descontos acima de 20%.</div>
                )}
              </div>
            )}
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", marginBottom: "14px" }}>Resumo da Venda</div>
            {cart.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center", color: "#94A3B8", fontSize: "13px" }}>Nenhum item adicionado</div>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item.product.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", marginBottom: "8px" }}>
                    <span style={{ color: "#475569" }}>{item.product.name} ×{item.qty}</span>
                    <span style={{ fontWeight: 600 }}>{fmt(item.product.price * item.qty)}</span>
                  </div>
                ))}
                <div style={{ borderTop: "1px solid #E2E8F0", marginTop: "10px", paddingTop: "10px" }}>
                  {totalDiscount > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", color: "#CA8A04", marginBottom: "4px" }}>
                    <span>Descontos</span><span>-{fmt(totalDiscount)}</span>
                  </div>}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: 800, color: "#0F172A" }}>
                    <span>Total</span><span style={{ color: "#2563EB" }}>{fmt(total)}</span>
                  </div>
                  {role === "admin" && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#16A34A", marginTop: "4px" }}>
                      <span>Lucro estimado</span><span>{fmt(totalProfit)}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="card" style={{ padding: "20px" }}>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", marginBottom: "12px" }}>Forma de Pagamento</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {PAYMENTS.map(p => (
                <button key={p} onClick={() => setPayment(p)}
                  style={{ padding: "8px", border: `2px solid ${payment === p ? "#2563EB" : "#E2E8F0"}`, borderRadius: "6px", background: payment === p ? "#EFF6FF" : "white", color: payment === p ? "#1D4ED8" : "#475569", fontSize: "12.5px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: "15px" }} onClick={confirm} disabled={cart.length === 0 || submitting}>
            {submitting ? "Registrando..." : `Confirmar Venda · ${fmt(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
