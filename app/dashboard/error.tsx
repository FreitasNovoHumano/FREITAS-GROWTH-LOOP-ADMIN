"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="panel error-state" role="alert">
      <AlertTriangle aria-hidden="true" />
      <h1>Não foi possível carregar os dados do Growth Loop.</h1>
      <p>Tente novamente. Se o problema continuar, contate o suporte.</p>
      <button className="button primary" type="button" onClick={reset}>
        <RefreshCw size={17} aria-hidden="true" />
        Tentar novamente
      </button>
    </section>
  );
}
