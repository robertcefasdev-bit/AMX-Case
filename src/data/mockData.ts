export type Category = "Capa" | "Película" | "Cabo" | "Carregador" | "Fone" | "Suporte" | "Adaptador" | "Acessório";
export type PaymentMethod = "Dinheiro" | "PIX" | "Débito" | "Crédito" | "Outros";
export type SaleStatus = "Concluída" | "Cancelada" | "Estornada";
export type UserRole = "admin" | "vendedor";

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  status: "Ativo" | "Inativo";
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: Category;
  brand: string;
  compatibility: string;
  description: string;
  cost: number;
  price: number;
  stock: number;
  minStock: number;
  idealStock: number;
  supplier: string;
  entryDate: string;
  lastEntry?: string;
  lastSale?: string;
  totalBought: number;
  totalSold: number;
  daysSinceLastSale: number;
  status: "Ativo" | "Inativo";
  /** Quando true, o produto não entra nas listas/alertas de baixa rotatividade. */
  excludeFromRotation?: boolean;
  /** Preço promocional em vigor (vem do servidor); ausente quando o produto não está em promoção. */
  promoPrice?: number;
  promoName?: string;
}

export interface Sale {
  id: string;
  date: string;
  time: string;
  weekday: string;
  sellerId: string;
  sellerName: string;
  productId: string;
  productName: string;
  productSku: string;
  category: Category;
  quantity: number;
  originalPrice: number;
  discount: number;
  finalPrice: number;
  cost: number;
  profit: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
}

export interface StockMovement {
  id: string;
  date: string;
  time: string;
  weekday: string;
  type: "Entrada" | "Saída" | "Ajuste" | "Estorno";
  productId: string;
  productName: string;
  quantity: number;
  value: number;
  userId: string;
  userName: string;
  notes?: string;
}

export const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
