import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmt } from "../data/mockData";
import { downloadCSV, useStore } from "../data/store";

const PERIODS = ["Hoje", "Semana", "Mês", "Ano"];
const parseDate = (s:string) => { const [d,m,y]=s.split("/").map(Number); return new Date(y,m-1,d); };
const startOf = (period:string) => { const d=new Date(); d.setHours(0,0,0,0); if(period==="Hoje") return d; if(period==="Semana"){ const day=d.getDay()||7; d.setDate(d.getDate()-day+1); return d; } if(period==="Mês"){ d.setDate(1); return d; } d.setMonth(0,1); return d; };
export default function Financeiro(){
 const {sales}=useStore(); const [period,setPeriod]=useState("Hoje");
 const list=useMemo(()=>sales.filter(s=>s.status==="Concluída"&&parseDate(s.date)>=startOf(period)),[sales,period]);
 const revenue=list.reduce((a,s)=>a+s.finalPrice,0), cost=list.reduce((a,s)=>a+s.cost,0), profit=list.reduce((a,s)=>a+s.profit,0), discounts=list.reduce((a,s)=>a+s.discount,0);
 const chart=useMemo(()=>Array.from({length:7},(_,i)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-6+i);const key=d.toLocaleDateString("pt-BR");const day=sales.filter(s=>s.status==="Concluída"&&s.date===key);return {dia:key.slice(0,5),faturamento:day.reduce((a,s)=>a+s.finalPrice,0),lucro:day.reduce((a,s)=>a+s.profit,0)};}),[sales]);
 return <div style={{padding:"28px 32px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:12}}><div><h1 style={{fontSize:22,fontWeight:800,color:"#0F172A",margin:0}}>Financeiro</h1><p style={{color:"#64748B",fontSize:13.5,margin:"4px 0 0"}}>Resultados calculados a partir das vendas registradas</p></div><div style={{display:"flex",gap:10}}><div className="pill-tabs">{PERIODS.map(p=><button key={p} className={`pill-tab${period===p?" active":""}`} onClick={()=>setPeriod(p)}>{p}</button>)}</div><button className="btn btn-secondary btn-sm" onClick={()=>downloadCSV("financeiro.csv",list.map(s=>({Data:s.date,Horario:s.time,Vendedor:s.sellerName,Produto:s.productName,Faturamento:s.finalPrice,Custo:s.cost,Desconto:s.discount,Lucro:s.profit,Pagamento:s.paymentMethod}))) }>Exportar</button></div></div>
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:14,marginBottom:24}}>{[["Faturamento",revenue,"#2563EB"],["Custos",cost,"#DC2626"],["Descontos",discounts,"#CA8A04"],["Lucro Bruto",profit,"#16A34A"],["Vendas",list.length,"#0F172A"]].map(([l,v,c])=><div className="kpi-card" key={String(l)}><div className="kpi-label">{l}</div><div className="kpi-value" style={{color:String(c),fontSize:20}}>{typeof v==="number"&&l!=="Vendas"?fmt(v):v}</div></div>)}</div>
 <div className="card" style={{padding:20}}><div style={{fontSize:14,fontWeight:700,marginBottom:16}}>Faturamento e lucro — últimos 7 dias</div><ResponsiveContainer width="100%" height={300}><BarChart data={chart}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="dia"/><YAxis/><Tooltip formatter={(v:any)=>fmt(Number(v))}/><Bar dataKey="faturamento" fill="#2563EB" radius={[4,4,0,0]} name="Faturamento"/><Bar dataKey="lucro" fill="#16A34A" radius={[4,4,0,0]} name="Lucro"/></BarChart></ResponsiveContainer></div></div>;
}
