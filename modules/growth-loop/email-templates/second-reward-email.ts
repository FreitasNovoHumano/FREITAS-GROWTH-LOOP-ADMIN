import { escapeHtml } from "@/lib/email";
import { renderEmailTemplate } from "./template-utils";

type SecondRewardEmailInput = {
  participantName: string;
  campaignName: string;
  rewardTitle: string;
  rewardValue?: string | null;
  rewardUrl: string;
  qualifiedReferralGoal: number;
  customTemplate?: { subject: string; html: string } | null;
};

function rewardButton(input: SecondRewardEmailInput) {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:24px;border-collapse:collapse">
      <tr>
        <td style="border-radius:9px;background:#7650e8">
          <a href="${escapeHtml(input.rewardUrl)}" style="display:inline-block;padding:14px 22px;color:#ffffff;font-weight:700;text-decoration:none">
            Acessar minha recompensa
          </a>
        </td>
      </tr>
    </table>`;
}

function defaultHtml(input: SecondRewardEmailInput) {
  const referralLabel = input.qualifiedReferralGoal === 1
    ? "1 amigo concluiu"
    : `${input.qualifiedReferralGoal} amigos concluíram`;

  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;background:#f5f3f8;font-family:Arial,sans-serif;color:#241f2d">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">
      <tr>
        <td align="center" style="padding:32px 16px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;border-collapse:collapse;background:#ffffff;border-radius:16px">
            <tr>
              <td style="padding:36px">
                <p style="margin:0 0 12px;color:#7650e8;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase">${escapeHtml(input.campaignName)}</p>
                <h1 style="margin:0 0 16px;color:#1f1928;font-size:30px;line-height:1.2">Você mereceu, aqui está sua recompensa ${escapeHtml(input.rewardTitle)} 🎉</h1>
                <p style="margin:0 0 12px;color:#5e5768;font-size:16px;line-height:1.6">Olá, ${escapeHtml(input.participantName)}! Sua indicação fez o loop crescer.</p>
                <p style="margin:0 0 12px;color:#5e5768;font-size:16px;line-height:1.6">${escapeHtml(referralLabel)} a participação e resgataram a primeira recompensa. Sua nova conquista está liberada.</p>
                ${input.rewardValue ? `<p style="margin:0 0 8px;color:#5e5768;font-size:16px;line-height:1.6">${escapeHtml(input.rewardValue)}</p>` : ""}
                ${rewardButton(input)}
                <p style="margin:28px 0 0;color:#8a8492;font-size:12px;line-height:1.5">Se o botão não funcionar, copie e cole este endereço no navegador:<br>${escapeHtml(input.rewardUrl)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function appendBeforeBodyEnd(html: string, content: string) {
  const bodyEnd = html.toLowerCase().lastIndexOf("</body>");
  return bodyEnd >= 0
    ? `${html.slice(0, bodyEnd)}${content}${html.slice(bodyEnd)}`
    : `${html}${content}`;
}

export function buildSecondRewardEmail(input: SecondRewardEmailInput) {
  const variables = {
    participantName: input.participantName,
    campaignName: input.campaignName,
    rewardTitle: input.rewardTitle,
    rewardValue: input.rewardValue ?? "",
    rewardUrl: input.rewardUrl,
    qualifiedReferralGoal: String(input.qualifiedReferralGoal),
  };
  const customHtml = input.customTemplate?.html;
  const renderedCustomHtml = customHtml ? renderEmailTemplate(customHtml, variables) : null;
  const customIncludesRewardUrl = customHtml ? /\{\{\s*rewardUrl\s*\}\}/.test(customHtml) : false;
  const html = renderedCustomHtml
    ? (customIncludesRewardUrl
      ? renderedCustomHtml
      : appendBeforeBodyEnd(renderedCustomHtml, rewardButton(input)))
    : defaultHtml(input);

  return {
    subject: input.customTemplate
      ? renderEmailTemplate(input.customTemplate.subject, variables)
      : `Você mereceu, aqui está sua recompensa ${input.rewardTitle} 🎉`,
    html,
    text: [
      `Olá, ${input.participantName}!`,
      `Você atingiu a meta de ${input.qualifiedReferralGoal} ${input.qualifiedReferralGoal === 1 ? "indicação qualificada" : "indicações qualificadas"} na campanha ${input.campaignName}.`,
      `Sua recompensa ${input.rewardTitle} está disponível: ${input.rewardUrl}`,
      input.rewardValue ?? "",
    ].filter(Boolean).join("\n\n"),
  };
}
