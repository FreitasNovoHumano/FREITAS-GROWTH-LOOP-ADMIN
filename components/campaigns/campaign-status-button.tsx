"use client";

import { useState } from "react";

export function CampaignStatusButton({
  campaignId,
  status,
}: {
  campaignId: string;
  status: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const nextStatus = status === "ACTIVE" ? "PAUSED" : "ACTIVE";

  async function updateStatus() {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Não foi possível atualizar a campanha.");
      }
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erro inesperado.");
      setSubmitting(false);
    }
  }

  return (
    <span className="campaign-admin-action">
      <button type="button" disabled={submitting} onClick={updateStatus}>
        {submitting
          ? "Atualizando..."
          : status === "ACTIVE"
            ? "Pausar"
            : "Ativar"}
      </button>
      {error && (
        <small role="alert" aria-live="polite">
          {error}
        </small>
      )}
    </span>
  );
}
