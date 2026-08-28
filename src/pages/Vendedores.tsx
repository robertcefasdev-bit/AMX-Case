import { useMemo, useState } from "react";
import { fmt } from "../data/mockData";
import { useStore, downloadCSV, todayBR } from "../data/store";

export default function Vendedores() {
  const {
    users,
    sales,
    addUser,
    updateUser,
    discountOverridePassword,
    setDiscountOverridePassword,
  } = useStore();

  const sellers = users.filter((u) => u.role === "vendedor");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<(typeof users)[number] | null>(null);
  const [editing, setEditing] = useState<(typeof users)[number] | null>(null);
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    status: "Ativo" as "Ativo" | "Inativo",
  });
  const [discountPassword, setDiscountPassword] = useState(discountOverridePassword);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const getStats = (id: string) => {
    const mySales = sales.filter((s) => s.sellerId === id && s.status === "Concluída");
    return {
      count: mySales.length,
      products: mySales.reduce((total, sale) => total + sale.quantity, 0),
      revenue: mySales.reduce((total, sale) => total + sale.finalPrice, 0),
      profit: mySales.reduce((total, sale) => total + sale.profit, 0),
      discounts: mySales.reduce((total, sale) => total + sale.discount, 0),
    };
  };

  const sellerRanking = useMemo(
    () =>
      sellers
        .map((seller) => ({ ...seller, ...getStats(seller.id) }))
        .sort((a, b) => b.revenue - a.revenue),
    [sellers, sales],
  );

  function openCreate() {
    setEditing(null);
    setForm({ name: "", username: "", password: "", status: "Ativo" });
    setShowModal(true);
  }

  function openEdit(seller: (typeof users)[number]) {
    setEditing(seller);
    setForm({
      name: seller.name,
      username: seller.username,
      password: seller.password,
      status: seller.status,
    });
    setShowModal(true);
  }

  function saveSeller() {
    const name = form.name.trim();
    const username = form.username.trim();
    const password = form.password.trim();

    if (!name || !username || !password) {
      alert("Preencha nome, usuário e senha.");
      return;
    }

    const usernameTaken = users.some(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.id !== editing?.id,
    );
    if (usernameTaken) {
      alert("Este usuário já está cadastrado.");
      return;
    }

    if (editing) {
      updateUser(editing.id, { name, username, password, status: form.status });
    } else {
      addUser({ name, username, password, role: "vendedor", status: form.status });
    }

    setShowModal(false);
    setEditing(null);
    setForm({ name: "", username: "", password: "", status: "Ativo" });
  }

  function toggleStatus(seller: (typeof users)[number]) {
    updateUser(seller.id, { status: seller.status === "Ativo" ? "Inativo" : "Ativo" });
  }

  return (
    <div style={{ padding: "28px 32px" }}>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: 0 }}>Vendedores</h1>
          <p style={{ color: "#64748B", fontSize: 13.5, margin: "4px 0 0" }}>
            Cadastro, acesso e desempenho dos funcionários
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Cadastrar Funcionário</button>
      </div>

      <div className="card" style={{ padding: 18, marginBottom: 24, borderLeft: "3px solid #2563EB" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ minWidth: 220, flex: 1 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", margin: 0 }}>Autorização de desconto</h2>
            <p style={{ color: "#64748B", fontSize: 12.5, margin: "5px 0 0", lineHeight: 1.5 }}>
              Até 20% é permitido normalmente. Acima de 20%, o vendedor precisará desta senha de autorização.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", width: "100%", maxWidth: 440 }}>
            <input
              className="input"
              type="password"
              placeholder="Defina a senha do administrador"
              value={discountPassword}
              onChange={(e) => { setDiscountPassword(e.target.value); setPasswordSaved(false); }}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                const value = discountPassword.trim();
                if (!value) {
                  alert("Digite uma senha para autorizar descontos acima de 20%.");
                  return;
                }
                setDiscountOverridePassword(value);
                setPasswordSaved(true);
              }}
            >
              Salvar
            </button>
          </div>
        </div>
        {passwordSaved && <div style={{ marginTop: 8, color: "#16A34A", fontSize: 12, fontWeight: 600 }}>Senha salva com sucesso.</div>}
        {!discountOverridePassword && !passwordSaved && <div style={{ marginTop: 8, color: "#CA8A04", fontSize: 12, fontWeight: 600 }}>Nenhuma senha definida. Descontos acima de 20% estão bloqueados.</div>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginBottom: 24 }}>
        {sellerRanking.slice(0, 4).map((seller, index) => (
          <div key={seller.id} className="kpi-card">
            <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700 }}>#{index + 1} · {seller.name}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", marginTop: 5 }}>{fmt(seller.revenue)}</div>
            <div className="kpi-sub">{seller.count} venda(s) · {seller.products} produto(s)</div>
          </div>
        ))}
      </div>

      <div className="card table-wrap">
        <div style={{ padding: "16px 16px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 800, color: "#0F172A" }}>Funcionários cadastrados</div>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 3 }}>{sellers.length} vendedor(es)</div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => downloadCSV("vendedores.csv", sellerRanking.map((s) => ({ Nome: s.name, Usuario: s.username, Status: s.status, Cadastro: s.createdAt, Vendas: s.count, Produtos: s.products, Faturamento: s.revenue, Lucro: s.profit, Descontos: s.discounts })))}
          >
            Baixar vendedores
          </button>
        </div>
        <table>
          <thead>
            <tr><th>Vendedor</th><th>Usuário</th><th>Status</th><th>Cadastro</th><th>Vendas</th><th>Faturamento</th><th>Lucro</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {sellers.map((seller) => {
              const stats = getStats(seller.id);
              return (
                <tr key={seller.id}>
                  <td><div style={{ display: "flex", alignItems: "center", gap: 9 }}><div style={{ width: 30, height: 30, borderRadius: "50%", background: "#EFF6FF", color: "#2563EB", display: "grid", placeItems: "center", fontWeight: 800 }}>{seller.name.charAt(0).toUpperCase()}</div><span style={{ fontWeight: 600 }}>{seller.name}</span></div></td>
                  <td>{seller.username}</td>
                  <td><span className={`badge ${seller.status === "Ativo" ? "badge-green" : "badge-gray"}`}>{seller.status}</span></td>
                  <td>{seller.createdAt}</td>
                  <td>{stats.count}</td>
                  <td style={{ color: "#2563EB", fontWeight: 700 }}>{fmt(stats.revenue)}</td>
                  <td style={{ color: "#16A34A", fontWeight: 700 }}>{fmt(stats.profit)}</td>
                  <td><div style={{ display: "flex", gap: 5 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSelected(seller)} title="Detalhes">Ver</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(seller)} title="Editar">Editar</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleStatus(seller)} title="Ativar/Inativar">{seller.status === "Ativo" ? "Inativar" : "Ativar"}</button>
                  </div></td>
                </tr>
              );
            })}
            {!sellers.length && <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "#64748B" }}>Nenhum vendedor cadastrado. Clique em “Cadastrar Funcionário” para começar.</td></tr>}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ padding: 24, maxWidth: 620 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
              <div><h2 style={{ margin: 0, fontSize: 18 }}>{selected.name}</h2><div style={{ color: "#64748B", fontSize: 12.5, marginTop: 4 }}>@{selected.username} · {selected.status}</div></div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>
            {(() => {
              const stats = getStats(selected.id);
              const today = todayBR();
              const todaySales = sales.filter((s) => s.sellerId === selected.id && s.status === "Concluída" && s.date === today);
              return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
                {[["Vendas", stats.count], ["Produtos", stats.products], ["Faturamento", fmt(stats.revenue)], ["Lucro", fmt(stats.profit)], ["Descontos", fmt(stats.discounts)], ["Hoje", todaySales.length]].map(([label, value]) => <div key={String(label)} style={{ background: "#F8FAFC", borderRadius: 8, padding: 13 }}><div style={{ fontSize: 11, color: "#64748B", fontWeight: 700 }}>{label}</div><div style={{ marginTop: 4, fontSize: 18, fontWeight: 800 }}>{value}</div></div>)}
              </div>;
            })()}
            <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={() => downloadCSV(`vendas-${selected.username}.csv`, sales.filter((s) => s.sellerId === selected.id).map((s) => ({ Data: s.date, Horario: s.time, Vendedor: s.sellerName, Produto: s.productName, Quantidade: s.quantity, ValorFinal: s.finalPrice, Desconto: s.discount, Lucro: s.profit, Pagamento: s.paymentMethod, Status: s.status })))}>Baixar vendas</button>
              <button className="btn btn-secondary" onClick={() => { setSelected(null); openEdit(selected); }}>Editar funcionário</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ padding: 24, maxWidth: 440 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontSize: 18 }}>{editing ? "Editar Funcionário" : "Cadastrar Funcionário"}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              <label className="field-label">Nome completo<input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Maria Silva" /></label>
              <label className="field-label">Usuário<input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Ex.: maria" /></label>
              <label className="field-label">Senha<input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Senha de acesso" /></label>
              <label className="field-label">Status<select className="input select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "Ativo" | "Inativo" })}><option value="Ativo">Ativo</option><option value="Inativo">Inativo</option></select></label>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}><button className="btn btn-primary" onClick={saveSeller}>{editing ? "Salvar alterações" : "Cadastrar funcionário"}</button><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
