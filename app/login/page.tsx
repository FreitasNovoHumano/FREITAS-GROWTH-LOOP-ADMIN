"use client";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export default function LoginPage() {
  function handleGoogleSignIn() {
    const callbackUrl = new URLSearchParams(window.location.search).get("callbackUrl") ?? "/dashboard";
    void signIn("google", { callbackUrl });
  }

  return <main className="login-shell">
    <section className="login-story">
      <div className="brand"><span className="brand-mark"><Image src="/freitas-loop.png" alt="Freitas Growth Loop" width={38} height={38} priority/></span><span>Freitas Growth <b>Loop</b></span></div>
      <div className="login-copy"><span className="eyebrow"><Sparkles size={14}/> CRESCIMENTO QUE SE MULTIPLICA</span><h1>Transforme clientes em seu melhor canal de aquisição.</h1><p>Crie campanhas de indicação, acompanhe leads qualificados e recompense quem impulsiona o seu crescimento.</p></div>
      <div className="trust-row"><span><ShieldCheck/> Dados isolados por empresa</span><span>LGPD ready</span></div>
    </section>
    <section className="login-panel"><div className="login-card"><span className="mini-logo"><Image src="/freitas-loop.png" alt="Freitas Growth Loop" width={54} height={54} priority/></span><h2>Bem-vindo ao Growth Loop</h2><p>Entre com a mesma conta usada na Freitas Growth AI.</p><button className="google-button" onClick={handleGoogleSignIn}><span className="google-g">G</span> Continuar com Google <ArrowRight size={18}/></button><small>Ao continuar, você concorda com os Termos de Uso e a Política de Privacidade.</small></div></section>
  </main>;
}
