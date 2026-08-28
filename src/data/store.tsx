import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { products as seedProducts, sales as seedSales, users as seedUsers, stockMovements as seedMovements, type Product, type Sale, type User, type StockMovement, type PaymentMethod } from "./mockData";

const KEYS = { products:"amxcase.products.v3", sales:"amxcase.sales.v3", users:"amxcase.users.v3", movements:"amxcase.movements.v3", discountPassword:"amxcase.discountOverridePassword.v1" };
const LEGACY_KEYS = { products:"amxcase.products.v2", sales:"amxcase.sales.v2", users:"amxcase.users.v2", movements:"amxcase.movements.v2" };

function load<T>(key:string, seed:T, legacyKey?:string, migrate?:(value:T)=>T):T {
  try {
    const raw=localStorage.getItem(key);
    if(raw) return JSON.parse(raw);
    const legacy=legacyKey ? localStorage.getItem(legacyKey) : null;
    if(legacy){ const value=JSON.parse(legacy) as T; return migrate ? migrate(value) : value; }
    return seed;
  } catch { return seed; }
}
function currentYear(){ return new Date().getFullYear(); }
function normalizeDate(value:string){
  if(!value) return value;
  const year=currentYear();
  const m=value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if(m && Number(m[3]) < year) return `${m[1]}/${m[2]}/${year}`;
  const iso=value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(iso && Number(iso[1]) < year) return `${year}-${iso[2]}-${iso[3]}`;
  return value;
}
function weekdayFromDate(value:string){
  const br=value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const d=br ? new Date(Number(br[3]),Number(br[2])-1,Number(br[1])) : new Date(value);
  return ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"][d.getDay()];
}
function migrateDates<T extends any[]>(items:T):T {
  return items.map((item:any)=>{
    const next={...item};
    for(const key of ["date","entryDate","lastEntry","lastSale","createdAt"]){ if(typeof next[key]==="string") next[key]=normalizeDate(next[key]); }
    if(typeof next.date==="string" && "weekday" in next) next.weekday=weekdayFromDate(next.date);
    return next;
  }) as T;
}
function id(prefix:string){ return `${prefix}-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`; }
function nowParts(){
  const now=new Date();
  const parts=new Intl.DateTimeFormat("pt-BR", {timeZone:"America/Sao_Paulo", day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit", weekday:"long"}).formatToParts(now);
  const get=(type:string)=>parts.find(p=>p.type===type)?.value || "";
  const weekdayMap:Record<string,string>={"domingo":"Domingo","segunda-feira":"Segunda","terça-feira":"Terça","quarta-feira":"Quarta","quinta-feira":"Quinta","sexta-feira":"Sexta","sábado":"Sábado"};
  return {date:`${get("day")}/${get("month")}/${get("year")}`,iso:`${get("year")}-${get("month")}-${get("day")}`,time:`${get("hour")}:${get("minute")}`,weekday:weekdayMap[get("weekday")] || get("weekday")};
}
export function todayBR(){ const d=new Date(); return d.toLocaleDateString("pt-BR", {timeZone:"America/Sao_Paulo"}); }
export function todayISO(){ const d=new Date(); return new Intl.DateTimeFormat("en-CA", {timeZone:"America/Sao_Paulo", year:"numeric", month:"2-digit", day:"2-digit"}).format(d); }
export function daysSince(date?:string){ if(!date)return 0; const d=new Date(`${date}T00:00:00`); return Number.isNaN(d.getTime())?0:Math.max(0,Math.floor((Date.now()-d.getTime())/86400000)); }
export function downloadCSV(filename:string, rows:Record<string,unknown>[]){ if(!rows.length){ alert("Não há dados para exportar."); return; } const headers=Object.keys(rows[0]); const esc=(v:unknown)=>`"${String(v ?? "").replace(/"/g,'""')}"`; const csv="\ufeff"+[headers.map(esc).join(";") , ...rows.map(r=>headers.map(h=>esc(r[h])).join(";"))].join("\n"); const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); URL.revokeObjectURL(a.href); }

interface Store {
 products:Product[]; sales:Sale[]; users:User[]; movements:StockMovement[];
 addProduct:(input:Omit<Product,"id"|"totalBought"|"totalSold"|"daysSinceLastSale"|"status">)=>Product;
 updateProduct:(id:string,patch:Partial<Product>)=>void; deactivateProduct:(id:string)=>void; addStock:(id:string,quantity:number,entryDate?:string,userId?:string)=>void;
 registerSale:(args:{sellerId:string; items:{productId:string; quantity:number}[]; paymentMethod:PaymentMethod; discountPercent:number; overridePassword?:string})=>{ok:boolean; message:string; sales:Sale[]};
 cancelSale:(saleId:string,userId:string)=>void; addUser:(input:Omit<User,"id"|"createdAt">)=>User; updateUser:(id:string,patch:Partial<User>)=>void;
 resetAll:()=>void;
 discountOverridePassword:string; setDiscountOverridePassword:(password:string)=>void; verifyDiscountOverridePassword:(password:string)=>boolean;
}
const Ctx=createContext<Store|null>(null);

export function DataProvider({children}:{children:React.ReactNode}){
 const [products,setProducts]=useState<Product[]>(()=>load(KEYS.products,migrateDates(seedProducts.map(p=>({...p}))),LEGACY_KEYS.products,migrateDates));
 const [sales,setSales]=useState<Sale[]>(()=>load(KEYS.sales,migrateDates(seedSales.map(s=>({...s}))),LEGACY_KEYS.sales,migrateDates));
 const [users,setUsers]=useState<User[]>(()=>load(KEYS.users,migrateDates(seedUsers.map(u=>({...u}))),LEGACY_KEYS.users,migrateDates));
 const [movements,setMovements]=useState<StockMovement[]>(()=>load(KEYS.movements,migrateDates(seedMovements.map(m=>({...m}))),LEGACY_KEYS.movements,migrateDates));
 const [discountOverridePassword,setDiscountOverridePassword]=useState<string>(()=>load(KEYS.discountPassword,""));
 useEffect(()=>localStorage.setItem(KEYS.products,JSON.stringify(products)),[products]); useEffect(()=>localStorage.setItem(KEYS.sales,JSON.stringify(sales)),[sales]); useEffect(()=>localStorage.setItem(KEYS.users,JSON.stringify(users)),[users]); useEffect(()=>localStorage.setItem(KEYS.movements,JSON.stringify(movements)),[movements]); useEffect(()=>localStorage.setItem(KEYS.discountPassword,discountOverridePassword),[discountOverridePassword]);
 const value=useMemo<Store>(()=>({products,sales,users,movements,discountOverridePassword,setDiscountOverridePassword:(password:string)=>setDiscountOverridePassword(password),verifyDiscountOverridePassword:(password:string)=>!!discountOverridePassword && password===discountOverridePassword,
  addProduct(input){const p:Product={...input,id:id("p"),totalBought:Number(input.stock||0),totalSold:0,daysSinceLastSale:0,status:"Ativo"}; setProducts(x=>[...x,p]); if(p.stock>0){const n=nowParts(); setMovements(x=>[{id:id("m"),date:p.entryDate,time:n.time,weekday:n.weekday,type:"Entrada",productId:p.id,productName:p.name,quantity:p.stock,value:p.cost*p.stock,userId:"system",userName:"Sistema",notes:"Estoque inicial"},...x]);} return p;},
  updateProduct(id,patch){setProducts(x=>x.map(p=>p.id===id?{...p,...patch}:p));},
  deactivateProduct(id){setProducts(x=>x.map(p=>p.id===id?{...p,status:"Inativo"}:p));},
  addStock(pid,qty,entryDate){if(!Number.isFinite(qty)||qty<=0)return; const p=products.find(x=>x.id===pid); if(!p)return; const n=nowParts(); setProducts(x=>x.map(q=>q.id===pid?{...q,stock:q.stock+qty,totalBought:q.totalBought+qty,lastEntry:entryDate||n.iso,entryDate:q.entryDate||entryDate||n.iso}:q)); setMovements(x=>[{id:id("m"),date:entryDate||n.iso,time:n.time,weekday:n.weekday,type:"Entrada",productId:pid,productName:p.name,quantity:qty,value:p.cost*qty,userId:"system",userName:"Administrador"},...x]);},
  registerSale({sellerId,items,paymentMethod,discountPercent,overridePassword}){
    const seller=users.find(u=>u.id===sellerId);
    if(!seller)return{ok:false,message:"Vendedor não encontrado.",sales:[]};
    if(!Number.isFinite(discountPercent)||discountPercent<0||discountPercent>100)return{ok:false,message:"Percentual de desconto inválido.",sales:[]};
    if(discountPercent>20){
      if(!discountOverridePassword)return{ok:false,message:"O administrador ainda não definiu a senha para descontos acima de 20%.",sales:[]};
      if(overridePassword!==discountOverridePassword)return{ok:false,message:"Senha de autorização para desconto acima de 20% inválida.",sales:[]};
    }
    for(const i of items){const p=products.find(x=>x.id===i.productId); if(!p)return{ok:false,message:"Produto não encontrado.",sales:[]}; if(i.quantity<=0||i.quantity>p.stock)return{ok:false,message:`Estoque insuficiente para ${p.name}. Disponível: ${p.stock}.`,sales:[]};}
    const subtotal=items.reduce((sum,i)=>{const p=products.find(x=>x.id===i.productId)!;return sum+p.price*i.quantity;},0);
    const totalDiscount=subtotal*(discountPercent/100);
    const n=nowParts();
    const created:Sale[]=items.map(i=>{const p=products.find(x=>x.id===i.productId)!; const original=p.price*i.quantity; const itemDiscount=subtotal?totalDiscount*(original/subtotal):0; const final=original-itemDiscount; const cost=p.cost*i.quantity; return{id:id("v"),date:n.date,time:n.time,weekday:n.weekday,sellerId,sellerName:seller.name,productId:p.id,productName:p.name,productSku:p.sku,category:p.category,quantity:i.quantity,originalPrice:p.price,discount:Number(itemDiscount.toFixed(2)),finalPrice:Number(final.toFixed(2)),cost,profit:Number((final-cost).toFixed(2)),paymentMethod,status:"Concluída"};});
    setSales(x=>[...created,...x]); setProducts(x=>x.map(p=>{const sold=created.filter(s=>s.productId===p.id).reduce((a,s)=>a+s.quantity,0); return sold?{...p,stock:p.stock-sold,totalSold:p.totalSold+sold,lastSale:n.iso,daysSinceLastSale:0}:{...p,daysSinceLastSale:p.lastSale?daysSince(p.lastSale):daysSince(p.entryDate)};})); setMovements(x=>[...created.map(s=>({id:id("m"),date:n.iso,time:n.time,weekday:n.weekday,type:"Saída" as const,productId:s.productId,productName:s.productName,quantity:s.quantity,value:s.finalPrice,userId:sellerId,userName:seller.name,notes:`Venda ${s.id}`})),...x]); return{ok:true,message:"Venda registrada com sucesso.",sales:created};},
  cancelSale(saleId,userId){const s=sales.find(x=>x.id===saleId&&x.status==="Concluída"); if(!s)return; const n=nowParts(); setSales(x=>x.map(q=>q.id===saleId?{...q,status:"Cancelada"}:q)); setProducts(x=>x.map(p=>p.id===s.productId?{...p,stock:p.stock+s.quantity,totalSold:Math.max(0,p.totalSold-s.quantity)}:p)); setMovements(x=>[{id:id("m"),date:n.iso,time:n.time,weekday:n.weekday,type:"Estorno",productId:s.productId,productName:s.productName,quantity:s.quantity,value:s.finalPrice,userId,userName:"Administrador",notes:`Estorno da venda ${saleId}`},...x]);},
  addUser(input){const u:User={...input,id:id("u"),createdAt:nowParts().iso}; setUsers(x=>[...x,u]); return u;}, updateUser(uid,patch){setUsers(x=>x.map(u=>u.id===uid?{...u,...patch}:u));},
  resetAll(){setProducts(migrateDates(seedProducts.map(p=>({...p}))));setSales(migrateDates(seedSales.map(s=>({...s}))));setUsers(migrateDates(seedUsers.map(u=>({...u}))));setMovements(migrateDates(seedMovements.map(m=>({...m}))));}
 }),[products,sales,users,movements,discountOverridePassword]);
 return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useStore(){const c=useContext(Ctx);if(!c)throw new Error("useStore deve ser usado dentro de DataProvider");return c;}
export function useProducts(){const s=useStore();return {products:s.products,addProduct:s.addProduct,updateProduct:s.updateProduct,deactivateProduct:s.deactivateProduct,addStock:s.addStock,resetProducts:()=>s.resetAll()};}
