"use client";

import { BookOpen, Check, Code2, Copy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function EmbedScriptActions({
  campaignStatus,
  script,
}: {
  campaignStatus: string;
  script: string;
}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function copyScript() {
    setError("");
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Não foi possível copiar. Selecione o código manualmente.");
    }
  }

  return (
    <section className="panel embed-panel">
      <div className="embed-panel-copy">
        <span className="embed-icon"><Code2 aria-hidden="true" /></span>
        <div>
          <h2>Script de embed</h2>
          <p>
            Adicione este script à Freitas Growth AI, de preferência antes do
            fechamento da tag <code>&lt;/body&gt;</code>.
          </p>
          {campaignStatus !== "ACTIVE" && (
            <p className="embed-warning" role="status">
              O widget só aparecerá depois que esta campanha for publicada.
            </p>
          )}
        </div>
      </div>
      <pre className="embed-code"><code>{script}</code></pre>
      <div className="embed-actions">
        <button className="button primary" type="button" onClick={copyScript}>
          {copied ? (
            <Check size={17} aria-hidden="true" />
          ) : (
            <Copy size={17} aria-hidden="true" />
          )}
          {copied ? "Script copiado" : "Copiar script"}
        </button>
        <Link className="button secondary" href="#tutorial-embed">
          <BookOpen size={17} aria-hidden="true" />
          Ver tutorial
        </Link>
      </div>
      <span className="sr-only" aria-live="polite">
        {copied ? "Script copiado para a área de transferência." : error}
      </span>
      {error && <p className="form-error" role="alert">{error}</p>}
    </section>
  );
}
