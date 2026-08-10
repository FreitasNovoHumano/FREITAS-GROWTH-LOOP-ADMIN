"use client";

import { Check, LoaderCircle, Save, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { EmbedConfigurationFields } from "@/components/campaigns/embed-configuration-fields";
import type { EmbedConfiguration } from "@/lib/embed-config";

type EmbedConfigurationEditorProps = {
  campaignId: string;
  primaryColor: string;
  accentColor: string;
  initialConfiguration: EmbedConfiguration;
};

export function EmbedConfigurationEditor({
  campaignId,
  primaryColor,
  accentColor,
  initialConfiguration,
}: EmbedConfigurationEditorProps) {
  const [configuration, setConfiguration] = useState(initialConfiguration);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  function set<Key extends keyof EmbedConfiguration>(
    key: Key,
    value: EmbedConfiguration[Key],
  ) {
    setConfiguration((current) => ({ ...current, [key]: value }));
    setFeedback(null);
  }

  async function save() {
    setSaving(true);
    setFeedback(null);

    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(configuration),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.error || "Não foi possível salvar o widget.");
      }
      setFeedback({
        type: "success",
        message: "Widget atualizado. O script instalado já usará a nova configuração.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar o widget.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel embed-configurator" aria-labelledby="embed-config-title">
      <div className="embed-configurator-heading">
        <span className="embed-icon">
          <SlidersHorizontal aria-hidden="true" />
        </span>
        <div>
          <span className="eyebrow">PERSONALIZAÇÃO POR CAMPANHA</span>
          <h2 id="embed-config-title">Aparência e comportamento do widget</h2>
          <p>
            Personalize o botão sem alterar o script já instalado no site.
          </p>
        </div>
      </div>

      <EmbedConfigurationFields
        value={configuration}
        primaryColor={primaryColor}
        accentColor={accentColor}
        onChange={set}
      />

      <div className="embed-configurator-footer">
        <button
          type="button"
          className="button primary"
          disabled={saving}
          onClick={() => void save()}
        >
          {saving ? (
            <LoaderCircle className="spin" aria-hidden="true" />
          ) : (
            <Save aria-hidden="true" />
          )}
          {saving ? "Salvando..." : "Salvar widget"}
        </button>
        {feedback && (
          <p
            className={`embed-config-feedback ${feedback.type}`}
            role={feedback.type === "error" ? "alert" : "status"}
          >
            {feedback.type === "success" && <Check aria-hidden="true" />}
            {feedback.message}
          </p>
        )}
      </div>
    </section>
  );
}
