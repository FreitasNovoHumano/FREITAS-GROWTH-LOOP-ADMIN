import { z } from "zod";

export const emailTemplateKeys = [
  "WELCOME_INITIAL_REWARD",
  "REFERRAL_INVITE",
  "PARTICIPANT_PROGRESS",
  "REWARD_UNLOCKED",
] as const;

export type EmailTemplateKey = (typeof emailTemplateKeys)[number];

export type EditableEmailTemplate = {
  key: EmailTemplateKey;
  subject: string;
  title: string;
  body: string;
  buttonText: string;
  buttonUrl: string;
  active: boolean;
};

type TemplateDefinition = {
  name: string;
  description: string;
  trigger: string;
  variables: readonly string[];
  linkVariables: readonly string[];
  defaults: EditableEmailTemplate;
};

export const emailTemplateDefinitions: Record<EmailTemplateKey, TemplateDefinition> = {
  WELCOME_INITIAL_REWARD: {
    name: "Boas-vindas e recompensa inicial",
    description: "Enviado após o cadastro",
    trigger: "Participante cadastrado",
    variables: ["participant_name", "campaign_name", "initial_reward_title", "initial_reward_link"],
    linkVariables: ["initial_reward_link"],
    defaults: {
      key: "WELCOME_INITIAL_REWARD",
      subject: "Bem-vindo ao {{campaign_name}}",
      title: "Olá, {{participant_name}}!",
      body: "Seu cadastro foi concluído. A recompensa {{initial_reward_title}} já está disponível.",
      buttonText: "Acessar recompensa",
      buttonUrl: "{{initial_reward_link}}",
      active: true,
    },
  },
  REFERRAL_INVITE: {
    name: "Convite de indicação",
    description: "Enviado ao amigo convidado",
    trigger: "Convite criado",
    variables: ["participant_name", "campaign_name", "referral_link"],
    linkVariables: ["referral_link"],
    defaults: {
      key: "REFERRAL_INVITE",
      subject: "{{participant_name}} convidou você",
      title: "Você recebeu um convite",
      body: "{{participant_name}} convidou você para participar da campanha {{campaign_name}}.",
      buttonText: "Aceitar convite",
      buttonUrl: "{{referral_link}}",
      active: true,
    },
  },
  PARTICIPANT_PROGRESS: {
    name: "Progresso do participante",
    description: "Celebra cada indicação qualificada",
    trigger: "Indicação qualificada",
    variables: ["participant_name", "campaign_name", "qualified_referrals", "referral_goal", "referral_link"],
    linkVariables: ["referral_link"],
    defaults: {
      key: "PARTICIPANT_PROGRESS",
      subject: "Seu progresso em {{campaign_name}}",
      title: "Mais uma indicação qualificada!",
      body: "{{participant_name}}, você já tem {{qualified_referrals}} de {{referral_goal}} indicações qualificadas.",
      buttonText: "Continuar indicando",
      buttonUrl: "{{referral_link}}",
      active: true,
    },
  },
  REWARD_UNLOCKED: {
    name: "Recompensa desbloqueada",
    description: "Confirma o marco de três indicações",
    trigger: "Meta atingida",
    variables: ["participant_name", "campaign_name", "reward_name", "reward_link"],
    linkVariables: ["reward_link"],
    defaults: {
      key: "REWARD_UNLOCKED",
      subject: "Você desbloqueou uma recompensa",
      title: "Parabéns, {{participant_name}}!",
      body: "Você atingiu a meta da campanha {{campaign_name}} e desbloqueou {{reward_name}}.",
      buttonText: "Acessar recompensa",
      buttonUrl: "{{reward_link}}",
      active: true,
    },
  },
};

export const emailTemplateKeySchema = z.enum(emailTemplateKeys);

const templateInputBaseSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  title: z.string().trim().min(2).max(160),
  body: z.string().trim().min(3).max(8000),
  buttonText: z.string().trim().max(80),
  buttonUrl: z.string().trim().max(500),
  active: z.boolean(),
});

const variablePattern = /\{\{\s*([a-z_]+)\s*\}\}/g;

export function templateInputSchema(key: EmailTemplateKey) {
  const definition = emailTemplateDefinitions[key];
  return templateInputBaseSchema.superRefine((input, context) => {
    const values = [input.subject, input.title, input.body, input.buttonText, input.buttonUrl];
    for (const value of values) {
      for (const match of value.matchAll(variablePattern)) {
        if (!definition.variables.includes(match[1])) {
          context.addIssue({
            code: "custom",
            message: `A variável {{${match[1]}}} não está disponível para este gatilho.`,
          });
        }
      }
    }

    if (input.buttonText && !input.buttonUrl) {
      context.addIssue({ code: "custom", path: ["buttonUrl"], message: "Informe o destino do botão." });
    }
    if (!input.buttonText && input.buttonUrl) {
      context.addIssue({ code: "custom", path: ["buttonText"], message: "Informe o texto do botão." });
    }
    if (input.buttonUrl) {
      const variable = input.buttonUrl.match(/^\{\{\s*([a-z_]+)\s*\}\}$/)?.[1];
      const safeAbsoluteUrl = /^https:\/\//i.test(input.buttonUrl);
      if ((!variable || !definition.linkVariables.includes(variable)) && !safeAbsoluteUrl) {
        context.addIssue({
          code: "custom",
          path: ["buttonUrl"],
          message: "Use uma variável de link permitida ou uma URL HTTPS.",
        });
      }
    }
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function serializeTemplate(template: EditableEmailTemplate) {
  const metadata = Buffer.from(JSON.stringify({
    version: 1,
    title: template.title,
    body: template.body,
    buttonText: template.buttonText,
    buttonUrl: template.buttonUrl,
  })).toString("base64url");
  const button = template.buttonText && template.buttonUrl
    ? `<p><a href="${escapeHtml(template.buttonUrl)}">${escapeHtml(template.buttonText)}</a></p>`
    : "";
  return `<!--fgl-template:${metadata}--><h1>${escapeHtml(template.title)}</h1><p>${escapeHtml(template.body).replaceAll("\n", "<br>")}</p>${button}`;
}

export function hydrateTemplate(
  key: EmailTemplateKey,
  stored?: { subject: string; html: string; active: boolean } | null,
): EditableEmailTemplate {
  if (!stored) return emailTemplateDefinitions[key].defaults;
  const metadata = stored.html.match(/^<!--fgl-template:([A-Za-z0-9_-]+)-->/)?.[1];
  if (!metadata) return { ...emailTemplateDefinitions[key].defaults, subject: stored.subject, active: stored.active };
  try {
    const parsed = JSON.parse(Buffer.from(metadata, "base64url").toString("utf8")) as Partial<EditableEmailTemplate>;
    const parsedInput = templateInputSchema(key).parse({
      subject: stored.subject,
      title: parsed.title,
      body: parsed.body,
      buttonText: parsed.buttonText ?? "",
      buttonUrl: parsed.buttonUrl ?? "",
      active: stored.active,
    });
    return { key, ...parsedInput };
  } catch {
    return { ...emailTemplateDefinitions[key].defaults, subject: stored.subject, active: stored.active };
  }
}
