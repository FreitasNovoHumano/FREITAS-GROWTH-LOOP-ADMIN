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
  whatsappEnabled: boolean;
  whatsappMessage: string;
};

type TemplateDefinition = {
  name: string;
  description: string;
  trigger: string;
  supportsWhatsApp: boolean;
  variables: readonly string[];
  linkVariables: readonly string[];
  defaults: EditableEmailTemplate;
};

export const emailTemplateDefinitions: Record<EmailTemplateKey, TemplateDefinition> = {
  WELCOME_INITIAL_REWARD: {
    name: "Boas-vindas e recompensa inicial",
    description: "Enviado após o cadastro",
    trigger: "Participante cadastrado",
    supportsWhatsApp: false,
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
      whatsappEnabled: false,
      whatsappMessage: "",
    },
  },
  REFERRAL_INVITE: {
    name: "Convite de indicação",
    description: "Enviado ao amigo convidado",
    trigger: "Convite criado",
    supportsWhatsApp: true,
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
      whatsappEnabled: false,
      whatsappMessage: "Olá! 👋\n\n{{participant_name}} convidou você para participar da campanha {{campaign_name}}.\n\nAcesse pelo link:\n{{referral_link}}\n\nMensagem enviada pelo Freitas Growth Loop.",
    },
  },
  PARTICIPANT_PROGRESS: {
    name: "Progresso do participante",
    description: "Celebra cada indicação qualificada",
    trigger: "Indicação qualificada",
    supportsWhatsApp: true,
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
      whatsappEnabled: false,
      whatsappMessage: "Olá, {{participant_name}}! 🚀\n\nMais uma indicação sua foi qualificada na campanha {{campaign_name}}.\n\nSeu progresso: {{qualified_referrals}} de {{referral_goal}} indicações.\n\nContinue compartilhando seu convite para desbloquear sua recompensa.",
    },
  },
  REWARD_UNLOCKED: {
    name: "Recompensa desbloqueada",
    description: "Confirma o marco de três indicações",
    trigger: "Meta atingida",
    supportsWhatsApp: true,
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
      whatsappEnabled: false,
      whatsappMessage: "Parabéns, {{participant_name}}! 🎉\n\nVocê atingiu a meta da campanha {{campaign_name}}.\n\nSua recompensa foi desbloqueada: {{reward_name}}.\n\nAcesse sua página para conferir os detalhes:\n{{reward_link}}",
    },
  },
};

export const emailTemplateKeySchema = z.enum(emailTemplateKeys);

const variablePattern = /\{\{\s*([a-z_]+)\s*\}\}/g;

export function templateVariables(value: string) {
  return [...value.matchAll(variablePattern)].map((match) => match[1]);
}

const templateInputBaseSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  title: z.string().trim().min(2).max(160),
  body: z.string().trim().min(3).max(8000),
  buttonText: z.string().trim().max(80),
  buttonUrl: z.string().trim().max(500),
  active: z.boolean(),
  whatsappEnabled: z.boolean().default(false),
  whatsappMessage: z.string().trim().max(4000).default(""),
});

export function templateInputSchema(key: EmailTemplateKey) {
  const definition = emailTemplateDefinitions[key];
  return templateInputBaseSchema.superRefine((input, context) => {
    const values = [input.subject, input.title, input.body, input.buttonText, input.buttonUrl, input.whatsappMessage];
    for (const value of values) {
      for (const variable of templateVariables(value)) {
        if (!definition.variables.includes(variable)) {
          context.addIssue({ code: "custom", message: `A variável {{${variable}}} não está disponível para este gatilho.` });
        }
      }
    }
    if (input.buttonText && !input.buttonUrl) context.addIssue({ code: "custom", path: ["buttonUrl"], message: "Informe o destino do botão." });
    if (!input.buttonText && input.buttonUrl) context.addIssue({ code: "custom", path: ["buttonText"], message: "Informe o texto do botão." });
    if (input.buttonUrl) {
      const variable = input.buttonUrl.match(/^\{\{\s*([a-z_]+)\s*\}\}$/)?.[1];
      if ((!variable || !definition.linkVariables.includes(variable)) && !/^https:\/\//i.test(input.buttonUrl)) {
        context.addIssue({ code: "custom", path: ["buttonUrl"], message: "Use uma variável de link permitida ou uma URL HTTPS." });
      }
    }
    if (!definition.supportsWhatsApp && input.whatsappEnabled) {
      context.addIssue({ code: "custom", path: ["whatsappEnabled"], message: "WhatsApp não está disponível para este gatilho." });
    }
    if (input.whatsappEnabled && !input.whatsappMessage) {
      context.addIssue({ code: "custom", path: ["whatsappMessage"], message: "Informe a mensagem do WhatsApp." });
    }
  });
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export function serializeTemplate(template: EditableEmailTemplate) {
  const metadata = Buffer.from(JSON.stringify({
    version: 2,
    title: template.title,
    body: template.body,
    buttonText: template.buttonText,
    buttonUrl: template.buttonUrl,
    whatsappEnabled: template.whatsappEnabled,
    whatsappMessage: template.whatsappMessage,
  })).toString("base64url");
  const button = template.buttonText && template.buttonUrl ? `<p><a href="${escapeHtml(template.buttonUrl)}">${escapeHtml(template.buttonText)}</a></p>` : "";
  return `<!--fgl-template:${metadata}--><h1>${escapeHtml(template.title)}</h1><p>${escapeHtml(template.body).replaceAll("\n", "<br>")}</p>${button}`;
}

export function hydrateTemplate(key: EmailTemplateKey, stored?: { subject: string; html: string; active: boolean } | null): EditableEmailTemplate {
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
      whatsappEnabled: parsed.whatsappEnabled ?? false,
      whatsappMessage: parsed.whatsappMessage ?? emailTemplateDefinitions[key].defaults.whatsappMessage,
    });
    return { key, ...parsedInput };
  } catch {
    return { ...emailTemplateDefinitions[key].defaults, subject: stored.subject, active: stored.active };
  }
}
