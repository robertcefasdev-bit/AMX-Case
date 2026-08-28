import { fmt } from "../data/mockData";
import { useStore, downloadCSV } from "../data/store";

export default function ProdutosRepor() {
  const { products } = useStore();
  const repor = products.filter(p => p.stock <= p.minStock && p.status === "Ativo");

  function priority(p: typeof products[0]) {
    if (p.stock === 0) return "Alta";
    if (p.stock <= Math.ceil(p.minStock * 0.5)) return "Alta";
    if (p.stock <= p.minStock) return "Média";
    return "Baixa";
  }

  const sorted = [...repor].sort((a, b) => {
    const order = { Alta: 0, Média: 1, Baixa: 2 };
    return order[priority(a)] - order[priority(b)];
  });

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0F172A", margin: 0 }}>Produtos para Repor</h1>
          <p style={{ color: "#64748B", fontSize: "13.5px", margin: "4px 0 0" }}>{sorted.length} produto(s) abaixo do estoque mínimo</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => downloadCSV("produtos-para-repor.csv", sorted.map(p => ({SKU:p.sku,Produto:p.name,Categoria:p.category,Atual:p.stock,Minimo:p.minStock,Ideal:p.idealStock,Comprar:Math.max(0,p.idealStock-p.stock),CustoEstimado:p.cost*Math.max(0,p.idealStock-p.stock)})))}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          Exportar Lista
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="card" style={{ padding: "60px", textAlign: "center" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>✅</div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A" }}>Estoque em dia!</div>
          <div style={{ color: "#64748B", marginTop: "4px" }}>Nenhum produto abaixo do estoque mínimo.</div>
        </div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Atual</th>
                <th>Mínimo</th>
                <th>Ideal</th>
                <th>Rec. Compra</th>
                <th>Última Entrada</th>
                <th>Última Venda</th>
                <th>Custo Est.</th>
                <th>Prioridade</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(p => {
                const rec = p.idealStock - p.stock;
                const prio = priority(p);
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "#0F172A" }}>{p.name}</div>
                      <div style={{ fontSize: "11px", color: "#64748B", fontFamily: "'JetBrains Mono',monospace" }}>{p.sku}</div>
                    </td>
                    <td><span className="badge badge-blue">{p.category}</span></td>
                    <td>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: p.stock === 0 ? "#DC2626" : "#CA8A04" }}>
                        {p.stock}
                      </span>
                    </td>
                    <td style={{ fontFamily: "'JetBrains Mono',monospace", color: "#64748B" }}>{p.minStock}</td>
                    <td style={{ fontFamily: "'JetBrains Mono',monospace", color: "#64748B" }}>{p.idealStock}</td>
                    <td>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: "#2563EB" }}>{rec} un.</span>
                    </td>
                    <td style={{ fontSize: "12.5px", color: "#475569" }}>{p.lastEntry || "—"}</td>
                    <td style={{ fontSize: "12.5px", color: "#475569" }}>{p.lastSale || "—"}</td>
                    <td style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "13px" }}>{fmt(p.cost * rec)}</td>
                    <td>
                      <span className={`priority-${prio.toLowerCase()}`}>{prio}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
