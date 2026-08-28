export type Category = "Capa" | "Película" | "Cabo" | "Carregador" | "Fone" | "Suporte" | "Adaptador" | "Acessório";
export type PaymentMethod = "Dinheiro" | "PIX" | "Débito" | "Crédito" | "Outros";
export type SaleStatus = "Concluída" | "Cancelada" | "Estornada";
export type UserRole = "admin" | "vendedor";

export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
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

export const users: User[] = [
  { id: "u1", name: "Admin Master", username: "admin", password: "admin123", role: "admin", status: "Ativo", createdAt: "2024-01-10" },
  { id: "u2", name: "Carlos Mendes", username: "carlos", password: "carlos123", role: "vendedor", status: "Ativo", createdAt: "2024-02-01" },
  { id: "u3", name: "Fernanda Lima", username: "fernanda", password: "fer123", role: "vendedor", status: "Ativo", createdAt: "2024-02-15" },
  { id: "u4", name: "Rafael Torres", username: "rafael", password: "rafa123", role: "vendedor", status: "Ativo", createdAt: "2024-03-05" },
  { id: "u5", name: "Juliana Costa", username: "juliana", password: "ju123", role: "vendedor", status: "Inativo", createdAt: "2024-01-20" },
];

export const products: Product[] = [
  { id: "p1", sku: "CAP-IP15-001", name: "Capa iPhone 15 Transparente", category: "Capa", brand: "Premium", compatibility: "iPhone 15", description: "Capa transparente anti-impacto para iPhone 15", cost: 8.00, price: 25.00, stock: 42, minStock: 10, idealStock: 30, supplier: "TechSupply", entryDate: "2024-01-15", lastEntry: "2024-07-10", lastSale: "2024-08-23", totalBought: 120, totalSold: 78, daysSinceLastSale: 1, status: "Ativo" },
  { id: "p2", sku: "CAP-SAM-002", name: "Capa Samsung S24 Ultra Preta", category: "Capa", brand: "TechCase", compatibility: "Samsung S24 Ultra", description: "Capa premium preta fosca para Galaxy S24 Ultra", cost: 12.00, price: 39.90, stock: 18, minStock: 8, idealStock: 25, supplier: "MobileStore", entryDate: "2024-02-01", lastEntry: "2024-07-20", lastSale: "2024-08-22", totalBought: 80, totalSold: 62, daysSinceLastSale: 2, status: "Ativo" },
  { id: "p3", sku: "PEL-IP15-003", name: "Película Vidro 3D iPhone 15", category: "Película", brand: "ShieldPro", compatibility: "iPhone 15 / 15 Pro", description: "Película de vidro temperado 3D cobertura total", cost: 5.50, price: 18.00, stock: 55, minStock: 20, idealStock: 50, supplier: "TechSupply", entryDate: "2024-01-15", lastEntry: "2024-08-01", lastSale: "2024-08-24", totalBought: 200, totalSold: 145, daysSinceLastSale: 0, status: "Ativo" },
  { id: "p4", sku: "CAB-USBC-004", name: "Cabo USB-C 1m Trançado", category: "Cabo", brand: "DataCable", compatibility: "Universal USB-C", description: "Cabo USB-C nylon trançado carga rápida 60W", cost: 7.00, price: 22.00, stock: 5, minStock: 15, idealStock: 40, supplier: "CableWorld", entryDate: "2024-03-10", lastEntry: "2024-06-15", lastSale: "2024-08-20", totalBought: 100, totalSold: 95, daysSinceLastSale: 4, status: "Ativo" },
  { id: "p5", sku: "CAR-USB-005", name: "Carregador 20W USB-C", category: "Carregador", brand: "PowerMax", compatibility: "Universal", description: "Carregador rápido 20W compatível iPhone e Android", cost: 15.00, price: 45.00, stock: 2, minStock: 5, idealStock: 15, supplier: "PowerTech", entryDate: "2024-02-20", lastEntry: "2024-05-10", lastSale: "2024-08-18", totalBought: 60, totalSold: 58, daysSinceLastSale: 6, status: "Ativo" },
  { id: "p6", sku: "PEL-SAM-006", name: "Película Fosca Samsung A54", category: "Película", brand: "MatePro", compatibility: "Samsung Galaxy A54", description: "Película fosca anti-reflexo para Samsung A54", cost: 4.00, price: 15.00, stock: 30, minStock: 10, idealStock: 30, supplier: "TechSupply", entryDate: "2024-01-20", lastEntry: "2024-07-05", lastSale: "2024-08-23", totalBought: 150, totalSold: 120, daysSinceLastSale: 1, status: "Ativo" },
  { id: "p7", sku: "FON-BT-007", name: "Fone Bluetooth TWS", category: "Fone", brand: "SoundFit", compatibility: "Universal Bluetooth", description: "Fone de ouvido TWS com case de carregamento", cost: 28.00, price: 89.90, stock: 12, minStock: 5, idealStock: 15, supplier: "AudioTech", entryDate: "2024-03-01", lastEntry: "2024-06-20", lastSale: "2024-08-21", totalBought: 40, totalSold: 28, daysSinceLastSale: 3, status: "Ativo" },
  { id: "p8", sku: "SUP-CAR-008", name: "Suporte Veicular Magnético", category: "Suporte", brand: "MagMount", compatibility: "Universal", description: "Suporte veicular magnético ventosa para painel", cost: 10.00, price: 35.00, stock: 8, minStock: 5, idealStock: 15, supplier: "CarAcess", entryDate: "2024-02-10", lastEntry: "2024-05-25", lastSale: "2024-07-30", totalBought: 35, totalSold: 27, daysSinceLastSale: 25, status: "Ativo" },
  { id: "p9", sku: "CAP-IP14-009", name: "Capa iPhone 14 Silicone Azul", category: "Capa", brand: "SoftCase", compatibility: "iPhone 14", description: "Capa silicone premium azul royal para iPhone 14", cost: 9.00, price: 28.00, stock: 0, minStock: 5, idealStock: 20, supplier: "MobileStore", entryDate: "2024-01-05", lastEntry: "2024-04-10", lastSale: "2024-08-15", totalBought: 60, totalSold: 60, daysSinceLastSale: 9, status: "Ativo" },
  { id: "p10", sku: "ADP-LIG-010", name: "Adaptador Lightning USB-C", category: "Adaptador", brand: "ConnectPro", compatibility: "iPhone (Lightning)", description: "Adaptador Lightning para USB-C para carregadores", cost: 6.00, price: 19.90, stock: 22, minStock: 10, idealStock: 25, supplier: "TechSupply", entryDate: "2024-02-15", lastEntry: "2024-07-12", lastSale: "2024-08-22", totalBought: 90, totalSold: 68, daysSinceLastSale: 2, status: "Ativo" },
  { id: "p11", sku: "CAP-MOT-011", name: "Capa Motorola Edge 40 Transparente", category: "Capa", brand: "ClearView", compatibility: "Motorola Edge 40", description: "Capa transparente com bordas reforçadas", cost: 7.00, price: 22.00, stock: 14, minStock: 5, idealStock: 15, supplier: "MotoAcess", entryDate: "2024-03-20", lastEntry: "2024-07-18", lastSale: "2024-05-30", totalBought: 30, totalSold: 16, daysSinceLastSale: 86, status: "Ativo" },
  { id: "p12", sku: "SUP-MES-012", name: "Suporte Mesa Celular Dobrável", category: "Suporte", brand: "DeskFold", compatibility: "Universal 4-7 pol", description: "Suporte de mesa ajustável alumínio dobrável", cost: 12.00, price: 38.00, stock: 7, minStock: 5, idealStock: 12, supplier: "CarAcess", entryDate: "2024-01-25", lastEntry: "2024-03-10", lastSale: "2024-03-15", totalBought: 20, totalSold: 13, daysSinceLastSale: 162, status: "Ativo" },
  { id: "p13", sku: "PEL-SAM-013", name: "Película Privacidade Samsung S23", category: "Película", brand: "PrivacyShield", compatibility: "Samsung S23 / S23+", description: "Película de privacidade anti-espionagem", cost: 7.00, price: 25.00, stock: 0, minStock: 8, idealStock: 20, supplier: "TechSupply", entryDate: "2024-02-05", lastEntry: "2024-04-20", lastSale: "2024-08-19", totalBought: 45, totalSold: 45, daysSinceLastSale: 5, status: "Ativo" },
  { id: "p14", sku: "CAB-LIG-014", name: "Cabo Lightning 2m Premium", category: "Cabo", brand: "DataCable", compatibility: "iPhone / iPad (Lightning)", description: "Cabo Lightning reforçado 2 metros certificado MFi", cost: 11.00, price: 35.00, stock: 9, minStock: 8, idealStock: 20, supplier: "CableWorld", entryDate: "2024-01-30", lastEntry: "2024-06-08", lastSale: "2024-08-23", totalBought: 70, totalSold: 61, daysSinceLastSale: 1, status: "Ativo" },
];

