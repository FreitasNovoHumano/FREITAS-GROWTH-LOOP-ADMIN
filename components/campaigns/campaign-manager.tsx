"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, MoreHorizontal, Plus, Search, Users } from "lucide-react";

type Campaign = { id:string; name:string; slug:string; status:string; description?:string; qualifiedReferralGoal:number; _count:{participants:number;leads:number;referrals:number} };
export function CampaignManager() {
  const [items,setItems]=useState<Campaign[]>([]); const [loading,setLoading]=useState(true); const [query,setQuery]=useState("");
  const load=()=>fetch("/api/admin/campaigns").then(r=>r.json()).then(v=>setItems(Array.isArray(v)?v:[])).finally(()=>setLoading(false));
  useEffect(()=>{ void load(); },[]);
  const filtered=items.filter(i=>i.name.toLowerCase().includes(query.toLowerCase()));
  return <><div className="toolbar"><label className="search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar campanha..."/></label><select aria-label="Status"><option>Todos os status</option><option>Ativa</option><option>Rascunho</option></select></div><section className="campaign-grid">{loading?<div className="empty">Carregando campanhas...</div>:filtered.map(c=><article className="campaign-card" key={c.id}><div className="campaign-cover"><span className="status active">{c.status}</span><button aria-label="Mais opções"><MoreHorizontal/></button><strong>{c.name.slice(0,2).toUpperCase()}</strong></div><div className="campaign-content"><h2>{c.name}</h2><p>{c.description||"Campanha de indicação Growth Loop"}</p><div className="campaign-stats"><span><Users/> <strong>{c._count.participants}</strong><small>Participantes</small></span><span><ExternalLink/> <strong>{c._count.referrals}</strong><small>Indicações</small></span></div><div className="card-actions"><Link href={`/growth-loop/${c.slug}`} target="_blank">Abrir página</Link><button onClick={async()=>{await fetch(`/api/admin/campaigns/${c.id}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({status:c.status==="ACTIVE"?"PAUSED":"ACTIVE"})});load()}}>{c.status==="ACTIVE"?"Pausar":"Ativar"}</button></div></div></article>)}{!loading&&!filtered.length&&<div className="empty"><Plus/><h3>Crie seu primeiro loop</h3><p>Uma campanha bem desenhada transforma cada cliente em um canal de aquisição.</p><Link className="button primary" href="/dashboard/campaigns/new">Nova campanha</Link></div>}</section></>;
}
