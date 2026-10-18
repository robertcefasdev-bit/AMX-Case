import { useState } from "react";
import { useStore } from "../data/store";

// Tela obrigatória no primeiro acesso: a senha inicial precisa ser trocada antes de usar o sistema.
export default function TrocarSenha() {
  const { currentUser, changePassword, logout } = useStore();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (next.length < 6) { setError("A nova senha deve ter pelo menos 6 caracteres."); return; }
    if (next !== confirm) { setError("A confirmação não confere com a nova senha."); return; }
    setBusy(true);
    setError("");
    const result = await changePassword(current, next);
    setBusy(false);
    if (!result.ok) setError(result.message);
  }

  const label = { display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" } as const;

  return (
    <div style={{ minHeight: "100vh", background: "#0A0F1E", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ background: "white", borderRadius: "12px", padding: "32px", boxShadow: "0 25px 60px rgba(0,0,0,0.4)" }}>
          <h2 style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "18px", fontWeight: 700, color: "#0F172A", margin: "0 0 8px" }}>Crie sua senha</h2>
          <p style={{ color: "#64748B", fontSize: "13px", margin: "0 0 20px", lineHeight: 1.5 }}>
            Olá, {currentUser?.name}. Por segurança, troque a senha inicial por uma só sua antes de continuar.
          </p>

          {error && <div className="alert alert-error" style={{ marginBottom: "16px" }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={label}>Senha atual (inicial)</label>
              <input className="input" type="password" value={current} onChange={e => { setCurrent(e.target.value); setError(""); }} autoComplete="current-password" />
            </div>
            <div>
              <label style={label}>Nova senha (mín. 6 caracteres)</label>
              <input className="input" type="password" value={next} onChange={e => { setNext(e.target.value); setError(""); }} autoComplete="new-password" />
            </div>
            <div>
              <label style={label}>Repita a nova senha</label>
              <input className="input" type="password" value={confirm} onChange={e => { setConfirm(e.target.value); setError(""); }} autoComplete="new-password" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: "100%", justifyContent: "center", padding: "11px", fontSize: "15px" }}>
              {busy ? "Salvando..." : "Salvar nova senha"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => logout()} style={{ width: "100%", justifyContent: "center" }}>
              Sair
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
