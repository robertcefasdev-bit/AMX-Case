import { useState } from "react";
import { useStore } from "../data/store";

interface Props {
  onLogin: (userId: string, role: "admin" | "vendedor") => void;
}

export default function Login({ onLogin }: Props) {
  const { users } = useStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password && u.status === "Ativo");
    if (user) {
      onLogin(user.id, user.role);
    } else {
      setError("Usuário ou senha inválidos.");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0A0F1E", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      {/* BG grid pattern */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(37,99,235,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.05) 1px, transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: "400px", position: "relative" }}>
        {/* Logo area */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          {/* ALTERAÇÃO DA LOGO: coloque o arquivo PNG da loja em public/logo.png */}
          <img className="login-logo" src="/logo.png" alt="Logo da empresa" />
          {/* ALTERAÇÃO DO NOME DA EMPRESA: troque o texto abaixo */}
          <h1 style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "22px", fontWeight: 700, color: "white", margin: "0 0 4px" }}>AMX Case Gestão</h1>
          <p style={{ color: "#64748B", fontSize: "14px", margin: 0 }}>Sistema de Gestão Empresarial</p>
        </div>

        {/* Card */}
        <div style={{ background: "white", borderRadius: "12px", padding: "32px", boxShadow: "0 25px 60px rgba(0,0,0,0.4)" }}>
          <h2 style={{ fontFamily: "'Work Sans', sans-serif", fontSize: "18px", fontWeight: 700, color: "#0F172A", margin: "0 0 24px" }}>Entrar no sistema</h2>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: "16px" }}>
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Usuário</label>
              <input className="input" placeholder="Digite seu usuário" value={username} onChange={e => { setUsername(e.target.value); setError(""); }} autoComplete="username" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Senha</label>
              <div style={{ position: "relative" }}>
                <input className="input" type={showPass ? "text" : "password"} placeholder="Digite sua senha" value={password} onChange={e => { setPassword(e.target.value); setError(""); }} style={{ paddingRight: "40px" }} autoComplete="current-password" />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748B", padding: "4px" }}>
                  {showPass
                    ? <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "11px", fontSize: "15px", marginTop: "4px" }}>
              Entrar
            </button>
          </form>

        </div>

        <p style={{ textAlign: "center", color: "#64748B", fontSize: "12px", margin: "20px 0 0" }}>
          Desenvolvido por Robert Cefas
        </p>
      </div>
    </div>
  );
}
