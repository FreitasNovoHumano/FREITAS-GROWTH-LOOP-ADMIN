import Link from "next/link";
import type { ReactNode } from "react";
import { ExternalLink, Gift, Target, UserRoundPlus, Users } from "lucide-react";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PublicLinkActions } from "@/components/campaigns/public-link-actions";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  calculateConversionRate,
  maskEmail,
  maskPhone,
  participantProgress,
} from "@/lib/client-area";
import { getClientCampaignDetail } from "@/lib/client-data";
import { requireTenant } from "@/lib/authorization";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { clientId } = await requireTenant();
  const result = await getClientCampaignDetail(clientId, id);
  if (!result) redirect("/dashboard/campaigns");

  const { campaign, funnel, rewardGrants } = result;
  const conversionRate = calculateConversionRate(
    campaign._count.leads,
    campaign._count.invitations,
  );

  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/dashboard">Visão geral</Link>
        <span aria-hidden="true">/</span>
        <Link href="/dashboard/campaigns">Campanhas</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{campaign.name}</span>
      </nav>
      <PageHeader
        eyebrow="DETALHES DA CAMPANHA"
        title={campaign.name}
        description={
          campaign.description || "Campanha de indicação Growth Loop."
        }
        action={
          <Link
            className="button secondary"
            href={`/growth-loop/${campaign.slug}`}
            target="_blank"
          >
            <ExternalLink size={17} aria-hidden="true" />
            Página pública
          </Link>
        }
      />

      <section className="metric-grid">
        <Metric label="Status" value={<StatusBadge status={campaign.status} />} />
        <Metric label="Participantes" value={campaign._count.participants} />
        <Metric label="Convites" value={campaign._count.invitations} />
        <Metric label="Leads" value={campaign._count.leads} />
        <Metric label="Conversão" value={`${conversionRate}%`} />
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Funil disponível</h2>
            <p>
              Somente etapas registradas tecnicamente pelo sistema são exibidas.
            </p>
          </div>
        </div>
        <div className="funnel-stages">
          {funnel.map((stage, index) => {
            const previous = index === 0 ? stage.value : funnel[index - 1].value;
            const rate =
              previous > 0
                ? Math.round((stage.value / previous) * 10_000) / 100
                : 0;
            return (
              <article key={stage.label}>
                <span>{index + 1}</span>
                <strong>{stage.value}</strong>
                <p>{stage.label}</p>
                {index > 0 && <small>{rate}% da etapa anterior</small>}
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Participantes recentes</h2>
            <p>Dados minimizados e limitados aos registros desta campanha.</p>
          </div>
        </div>
        {campaign.participants.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum participante cadastrado"
            description="Os participantes desta campanha aparecerão aqui."
          />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Participante</th>
                  <th>Contato protegido</th>
                  <th>Progresso</th>
                  <th>Status</th>
                  <th>Entrada</th>
                </tr>
              </thead>
              <tbody>
                {campaign.participants.map((participant) => {
                  const progress = participantProgress(
                    participant.qualifiedReferralCount,
                    campaign.qualifiedReferralGoal,
                  );
                  return (
                    <tr key={participant.id}>
                      <td>{participant.name}</td>
                      <td>
                        {maskEmail(participant.email)}
                        <br />
                        <small>{maskPhone(participant.phone)}</small>
                      </td>
                      <td>
                        {participant.qualifiedReferralCount} de{" "}
                        {campaign.qualifiedReferralGoal} · {progress}%
                      </td>
                      <td>
                        <StatusBadge status={participant.status} />
                      </td>
                      <td>{participant.createdAt.toLocaleDateString("pt-BR")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-head">
            <div>
              <h2>Indicações recentes</h2>
              <p>Últimos vínculos registrados nesta campanha.</p>
            </div>
          </div>
          {campaign.referrals.length === 0 ? (
            <EmptyState
              icon={Target}
              title="Nenhuma indicação registrada"
              description="As indicações desta campanha aparecerão aqui."
            />
          ) : (
            <ul className="activity-list">
              {campaign.referrals.map((referral) => (
                <li key={referral.id}>
                  <Target aria-hidden="true" />
                  <span>
                    <strong>
                      {referral.referrer.name} →{" "}
                      {referral.referred?.name ?? "Convidado"}
                    </strong>
                    <small>
                      {referral.clickedAt.toLocaleDateString("pt-BR")} ·{" "}
                      <StatusBadge status={referral.status} />
                    </small>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel">
          <div className="panel-head">
            <div>
              <h2>Leads recentes</h2>
              <p>Contatos originados exclusivamente desta campanha.</p>
            </div>
          </div>
          {campaign.leads.length === 0 ? (
            <EmptyState
              icon={UserRoundPlus}
              title="Nenhum lead encontrado"
              description="Quando uma indicação gerar um contato, ele aparecerá aqui."
            />
          ) : (
            <ul className="activity-list">
              {campaign.leads.map((lead) => (
                <li key={lead.id}>
                  <UserRoundPlus aria-hidden="true" />
                  <span>
                    <strong>{lead.name}</strong>
                    <small>
                      {maskEmail(lead.email)} · {maskPhone(lead.phone)}
                    </small>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Recompensas da campanha</h2>
            <p>Liberações e resgates registrados para esta campanha.</p>
          </div>
        </div>
        {rewardGrants.length === 0 ? (
          <EmptyState
            icon={Gift}
            title="Nenhuma recompensa disponível"
            description="As recompensas liberadas aparecerão aqui."
          />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Recompensa</th>
                  <th>Participante</th>
                  <th>Regra</th>
                  <th>Status</th>
                  <th>Liberação</th>
                </tr>
              </thead>
              <tbody>
                {rewardGrants.map((grant) => (
                  <tr key={grant.id}>
                    <td>{grant.reward.title}</td>
                    <td>{grant.participant.name}</td>
                    <td>{grant.milestone}</td>
                    <td>
                      <StatusBadge status={grant.status} />
                    </td>
                    <td>{grant.grantedAt.toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel public-link-panel">
        <Gift aria-hidden="true" />
        <span>
          <strong>Página pública da campanha</strong>
          <small>/growth-loop/{campaign.slug}</small>
        </span>
        <PublicLinkActions
          path={`/growth-loop/${campaign.slug}`}
          campaignName={campaign.name}
        />
      </section>
    </>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <article className="metric-card">
      <strong>{value}</strong>
      <p>{label}</p>
    </article>
  );
}