const weekdays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export const sales: Sale[] = [
  { id: "v001", date: "24/08/2024", time: "09:15", weekday: "Sábado", sellerId: "u2", sellerName: "Carlos Mendes", productId: "p3", productName: "Película Vidro 3D iPhone 15", productSku: "PEL-IP15-003", category: "Película", quantity: 2, originalPrice: 18.00, discount: 0, finalPrice: 36.00, cost: 11.00, profit: 25.00, paymentMethod: "PIX", status: "Concluída" },
  { id: "v002", date: "24/08/2024", time: "10:30", weekday: "Sábado", sellerId: "u3", sellerName: "Fernanda Lima", productId: "p1", productName: "Capa iPhone 15 Transparente", productSku: "CAP-IP15-001", category: "Capa", quantity: 1, originalPrice: 25.00, discount: 0, finalPrice: 25.00, cost: 8.00, profit: 17.00, paymentMethod: "Dinheiro", status: "Concluída" },
  { id: "v003", date: "24/08/2024", time: "11:45", weekday: "Sábado", sellerId: "u2", sellerName: "Carlos Mendes", productId: "p7", productName: "Fone Bluetooth TWS", productSku: "FON-BT-007", category: "Fone", quantity: 1, originalPrice: 89.90, discount: 10.00, finalPrice: 79.90, cost: 28.00, profit: 51.90, paymentMethod: "Crédito", status: "Concluída" },
  { id: "v004", date: "24/08/2024", time: "13:20", weekday: "Sábado", sellerId: "u4", sellerName: "Rafael Torres", productId: "p6", productName: "Película Fosca Samsung A54", productSku: "PEL-SAM-006", category: "Película", quantity: 1, originalPrice: 15.00, discount: 0, finalPrice: 15.00, cost: 4.00, profit: 11.00, paymentMethod: "PIX", status: "Concluída" },
  { id: "v005", date: "24/08/2024", time: "14:50", weekday: "Sábado", sellerId: "u3", sellerName: "Fernanda Lima", productId: "p2", productName: "Capa Samsung S24 Ultra Preta", productSku: "CAP-SAM-002", category: "Capa", quantity: 2, originalPrice: 39.90, discount: 5.00, finalPrice: 69.80, cost: 24.00, profit: 45.80, paymentMethod: "Crédito", status: "Concluída" },
  { id: "v006", date: "23/08/2024", time: "09:05", weekday: "Sexta", sellerId: "u2", sellerName: "Carlos Mendes", productId: "p14", productName: "Cabo Lightning 2m Premium", productSku: "CAB-LIG-014", category: "Cabo", quantity: 1, originalPrice: 35.00, discount: 0, finalPrice: 35.00, cost: 11.00, profit: 24.00, paymentMethod: "Débito", status: "Concluída" },
  { id: "v007", date: "23/08/2024", time: "10:10", weekday: "Sexta", sellerId: "u4", sellerName: "Rafael Torres", productId: "p1", productName: "Capa iPhone 15 Transparente", productSku: "CAP-IP15-001", category: "Capa", quantity: 3, originalPrice: 25.00, discount: 0, finalPrice: 75.00, cost: 24.00, profit: 51.00, paymentMethod: "PIX", status: "Concluída" },
  { id: "v008", date: "23/08/2024", time: "15:30", weekday: "Sexta", sellerId: "u3", sellerName: "Fernanda Lima", productId: "p10", productName: "Adaptador Lightning USB-C", productSku: "ADP-LIG-010", category: "Adaptador", quantity: 2, originalPrice: 19.90, discount: 0, finalPrice: 39.80, cost: 12.00, profit: 27.80, paymentMethod: "Dinheiro", status: "Concluída" },
  { id: "v009", date: "22/08/2024", time: "11:00", weekday: "Quinta", sellerId: "u2", sellerName: "Carlos Mendes", productId: "p3", productName: "Película Vidro 3D iPhone 15", productSku: "PEL-IP15-003", category: "Película", quantity: 3, originalPrice: 18.00, discount: 0, finalPrice: 54.00, cost: 16.50, profit: 37.50, paymentMethod: "PIX", status: "Concluída" },
  { id: "v010", date: "22/08/2024", time: "16:15", weekday: "Quinta", sellerId: "u4", sellerName: "Rafael Torres", productId: "p5", productName: "Carregador 20W USB-C", productSku: "CAR-USB-005", category: "Carregador", quantity: 1, originalPrice: 45.00, discount: 5.00, finalPrice: 40.00, cost: 15.00, profit: 25.00, paymentMethod: "Crédito", status: "Concluída" },
  { id: "v011", date: "21/08/2024", time: "09:30", weekday: "Quarta", sellerId: "u3", sellerName: "Fernanda Lima", productId: "p4", productName: "Cabo USB-C 1m Trançado", productSku: "CAB-USBC-004", category: "Cabo", quantity: 2, originalPrice: 22.00, discount: 0, finalPrice: 44.00, cost: 14.00, profit: 30.00, paymentMethod: "PIX", status: "Concluída" },
  { id: "v012", date: "20/08/2024", time: "14:00", weekday: "Terça", sellerId: "u2", sellerName: "Carlos Mendes", productId: "p2", productName: "Capa Samsung S24 Ultra Preta", productSku: "CAP-SAM-002", category: "Capa", quantity: 1, originalPrice: 39.90, discount: 0, finalPrice: 39.90, cost: 12.00, profit: 27.90, paymentMethod: "Dinheiro", status: "Concluída" },
  { id: "v013", date: "19/08/2024", time: "10:45", weekday: "Segunda", sellerId: "u4", sellerName: "Rafael Torres", productId: "p6", productName: "Película Fosca Samsung A54", productSku: "PEL-SAM-006", category: "Película", quantity: 2, originalPrice: 15.00, discount: 0, finalPrice: 30.00, cost: 8.00, profit: 22.00, paymentMethod: "PIX", status: "Concluída" },
  { id: "v014", date: "19/08/2024", time: "15:00", weekday: "Segunda", sellerId: "u2", sellerName: "Carlos Mendes", productId: "p7", productName: "Fone Bluetooth TWS", productSku: "FON-BT-007", category: "Fone", quantity: 1, originalPrice: 89.90, discount: 0, finalPrice: 89.90, cost: 28.00, profit: 61.90, paymentMethod: "Crédito", status: "Concluída" },
  { id: "v015", date: "24/08/2024", time: "16:00", weekday: "Sábado", sellerId: "u2", sellerName: "Carlos Mendes", productId: "p3", productName: "Película Vidro 3D iPhone 15", productSku: "PEL-IP15-003", category: "Película", quantity: 1, originalPrice: 18.00, discount: 0, finalPrice: 18.00, cost: 5.50, profit: 12.50, paymentMethod: "Débito", status: "Cancelada" },
];

