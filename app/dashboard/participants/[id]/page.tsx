import Link from "next/link";
import type { ReactNode } from "react";
import { Gift, Target } from "lucide-react";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  maskEmail,
  maskPhone,
  participantProgress,
} from "@/lib/client-area";
import { getClientParticipantDetail } from "@/lib/client-data";
import { requireTenant } from "@/lib/authorization";

export default async function ParticipantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { clientId } = await requireTenant();
  const participant = await getClientParticipantDetail(clientId, id);
  if (!participant) redirect("/dashboard/participants");

  const progress = participantProgress(
    participant.qualifiedReferralCount,
    participant.campaign.qualifiedReferralGoal,
  );

  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/dashboard">Visão geral</Link>
        <span aria-hidden="true">/</span>
        <Link href="/dashboard/participants">Participantes</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{participant.name}</span>
      </nav>
      <PageHeader
        eyebrow="PARTICIPANTE"
        title={participant.name}
        description={`Dados permitidos e histórico na campanha ${participant.campaign.name}.`}
      />

      <section className="metric-grid">
        <Metric label="Status">
          <StatusBadge status={participant.status} />
        </Metric>
        <Metric label="Contato">
          {maskEmail(participant.email)}
          <small>{maskPhone(participant.phone)}</small>
        </Metric>
        <Metric label="Indicações qualificadas">
          {participant.qualifiedReferralCount}
        </Metric>
        <Metric label="Progresso">
          {progress}%
          <div className="progress">
            <span style={{ width: `${progress}%` }} />
          </div>
        </Metric>
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel-head">
            <div>
              <h2>Histórico de indicações</h2>
              <p>Registros associados a este participante.</p>
            </div>
          </div>
          {participant.referrals.length === 0 ? (
            <EmptyState
              icon={Target}
              title="Nenhuma indicação registrada"
              description="As indicações deste participante aparecerão aqui."
            />
          ) : (
            <ul className="activity-list">
              {participant.referrals.map((referral) => (
                <li key={referral.id}>
                  <Target aria-hidden="true" />
                  <span>
                    <strong>{referral.referred?.name ?? "Convidado"}</strong>
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
              <h2>Recompensas</h2>
              <p>Histórico de liberações e resgates.</p>
            </div>
          </div>
          {participant.grants.length === 0 ? (
            <EmptyState
              icon={Gift}
              title="Nenhuma recompensa disponível"
              description="As recompensas deste participante aparecerão aqui."
            />
          ) : (
            <ul className="activity-list">
              {participant.grants.map((grant) => (
                <li key={grant.id}>
                  <Gift aria-hidden="true" />
                  <span>
                    <strong>{grant.reward.title}</strong>
                    <small>
                      {grant.grantedAt.toLocaleDateString("pt-BR")} ·{" "}
                      <StatusBadge status={grant.status} />
                    </small>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </>
  );
}

function Metric({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <article className="metric-card detail-metric">
      <strong>{children}</strong>
      <p>{label}</p>
    </article>
  );
}
