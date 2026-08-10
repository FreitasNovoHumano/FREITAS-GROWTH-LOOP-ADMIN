"use client";

import {
  ArrowRight,
  Gift,
  Heart,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import {
  embedAnimations,
  embedButtonIcons,
  embedButtonStyles,
  embedPositions,
  type EmbedConfiguration,
} from "@/lib/embed-config";

const iconLabels = {
  none: "Sem ícone",
  sparkles: "Destaque",
  gift: "Presente",
  users: "Pessoas",
  heart: "Coração",
  "arrow-right": "Seta",
} as const;

const styleLabels = {
  solid: "Sólido",
  gradient: "Gradiente",
  outline: "Contorno",
  glass: "Glass",
} as const;

const positionLabels = {
  "bottom-right": "Inferior direita",
  "bottom-left": "Inferior esquerda",
  "top-right": "Superior direita",
  "top-left": "Superior esquerda",
} as const;

const animationLabels = {
  fade: "Fade suave",
  slide: "Deslizar",
  pulse: "Pulso discreto",
  none: "Sem animação",
} as const;

const iconComponents = {
  none: null,
  sparkles: Sparkles,
  gift: Gift,
  users: Users,
  heart: Heart,
  "arrow-right": ArrowRight,
} as const;

type EmbedConfigurationFieldsProps = {
  value: EmbedConfiguration;
  primaryColor?: string;
  accentColor?: string;
  onChange: <Key extends keyof EmbedConfiguration>(
    key: Key,
    value: EmbedConfiguration[Key],
  ) => void;
};

export function EmbedConfigurationFields({
  value,
  primaryColor = "#7c3aed",
  accentColor = "#c4b5fd",
  onChange,
}: EmbedConfigurationFieldsProps) {
  const Icon = iconComponents[value.embedButtonIcon];

  return (
    <div className="embed-config-layout">
      <fieldset className="embed-config-fields">
        <legend className="sr-only">Configuração do botão de campanha</legend>
        <label className="full">
          Texto do botão
          <input
            required
            maxLength={60}
            value={value.embedButtonLabel}
            onChange={(event) =>
              onChange("embedButtonLabel", event.target.value)
            }
          />
        </label>
        <label>
          Ícone
          <select
            value={value.embedButtonIcon}
            onChange={(event) =>
              onChange(
                "embedButtonIcon",
                event.target.value as EmbedConfiguration["embedButtonIcon"],
              )
            }
          >
            {embedButtonIcons.map((icon) => (
              <option key={icon} value={icon}>
                {iconLabels[icon]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Estilo visual
          <select
            value={value.embedButtonStyle}
            onChange={(event) =>
              onChange(
                "embedButtonStyle",
                event.target.value as EmbedConfiguration["embedButtonStyle"],
              )
            }
          >
            {embedButtonStyles.map((style) => (
              <option key={style} value={style}>
                {styleLabels[style]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Posição na tela
          <select
            value={value.embedPosition}
            onChange={(event) =>
              onChange(
                "embedPosition",
                event.target.value as EmbedConfiguration["embedPosition"],
              )
            }
          >
            {embedPositions.map((position) => (
              <option key={position} value={position}>
                {positionLabels[position]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tempo para aparecer
          <span className="embed-delay-field">
            <input
              type="number"
              min={0}
              max={30}
              step={0.5}
              value={value.embedDelayMs / 1000}
              onChange={(event) =>
                onChange(
                  "embedDelayMs",
                  Math.round(Number(event.target.value) * 1000),
                )
              }
            />
            <span>segundos</span>
          </span>
        </label>
        <label>
          Animação
          <select
            value={value.embedAnimation}
            onChange={(event) =>
              onChange(
                "embedAnimation",
                event.target.value as EmbedConfiguration["embedAnimation"],
              )
            }
          >
            {embedAnimations.map((animation) => (
              <option key={animation} value={animation}>
                {animationLabels[animation]}
              </option>
            ))}
          </select>
        </label>
        <label className="embed-toggle full">
          <input
            type="checkbox"
            checked={value.embedInitiallyExpanded}
            onChange={(event) =>
              onChange("embedInitiallyExpanded", event.target.checked)
            }
          />
          <span>
            <strong>Iniciar expandido</strong>
            <small>
              Abre a experiência automaticamente depois do tempo configurado.
            </small>
          </span>
        </label>
      </fieldset>

      <div>
        <span className="eyebrow">PRÉVIA DO WIDGET</span>
        <div
          className="embed-widget-preview"
          data-position={value.embedPosition}
          style={
            {
              "--embed-primary": primaryColor,
              "--embed-accent": accentColor,
            } as React.CSSProperties
          }
        >
          {value.embedInitiallyExpanded && (
            <div className="embed-widget-preview-dialog">
              <span>Experiência da campanha</span>
              <X aria-hidden="true" />
            </div>
          )}
          <span
            className={`embed-widget-preview-button is-${value.embedButtonStyle}`}
          >
            {Icon && <Icon aria-hidden="true" />}
            {value.embedButtonLabel || "Participar agora"}
          </span>
        </div>
        <small className="field-help">
          A página onde o script está instalado recebe as mudanças
          automaticamente.
        </small>
      </div>
    </div>
  );
}