export const stockMovements: StockMovement[] = [
  { id: "m1", date: "10/07/2024", time: "08:30", weekday: "Quarta", type: "Entrada", productId: "p1", productName: "Capa iPhone 15 Transparente", quantity: 50, value: 400.00, userId: "u1", userName: "Admin Master" },
  { id: "m2", date: "20/07/2024", time: "09:00", weekday: "Sábado", type: "Entrada", productId: "p2", productName: "Capa Samsung S24 Ultra Preta", quantity: 30, value: 360.00, userId: "u1", userName: "Admin Master" },
  { id: "m3", date: "01/08/2024", time: "08:45", weekday: "Quinta", type: "Entrada", productId: "p3", productName: "Película Vidro 3D iPhone 15", quantity: 80, value: 440.00, userId: "u1", userName: "Admin Master" },
  { id: "m4", date: "24/08/2024", time: "09:15", weekday: "Sábado", type: "Saída", productId: "p3", productName: "Película Vidro 3D iPhone 15", quantity: 2, value: 36.00, userId: "u2", userName: "Carlos Mendes" },
  { id: "m5", date: "24/08/2024", time: "10:30", weekday: "Sábado", type: "Saída", productId: "p1", productName: "Capa iPhone 15 Transparente", quantity: 1, value: 25.00, userId: "u3", userName: "Fernanda Lima" },
  { id: "m6", date: "15/06/2024", time: "10:00", weekday: "Sábado", type: "Entrada", productId: "p4", productName: "Cabo USB-C 1m Trançado", quantity: 30, value: 210.00, userId: "u1", userName: "Admin Master" },
];

