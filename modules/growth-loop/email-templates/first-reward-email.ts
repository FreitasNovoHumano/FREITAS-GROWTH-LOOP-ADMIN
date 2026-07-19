import { escapeHtml } from "@/lib/email";
import { renderEmailTemplate } from "./template-utils";

type FirstRewardEmailInput = {
  participantName: string;
  campaignName: string;
  rewardTitle: string;
  rewardValue?: string | null;
  rewardUrl: string;
  inviteUrl: string;
  qualifiedReferralGoal: number;
  secondRewardTitle: string;
  customTemplate?: { subject: string; html: string } | null;
};

function invitationBlock(input: FirstRewardEmailInput) {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;border-collapse:collapse">
      <tr>
        <td style="padding:20px;border-radius:12px;background:#f4f0ff">
          <h2 style="margin:0 0 8px;color:#24183d;font-size:20px">Quer desbloquear ${escapeHtml(input.secondRewardTitle)}?</h2>
          <p style="margin:0 0 16px;color:#5e5670;line-height:1.6">
            Compartilhe seu link. Quando ${input.qualifiedReferralGoal} ${input.qualifiedReferralGoal === 1 ? "amigo resgatar" : "amigos resgatarem"} a primeira recompensa, você libera a próxima.
          </p>
          <a href="${escapeHtml(input.inviteUrl)}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#ffffff;color:#6842d8;font-weight:700;text-decoration:none">
            Convidar amigos
          </a>
        </td>
      </tr>
    </table>`;
}

function defaultHtml(input: FirstRewardEmailInput) {
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
                <h1 style="margin:0 0 16px;color:#1f1928;font-size:30px;line-height:1.2">Sua recompensa ${escapeHtml(input.rewardTitle)} chegou 🎁</h1>
                <p style="margin:0 0 12px;color:#5e5768;font-size:16px;line-height:1.6">Olá, ${escapeHtml(input.participantName)}! Seu cadastro foi concluído e sua primeira recompensa já está disponível.</p>
                ${input.rewardValue ? `<p style="margin:0 0 24px;color:#5e5768;line-height:1.6">${escapeHtml(input.rewardValue)}</p>` : ""}
                <a href="${escapeHtml(input.rewardUrl)}" style="display:inline-block;padding:14px 22px;border-radius:9px;background:#7650e8;color:#ffffff;font-weight:700;text-decoration:none">
                  Resgatar minha recompensa
                </a>
                ${invitationBlock(input)}
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

export function buildFirstRewardEmail(input: FirstRewardEmailInput) {
  const variables = {
    participantName: input.participantName,
    campaignName: input.campaignName,
    rewardTitle: input.rewardTitle,
    rewardValue: input.rewardValue ?? "",
    rewardUrl: input.rewardUrl,
    inviteUrl: input.inviteUrl,
    qualifiedReferralGoal: String(input.qualifiedReferralGoal),
    secondRewardTitle: input.secondRewardTitle,
  };
  const customHtml = input.customTemplate?.html;
  const renderedCustomHtml = customHtml ? renderEmailTemplate(customHtml, variables) : null;
  const customIncludesInviteUrl = customHtml ? /\{\{\s*inviteUrl\s*\}\}/.test(customHtml) : false;
  const html = renderedCustomHtml
    ? (customIncludesInviteUrl
      ? renderedCustomHtml
      : appendBeforeBodyEnd(renderedCustomHtml, invitationBlock(input)))
    : defaultHtml(input);

  return {
    subject: input.customTemplate
      ? renderEmailTemplate(input.customTemplate.subject, variables)
      : `Sua recompensa ${input.rewardTitle} chegou 🎁`,
    html,
    text: [
      `Olá, ${input.participantName}!`,
      `Sua recompensa ${input.rewardTitle} chegou: ${input.rewardUrl}`,
      `Convide amigos para desbloquear ${input.secondRewardTitle}.`,
      `Meta: ${input.qualifiedReferralGoal}. Seu link: ${input.inviteUrl}`,
    ].join("\n\n"),
  };
}
