"use client";

import { Check, Copy, ExternalLink, MessageCircle } from "lucide-react";
import { useState } from "react";

export function PublicLinkActions({
  path,
  campaignName,
}: {
  path: string;
  campaignName: string;
}) {
  const [copied, setCopied] = useState(false);
  const absoluteUrl = () => new URL(path, window.location.origin).toString();

  async function copyLink() {
    await navigator.clipboard.writeText(absoluteUrl());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function shareOnWhatsApp() {
    const text = `Conheça a campanha ${campaignName}: ${absoluteUrl()}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div className="public-link-actions">
      <button className="button secondary" type="button" onClick={copyLink}>
        {copied ? (
          <Check size={17} aria-hidden="true" />
        ) : (
          <Copy size={17} aria-hidden="true" />
        )}
        {copied ? "Link copiado" : "Copiar link"}
      </button>
      <a
        className="button secondary"
        href={path}
        target="_blank"
        rel="noreferrer"
      >
        <ExternalLink size={17} aria-hidden="true" />
        Abrir
      </a>
      <button
        className="button secondary"
        type="button"
        onClick={shareOnWhatsApp}
      >
        <MessageCircle size={17} aria-hidden="true" />
        WhatsApp
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Link copiado para a área de transferência." : ""}
      </span>
    </div>
  );
}
