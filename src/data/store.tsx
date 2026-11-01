import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Product, Sale, User, StockMovement, PaymentMethod } from "./mockData";
import { ApiError, errorMessage, rpc } from "./api";

// ───────── utilitários (continuam iguais) ─────────
export function todayBR() { const d = new Date(); return d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }); }
export function todayISO() { const d = new Date(); return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(d); }
export function daysSince(date?: string) { if (!date) return 0; const d = new Date(`${date}T00:00:00`); return Number.isNaN(d.getTime()) ? 0 : Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000)); }
export function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) { alert("Não há dados para exportar."); return; }
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = "\ufeff" + [headers.map(esc).join(";"), ...rows.map((r) => headers.map((h) => esc(r[h])).join(";"))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ───────── tipos ─────────
export interface AuthUser extends User { mustChangePassword: boolean }
export interface Result { ok: boolean; message: string }
export type NewProduct = Omit<Product, "id" | "totalBought" | "totalSold" | "daysSinceLastSale" | "status">;
export interface Promotion {
  id: string; name: string; kind: "preco" | "percentual"; value: number;
  status: "Ativa" | "Encerrada"; endsOn: string; productIds: string[];
  /** Ativa e dentro da validade (calculado no servidor). */
  active: boolean;
}
export interface PromotionInput { id?: string; name: string; kind: "preco" | "percentual"; value: number; endsOn?: string; productIds: string[]; status?: "Ativa" | "Encerrada" }
export interface NewUser { name: string; username: string; password: string; status: "Ativo" | "Inativo" }
export interface UserPatch { name?: string; username?: string; password?: string; status?: "Ativo" | "Inativo" }

interface Store {
  /** "loading" só enquanto confere se já existe sessão aberta. */
  status: "loading" | "ready";
  currentUser: AuthUser | null;
  serverError: string;
  dataStatus: "idle" | "loading" | "ready" | "error";
  dataError: string;

  products: Product[]; sales: Sale[]; users: User[]; movements: StockMovement[]; promotions: Promotion[];
  hasDiscountPassword: boolean;

  login: (username: string, password: string) => Promise<Result>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<Result>;
  refresh: () => Promise<void>;

  addProduct: (input: NewProduct) => Promise<Result>;
  updateProduct: (id: string, patch: Partial<Product>) => Promise<Result>;
  deactivateProduct: (id: string) => Promise<Result>;
  deleteProduct: (id: string) => Promise<Result>;
  addStock: (id: string, quantity: number, entryDate?: string) => Promise<Result>;

  registerSale: (args: { sellerId: string; items: { productId: string; quantity: number }[]; paymentMethod: PaymentMethod; discountPercent: number; overridePassword?: string }) => Promise<Result & { sales: Sale[] }>;
  cancelSale: (saleId: string) => Promise<Result>;
  deleteSale: (saleId: string) => Promise<Result>;
  updateSale: (saleId: string, patch: { quantity?: number; paymentMethod?: PaymentMethod; discountPercent?: number }) => Promise<Result>;

  addUser: (input: NewUser) => Promise<Result>;
  updateUser: (id: string, patch: UserPatch) => Promise<Result>;
  deleteUser: (id: string) => Promise<Result>;
  setDiscountOverridePassword: (password: string) => Promise<Result>;

  savePromotion: (input: PromotionInput) => Promise<Result>;
  setPromotionStatus: (id: string, status: "Ativa" | "Encerrada") => Promise<Result>;
  deletePromotion: (id: string) => Promise<Result>;
}

interface Bootstrap {
  products: Product[]; sales: Sale[]; users: User[]; movements: StockMovement[]; promotions: Promotion[]; hasDiscountPassword: boolean;
}

const Ctx = createContext<Store | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [serverError, setServerError] = useState("");
  const [dataStatus, setDataStatus] = useState<Store["dataStatus"]>("idle");
  const [dataError, setDataError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [hasDiscountPassword, setHasDiscountPassword] = useState(false);

  const clearData = useCallback(() => {
    setProducts([]); setSales([]); setUsers([]); setMovements([]); setPromotions([]); setHasDiscountPassword(false);
    setDataStatus("idle"); setDataError("");
  }, []);

  // Sessão expirada ou usuário removido: volta para o login.
  const handleError = useCallback((e: unknown) => {
    if (e instanceof ApiError && e.code === "UNAUTHENTICATED") {
      setCurrentUser(null);
      clearData();
    }
  }, [clearData]);

  const refresh = useCallback(async () => {
    setDataStatus((s) => (s === "ready" ? s : "loading"));
    try {
      const d = await rpc<Bootstrap>("bootstrap");
      setProducts(d.products); setSales(d.sales); setUsers(d.users); setMovements(d.movements); setPromotions(d.promotions || []);
      setHasDiscountPassword(d.hasDiscountPassword);
      setDataStatus("ready"); setDataError("");
    } catch (e) {
      handleError(e);
      setDataStatus((s) => (s === "ready" ? s : "error"));
      setDataError(errorMessage(e));
    }
  }, [handleError]);

  // Ao abrir o app: já existe sessão?
  useEffect(() => {
    (async () => {
      try {
        const d = await rpc<{ user: AuthUser }>("me");
        setCurrentUser(d.user);
      } catch (e) {
        if (!(e instanceof ApiError && e.code === "UNAUTHENTICATED")) setServerError(errorMessage(e));
      } finally {
        setStatus("ready");
      }
    })();
  }, []);

  // Com usuário logado: carrega os dados e mantém atualizados (ao voltar para a aba e a cada 60 s).
  const userId = currentUser?.id;
  const mustChange = currentUser?.mustChangePassword;
  useEffect(() => {
    if (!userId || mustChange) return;
    refresh();
    const tick = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", tick);
    const timer = setInterval(tick, 60000);
    return () => { document.removeEventListener("visibilitychange", tick); clearInterval(timer); };
  }, [userId, mustChange, refresh]);

  // Executa uma ação de escrita e recarrega os dados.
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  async function act(action: string, params: Record<string, unknown>): Promise<Result> {
    try {
      await rpc(action, params);
      await refreshRef.current();
      return { ok: true, message: "OK" };
    } catch (e) {
      handleError(e);
      return { ok: false, message: errorMessage(e) };
    }
  }

  const value: Store = {
    status, currentUser, serverError, dataStatus, dataError,
    products, sales, users, movements, promotions, hasDiscountPassword,
    refresh,

    async login(username, password) {
      try {
        const d = await rpc<{ user: AuthUser }>("login", { username, password });
        setServerError("");
        setCurrentUser(d.user);
        return { ok: true, message: "OK" };
      } catch (e) {
        return { ok: false, message: errorMessage(e) };
      }
    },
    async logout() {
      try { await rpc("logout"); } catch { /* sai mesmo assim */ }
      setCurrentUser(null);
      clearData();
    },
    async changePassword(currentPassword, newPassword) {
      try {
        await rpc("changePassword", { currentPassword, newPassword });
        const d = await rpc<{ user: AuthUser }>("me");
        setCurrentUser(d.user);
        return { ok: true, message: "OK" };
      } catch (e) {
        handleError(e);
        return { ok: false, message: errorMessage(e) };
      }
    },

    addProduct: (input) => act("addProduct", { ...input }),
    updateProduct: (id, patch) => act("updateProduct", { id, patch }),
    deactivateProduct: (id) => act("updateProduct", { id, patch: { status: "Inativo" } }),
    deleteProduct: (id) => act("deleteProduct", { id }),
    addStock: (id, quantity, entryDate) => act("addStock", { id, quantity, entryDate }),

    async registerSale(args) {
      try {
        const d = await rpc<{ sales: Sale[] }>("registerSale", { ...args });
        await refreshRef.current();
        return { ok: true, message: "Venda registrada com sucesso.", sales: d.sales };
      } catch (e) {
        handleError(e);
        return { ok: false, message: errorMessage(e), sales: [] };
      }
    },
    cancelSale: (id) => act("cancelSale", { id }),
    deleteSale: (id) => act("deleteSale", { id }),
    updateSale: (id, patch) => act("updateSale", { id, patch }),

    addUser: (input) => act("addUser", { ...input, role: "vendedor" }),
    updateUser: (id, patch) => act("updateUser", { id, patch }),
    deleteUser: (id) => act("deleteUser", { id }),
    setDiscountOverridePassword: (password) => act("setDiscountPassword", { password }),

    savePromotion: (input) => act("savePromotion", { ...input }),
    setPromotionStatus: (id, status) => act("setPromotionStatus", { id, status }),
    deletePromotion: (id) => act("deletePromotion", { id }),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore deve ser usado dentro de DataProvider");
  return c;
}
export function useProducts() {
  const s = useStore();
  return { products: s.products, addProduct: s.addProduct, updateProduct: s.updateProduct, deactivateProduct: s.deactivateProduct, deleteProduct: s.deleteProduct, addStock: s.addStock };
}