// Charts data
export const weekSalesData = [
  { day: "Seg", vendas: 8, faturamento: 320 },
  { day: "Ter", vendas: 12, faturamento: 480 },
  { day: "Qua", vendas: 10, faturamento: 390 },
  { day: "Qui", vendas: 15, faturamento: 620 },
  { day: "Sex", vendas: 18, faturamento: 750 },
  { day: "Sáb", vendas: 22, faturamento: 940 },
  { day: "Dom", vendas: 6, faturamento: 220 },
];

export const paymentData = [
  { name: "PIX", value: 38, color: "#2563EB" },
  { name: "Dinheiro", value: 22, color: "#0F172A" },
  { name: "Crédito", value: 28, color: "#3B82F6" },
  { name: "Débito", value: 10, color: "#93C5FD" },
  { name: "Outros", value: 2, color: "#CBD5E1" },
];

export const monthRevenueData = [
  { month: "Mar", faturamento: 8200, lucro: 3800 },
  { month: "Abr", faturamento: 9400, lucro: 4200 },
  { month: "Mai", faturamento: 11200, lucro: 5100 },
  { month: "Jun", faturamento: 10800, lucro: 4900 },
  { month: "Jul", faturamento: 13500, lucro: 6200 },
  { month: "Ago", faturamento: 9200, lucro: 4300 },
];

export const topProducts = [
  { name: "Película Vidro 3D iPhone 15", sold: 145, revenue: 2610 },
  { name: "Película Fosca Samsung A54", sold: 120, revenue: 1800 },
  { name: "Capa iPhone 15 Transparente", sold: 78, revenue: 1950 },
  { name: "Adaptador Lightning USB-C", sold: 68, revenue: 1353 },
  { name: "Capa Samsung S24 Ultra Preta", sold: 62, revenue: 2474 },
];

export const sellerRanking = [
  { id: "u2", name: "Carlos Mendes", sales: 48, revenue: 3240, profit: 1480, discounts: 10 },
  { id: "u3", name: "Fernanda Lima", sales: 42, revenue: 2980, profit: 1350, discounts: 5 },
  { id: "u4", name: "Rafael Torres", sales: 35, revenue: 2450, profit: 1100, discounts: 5 },
  { id: "u5", name: "Juliana Costa", sales: 18, revenue: 1200, profit: 540, discounts: 0 },
];

export const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
